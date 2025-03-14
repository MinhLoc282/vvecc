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
    payInterest,
    repayLoan,
    getLoanPaymentStatus,
    contracts,
    account,
  } = useAuth();

  const [collateralOffers, setCollateralOffers] = useState([]);
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState({});
  const [loadingPayInterest, setLoadingPayInterest] = useState({});
  const [loadingRepay, setLoadingRepay] = useState({});
  const [loadingApproveInterest, setLoadingApproveInterest] = useState({}); // State for interest approval
  const [loadingApproveRepay, setLoadingApproveRepay] = useState({}); // State for repay approval
  const [approvedInterestLoans, setApprovedInterestLoans] = useState({}); // Track interest approvals
  const [approvedRepayLoans, setApprovedRepayLoans] = useState({}); // Track repay approvals
  const [paymentStatus, setPaymentStatus] = useState({});

  const fetchLoans = async () => {
    try {
      const offers = await getLoansForUserCollaterals(account);
      setCollateralOffers(offers);

      const acceptedOffers = offers.filter((offer) => offer.accepted);

      // Fetch payment status for each active loan
      const statusPromises = acceptedOffers.map(async (offer) => {
        const status = await getLoanPaymentStatus(offer.loanId);
        return { loanId: offer.loanId, status };
      });

      const statuses = await Promise.all(statusPromises);
      const statusMap = {};
      statuses.forEach((item) => {
        statusMap[item.loanId] = item.status;
      });
      setPaymentStatus(statusMap);
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
      const approveTx = await contracts.token.approve(contracts.loan.address, amount);
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

  const handlePayInterest = async (loanId) => {
    setLoadingPayInterest((prev) => ({ ...prev, [loanId]: true }));
    try {
      await payInterest(loanId);
      fetchLoans();
      toast.success("Interest payment successful!");
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
      await repayLoan(loanId);
      fetchLoans();
      toast.success("Loan repaid successfully!");
    } catch (error) {
      console.error("Error repaying loan:", error);
      toast.error("Failed to repay loan.");
    } finally {
      setLoadingRepay((prev) => ({ ...prev, [loanId]: false }));
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
            filteredCollateralOffers?.map((offer) => (
              <tr
                key={offer.loanId}
                className={
                  offer.accepted && isPaymentOverdue(paymentStatus[offer.loanId])
                    ? styles.overdueRow
                    : ""
                }
              >
                <td>{offer.stockName}</td>
                <td>{offer.quantity?.toString()}</td>
                <td>{offer.lender}</td>
                <td>
                  {BigNumber.from(offer.interestRate).toNumber() / 100}%
                </td>
                <td>${ethers.utils?.formatUnits(offer.loanAmount, 18)}</td>
                <td>{offer.duration?.toString()} months</td>
                <td>
                  {offer.accepted ? (
                    <div className={styles.paymentInfo}>
                      <p>
                        Next Payment:{" "}
                        {paymentStatus[offer.loanId]
                          ? formatDate(paymentStatus[offer.loanId].nextPaymentDue)
                          : "Loading..."}
                      </p>
                      <p
                        className={
                          isPaymentOverdue(paymentStatus[offer.loanId])
                            ? styles.overdue
                            : ""
                        }
                      >
                        {isPaymentOverdue(paymentStatus[offer.loanId])
                          ? "OVERDUE"
                          : "Current"}
                      </p>
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
                  ) : (
                    <div className={styles.actionButtons}>
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
                          onClick={() => handlePayInterest(offer.loanId)}
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
                                  calculateMonthlyInterest(offer.loanAmount, offer.interestRate),
                                  18
                                )
                              ).toFixed(4)
                            )} USDT Interest`
                          )}
                        </Button>
                      )}
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
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};