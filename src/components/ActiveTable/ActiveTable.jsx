import { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import { useAuth } from "../../hooks/use-auth-client";
import { BigNumber, ethers } from "ethers";
import { toast } from "react-toastify";
import useTheme from "../../hooks/useTheme";
import styles from "./index.module.css";
import { bytes32ToString } from "../../utils";

export const ActiveTable = () => {
  const {
    getLoansForUserCollaterals,
    getActiveLoansForUser,
    acceptLoan,
    cancelLoan,
    contracts,
    account,
  } = useAuth();

  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";

  const [myActiveLoans, setMyActiveLoans] = useState([]);
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState({});

  const fetchLoans = async () => {
    try {
      const activeLoans = await getActiveLoansForUser(account);

      setMyActiveLoans(activeLoans);
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  };

  useEffect(() => {
    if (contracts.loan) {
      fetchLoans();
    }
  }, [getLoansForUserCollaterals, getActiveLoansForUser, contracts, account]);

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
  return (
    <div className={`${styles.loanContainer} ${isDarkMode ? styles.dark : ""}`}>
      <table className={styles.loanTable}>
        <thead>
          <tr>
            <th>Stock</th>
            <th>Quantity</th>
            <th>Borrower</th>
            <th>Interest Rate</th>
            <th>Loan Amount</th>
            <th>Duration</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {myActiveLoans.length === 0 ? (
            <tr>
              <td colSpan="7" className={styles.noData}>
                No active loans found
              </td>
            </tr>
          ) : (
            myActiveLoans?.map((loan) => (
              <tr key={loan.loanId}>
                <td>{bytes32ToString(loan.collateral.stockName)}</td>
                <td>{loan.collateral.quantity?.toString()}</td>
                <td>{loan.collateral.owner}</td>
                <td>
                  {((BigNumber.from(loan.interestRate).toNumber()) / 100).toString()}%
                </td>
                <td>
                  ${ethers.utils?.formatUnits(loan.loanAmount, 18)}
                </td>
                <td>{loan.duration?.toString()} months</td>                <td>
                  {!loan.accepted ? (
                    BigNumber.from(loan.acceptedLoanId).toNumber() !== 0 ? (
                      <button
                        className={styles.loanButton}
                        onClick={() => handleCancelLoan(loan.loanId)}
                        disabled={loadingCancel[loan.loanId]}
                      >
                        {loadingCancel[loan.loanId] ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          "Reclaim"
                        )}
                      </button>
                    ) : (
                      <button
                        className={styles.loanButton}
                        onClick={() => handleCancelLoan(loan.loanId)}
                        disabled={loadingCancel[loan.loanId]}
                      >
                        {loadingCancel[loan.loanId] ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          "Cancel"
                        )}
                      </button>
                    )
                  ) : (
                    <button className={`${styles.loanButton} ${styles.acceptedButton}`} disabled>
                      Accepted
                    </button>
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
