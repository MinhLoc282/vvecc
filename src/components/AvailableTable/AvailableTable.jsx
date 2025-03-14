import { useState, useEffect } from "react";
import { CircularProgress, Button } from "@mui/material";
import { useAuth } from "../../hooks/use-auth-client";
import { BigNumber, ethers } from "ethers";
import { toast } from "react-toastify";
import styles from "./index.module.css";

export const AvailableTable = () => {
  const {
    getLoansForUserCollaterals,
    acceptLoan,
    cancelLoan,
    contracts,
    account,
  } = useAuth();

  const [collateralOffers, setCollateralOffers] = useState([]);
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState({});
  const [loadingPayInterest, setLoadingPayInterest] = useState({});
  const [loadingRepay, setLoadingRepay] = useState({});
  const [loadingFullPayment, setLoadingFullPayment] = useState({});
  const [loadingApproveInterest, setLoadingApproveInterest] = useState({}); 
  const [loadingApproveRepay, setLoadingApproveRepay] = useState({});
  const [loadingApproveFullPayment, setLoadingApproveFullPayment] = useState({});
  const [approvedInterestLoans, setApprovedInterestLoans] = useState({});
  const [approvedRepayLoans, setApprovedRepayLoans] = useState({});
  const [approvedFullPaymentLoans, setApprovedFullPaymentLoans] = useState({});
  const [paymentStatus, setPaymentStatus] = useState({});
  const [monthsToPay, setMonthsToPay] = useState({});

  const getLoanPaymentStatus = (loan) => {
    if (!loan.accepted) {
      return { 
        status: "Pending", 
        nextPaymentDue: null, 
        isOverdue: false,
        requiresRepayment: false 
      };
    }

    const startTime = BigNumber.from(loan.startTime).toNumber();
    const duration = BigNumber.from(loan.duration).toNumber();
    const nextInterestDue = BigNumber.from(loan.nextInterestDue).toNumber();
    const status = BigNumber.from(loan.status).toNumber();
    const interestPaidMonths = BigNumber.from(loan.interestPaidMonths).toNumber();
    const currentTime = Math.floor(Date.now() / 1000);

    if (status === 1) {
      return { 
        status: "Fully Repaid", 
        nextPaymentDue: null, 
        isOverdue: false,
        requiresRepayment: false
      };
    } else if (status === 2) {
      return { 
        status: "Defaulted", 
        nextPaymentDue: null, 
        isOverdue: true,
        requiresRepayment: false
      };
    }

    if (startTime === 0) {
      return { 
        status: "Not Started", 
        nextPaymentDue: null, 
        isOverdue: false,
        requiresRepayment: false
      };
    }

    const allInterestPaid = interestPaidMonths >= duration;

    const loanEndTime = startTime + (duration * 30 * 24 * 60 * 60);
    const loanPeriodEnded = currentTime > loanEndTime;

    if (allInterestPaid || loanPeriodEnded) {
      return { 
        status: "Principal Payment Due", 
        nextPaymentDue: null, 
        isOverdue: loanPeriodEnded,
        requiresRepayment: true
      };
    }

    if (nextInterestDue > 0) {
      const isOverdue = currentTime > nextInterestDue;
      return {
        status: isOverdue ? "Interest Overdue" : "Interest Due Soon",
        nextPaymentDue: nextInterestDue,
        isOverdue,
        requiresRepayment: true
      };
    }

    return { 
      status: "Current", 
      nextPaymentDue: null, 
      isOverdue: false,
      requiresRepayment: true
    };
  };

  const calculateRemainingMonths = (loan) => {
    if (!loan.accepted) return 0;
    
    const duration = BigNumber.from(loan.duration).toNumber();
    const interestPaidMonths = BigNumber.from(loan.interestPaidMonths).toNumber();
    
    const remainingMonths = duration - interestPaidMonths;
    
    return remainingMonths > 0 ? remainingMonths : 0;
  };

  const calculateRemainingInterest = (loan) => {
    const remainingMonths = calculateRemainingMonths(loan);
    const interestPerMonth = calculateMonthlyInterest(loan.loanAmount, loan.interestRate);
    return interestPerMonth.mul(BigNumber.from(remainingMonths));
  };

  const calculateFullPaymentAmount = (loan) => {
    const remainingInterest = calculateRemainingInterest(loan);
    return BigNumber.from(loan.loanAmount).add(remainingInterest);
  };


  const isLoanFullyRepaid = (loan) => {
    if (!loan || !loan.status) return false;
    return BigNumber.from(loan.status).toNumber() === 1;
  };

  const fetchLoans = async () => {
    try {
      const offers = await getLoansForUserCollaterals(account);
      setCollateralOffers(offers);

      const statusMap = {};
      const monthsMap = {};
      offers.forEach((offer) => {
        if (offer.accepted) {
          statusMap[offer.loanId] = getLoanPaymentStatus(offer);

          monthsMap[offer.loanId] = 1;
        }
      });
      setPaymentStatus(statusMap);
      setMonthsToPay(prevMonths => {
        const newMonths = { ...prevMonths };
        Object.keys(monthsMap).forEach(loanId => {
          if (!prevMonths[loanId]) {
            newMonths[loanId] = monthsMap[loanId];
          }
        });
        return newMonths;
      });
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  };

  useEffect(() => {
    if (contracts.loan) {
      fetchLoans();

      const intervalId = setInterval(fetchLoans, 60000);
      return () => clearInterval(intervalId);
    }
  }, [getLoansForUserCollaterals, contracts, account]);

  const handleAcceptLoan = async (loanId) => {
    setLoadingAccept(true);
    try {
      await acceptLoan(loanId);
      fetchLoans();
      toast.success("Loan accepted successfully!");
    } catch (error) {
      console.error("Error accepting loan:", error);
      toast.error("Failed to accept loan.");
    } finally {
      setLoadingAccept(false);
    }
  };

  const handleCancelLoan = async (loanId) => {
    setLoadingCancel((prev) => ({ ...prev, [loanId]: true }));
    try {
      await cancelLoan(loanId);
      fetchLoans();
      toast.success("Loan canceled successfully!");
    } catch (error) {
      console.error("Error canceling loan:", error);
      toast.error("Failed to cancel loan.");
    } finally {
      setLoadingCancel((prev) => ({ ...prev, [loanId]: false }));
    }
  };

  const handleApproveInterest = async (loanId, amount) => {
    setLoadingApproveInterest((prev) => ({ ...prev, [loanId]: true }));
    try {
      const totalAmount = amount.mul(BigNumber.from(monthsToPay[loanId] || 1));
      const approveTx = await contracts.token.approve(contracts.loan.address, totalAmount);
      await approveTx.wait();
      setApprovedInterestLoans((prev) => ({ ...prev, [loanId]: true }));
      toast.success("Interest approval successful!");
    } catch (error) {
      console.error("Error approving interest amount:", error);
      toast.error("Failed to approve interest amount.");
    } finally {
      setLoadingApproveInterest((prev) => ({ ...prev, [loanId]: false }));
    }
  };

  const handleApproveRepay = async (loanId, amount) => {
    setLoadingApproveRepay((prev) => ({ ...prev, [loanId]: true }));
    try {
      const approveTx = await contracts.token.approve(contracts.loan.address, amount);
      await approveTx.wait();
      setApprovedRepayLoans((prev) => ({ ...prev, [loanId]: true }));
      toast.success("Repay approval successful!");
    } catch (error) {
      console.error("Error approving repay amount:", error);
      toast.error("Failed to approve repay amount.");
    } finally {
      setLoadingApproveRepay((prev) => ({ ...prev, [loanId]: false }));
    }
  };

  const handleApproveFullPayment = async (loanId, loan) => {
    setLoadingApproveFullPayment((prev) => ({ ...prev, [loanId]: true }));
    try {
      const fullAmount = calculateFullPaymentAmount(loan);
      const approveTx = await contracts.token.approve(contracts.loan.address, fullAmount);
      await approveTx.wait();
      setApprovedFullPaymentLoans((prev) => ({ ...prev, [loanId]: true }));
      toast.success("Full payment approval successful!");
    } catch (error) {
      console.error("Error approving full payment amount:", error);
      toast.error("Failed to approve full payment amount.");
    } finally {
      setLoadingApproveFullPayment((prev) => ({ ...prev, [loanId]: false }));
    }
  };

  const handlePayInterest = async (loanId, months) => {
    setLoadingPayInterest((prev) => ({ ...prev, [loanId]: true }));
    try {
      const tx = await contracts.loan.payInterest(loanId, months || 1);
      await tx.wait();
      setApprovedInterestLoans((prev) => ({ ...prev, [loanId]: false }));
      fetchLoans();
      toast.success(`Interest payment for ${months || 1} month(s) successful!`);
    } catch (error) {
      console.error("Error paying interest:", error);
      toast.error("Failed to pay interest.");
    } finally {
      setLoadingPayInterest((prev) => ({ ...prev, [loanId]: false }));
    }
  };

  const handleRepayLoan = async (loanId) => {
    setLoadingRepay((prev) => ({ ...prev, [loanId]: true }));
    try {
      const tx = await contracts.loan.repayLoan(loanId);
      await tx.wait();
      setApprovedRepayLoans((prev) => ({ ...prev, [loanId]: false }));
      fetchLoans();
      toast.success("Loan repaid successfully!");
    } catch (error) {
      console.error("Error repaying loan:", error);
      toast.error("Failed to repay loan.");
    } finally {
      setLoadingRepay((prev) => ({ ...prev, [loanId]: false }));
    }
  };

  const handleMakeFullPayment = async (loanId) => {
    setLoadingFullPayment((prev) => ({ ...prev, [loanId]: true }));
    try {
      const tx = await contracts.loan.makeFullPayment(loanId);
      await tx.wait();
      setApprovedFullPaymentLoans((prev) => ({ ...prev, [loanId]: false }));
      fetchLoans();
      toast.success("Full loan payment successful!");
    } catch (error) {
      console.error("Error making full payment:", error);
      toast.error("Failed to make full payment.");
    } finally {
      setLoadingFullPayment((prev) => ({ ...prev, [loanId]: false }));
    }
  };

  const handleMonthsChange = (loanId, newValue) => {
    const loan = collateralOffers.find(loan => loan.loanId === loanId);
    if (!loan) return;
    
    const remainingMonths = calculateRemainingMonths(loan);
    const value = Math.min(Math.max(1, newValue), remainingMonths);
    
    setMonthsToPay(prev => ({
      ...prev,
      [loanId]: value
    }));
    
    if (approvedInterestLoans[loanId]) {
      setApprovedInterestLoans(prev => ({
        ...prev,
        [loanId]: false
      }));
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const calculateMonthlyInterest = (loanAmount, interestRate) => {
    return BigNumber.from(loanAmount).mul(BigNumber.from(interestRate)).div(12 * 10000);
  };

  const filteredCollateralOffers = collateralOffers?.filter(
    (offer) =>
      offer.accepted ||
      (offer.accepted === false &&
        BigNumber.from(offer.acceptedLoanId).toNumber() === 0)
  );

  const isPaymentOverdue = (statusInfo) => {
    if (!statusInfo) return false;
    return statusInfo.isOverdue;
  };

  return (
    <div className={styles.loanContainer}>
      <h2>Available Loan Offers</h2>
      <table className={styles.loanTable}>
        <thead>
          <tr>
            <th>Stock</th>
            <th>Quantity</th>
            <th>Lender</th>
            <th>Interest Rate</th>
            <th>Loan Amount</th>
            <th>Duration</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredCollateralOffers.length === 0 ? (
            <tr>
              <td colSpan="8" className={styles.noData}>
                No available collateral offers found
              </td>
            </tr>
          ) : (
            filteredCollateralOffers?.map((offer) => {
              const loanStatus = paymentStatus[offer.loanId];
              const isRepaid = offer.accepted && BigNumber.from(offer.status).toNumber() === 1; // Repaid = 1
              const needsRepayment = offer.accepted && loanStatus?.requiresRepayment;
              
              return (
                <tr
                  key={offer.loanId}
                  className={
                    offer.accepted && isPaymentOverdue(loanStatus)
                      ? styles.overdueRow
                      : ""
                  }
                >
                  <td>{offer.stockName}</td>
                  <td>{offer.quantity?.toString()}</td>
                  <td>{`${offer.lender.slice(0, 6)}...${offer.lender.slice(-4)}`}</td>
                  <td>
                    {BigNumber.from(offer.interestRate).toNumber() / 100}%
                  </td>
                  <td>${ethers.utils?.formatUnits(offer.loanAmount, 18)}</td>
                  <td>{offer.duration?.toString()} months</td>
                  <td>
                    {offer.accepted ? (
                      <div className={styles.paymentInfo}>
                        <p
                          className={
                            isPaymentOverdue(loanStatus)
                              ? styles.overdue
                              : isRepaid ? styles.repaid : ""
                          }
                        >
                          <strong>
                            {isRepaid ? "✓ Fully Repaid" : loanStatus?.status || "Loading..."}
                          </strong>
                        </p>
                        
                        {!isRepaid && loanStatus?.nextPaymentDue && (
                          <p>
                            Next Payment:{" "}
                            {formatDate(loanStatus.nextPaymentDue)}
                          </p>
                        )}
                        
                        {offer.interestPaidMonths && !isRepaid && (
                          <p>
                            Paid: {offer.interestPaidMonths.toString()}/{offer.duration.toString()} months
                            {BigNumber.from(offer.interestPaidMonths).gte(offer.duration) && 
                             " (All interest paid)"}
                          </p>
                        )}
                        
                        {!isRepaid && (
                          <p className={needsRepayment ? styles.needsRepayment : styles.noRepaymentNeeded}>
                            {needsRepayment ? "Repayment required" : "No repayment needed"}
                          </p>
                        )}
                      </div>
                    ) : (
                      "Pending"
                    )}
                  </td>
                  <td>
                    {!offer.accepted ? (
                      <Button
                        onClick={() => handleAcceptLoan(offer.loanId)}
                        disabled={loadingAccept}
                        variant="contained"
                        color="primary"
                        className={styles.actionButton}
                      >
                        {loadingAccept ? (
                          <CircularProgress size={24} />
                        ) : (
                          "Accept"
                        )}
                      </Button>
                    ) : isRepaid ? (
                      <div className={styles.repaidMessage}>
                        Loan fully repaid
                      </div>
                    ) : (
                      <div className={styles.actionButtons}>
                        {calculateRemainingMonths(offer) > 0 && (
                          <div className={styles.paymentSection}>
                            <div className={styles.monthSelector}>
                              <label>Months:</label>
                              <input
                                type="number"
                                min="1"
                                max={calculateRemainingMonths(offer)}
                                value={monthsToPay[offer.loanId] || 1}
                                onChange={(e) => handleMonthsChange(offer.loanId, parseInt(e.target.value))}
                                className={styles.monthInput}
                              />
                            </div>
                            {!approvedInterestLoans[offer.loanId] ? (
                              <Button
                                onClick={() =>
                                  handleApproveInterest(
                                    offer.loanId,
                                    calculateMonthlyInterest(offer.loanAmount, offer.interestRate)
                                  )
                                }
                                disabled={loadingApproveInterest[offer.loanId]}
                                variant="contained"
                                color="primary"
                                className={styles.actionButton}
                              >
                                {loadingApproveInterest[offer.loanId] ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  "Approve Interest"
                                )}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handlePayInterest(offer.loanId, monthsToPay[offer.loanId])}
                                disabled={loadingPayInterest[offer.loanId]}
                                variant="contained"
                                color="secondary"
                                className={styles.actionButton}
                              >
                                {loadingPayInterest[offer.loanId] ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  `Pay ${Number(
                                    parseFloat(
                                      ethers.utils.formatUnits(
                                        calculateMonthlyInterest(offer.loanAmount, offer.interestRate).mul(BigNumber.from(monthsToPay[offer.loanId] || 1)),
                                        18
                                      )
                                    ).toFixed(4)
                                  )} USDT Interest`
                                )}
                              </Button>
                            )}
                          </div>
                        )}

                        <div className={styles.paymentSection}>
                          {!approvedFullPaymentLoans[offer.loanId] ? (
                            <Button
                              onClick={() => handleApproveFullPayment(offer.loanId, offer)}
                              disabled={loadingApproveFullPayment[offer.loanId]}
                              variant="contained"
                              color="primary"
                              className={styles.actionButton}
                            >
                              {loadingApproveFullPayment[offer.loanId] ? (
                                <CircularProgress size={20} />
                              ) : (
                                "Approve Full Payment"
                              )}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleMakeFullPayment(offer.loanId)}
                              disabled={loadingFullPayment[offer.loanId]}
                              variant="contained"
                              color="success"
                              className={styles.actionButton}
                            >
                              {loadingFullPayment[offer.loanId] ? (
                                <CircularProgress size={20} />
                              ) : (
                                `Pay ${Number(
                                  parseFloat(
                                    ethers.utils.formatUnits(
                                      calculateFullPaymentAmount(offer),
                                      18
                                    )
                                  ).toFixed(4)
                                )} USDT Full Payment`
                              )}
                            </Button>
                          )}
                        </div>

                        {calculateRemainingMonths(offer) <= 0 && (
                          <div className={styles.paymentSection}>
                            {!approvedRepayLoans[offer.loanId] ? (
                              <Button
                                onClick={() =>
                                  handleApproveRepay(
                                    offer.loanId,
                                    offer.loanAmount
                                  )
                                }
                                disabled={loadingApproveRepay[offer.loanId]}
                                variant="contained"
                                color="primary"
                                className={styles.actionButton}
                              >
                                {loadingApproveRepay[offer.loanId] ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  "Approve Repay"
                                )}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleRepayLoan(offer.loanId)}
                                disabled={loadingRepay[offer.loanId]}
                                variant="contained"
                                color="primary"
                                className={styles.actionButton}
                              >
                                {loadingRepay[offer.loanId] ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  `Repay ${ethers.utils.formatUnits(offer.loanAmount, 18)} USDT Loan`
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};