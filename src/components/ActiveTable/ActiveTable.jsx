import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../../hooks/use-auth-client";
import { BigNumber, ethers } from "ethers";
import { toast } from "react-toastify";
import styles from "./index.module.css";

export const ActiveTable = () => {
  const {
    getLoansForUserCollaterals,
    getActiveLoansForUser,
    acceptLoan,
    cancelLoan,
    contracts,
    account,
  } = useAuth();

  const [collateralOffers, setCollateralOffers] = useState([]);
  const [myActiveLoans, setMyActiveLoans] = useState([]);
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState({});

  const fetchLoans = async () => {
    try {
      const offers = await getLoansForUserCollaterals(account);
      const activeLoans = await getActiveLoansForUser(account);

      setCollateralOffers(offers);
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

  const filteredCollateralOffers = collateralOffers?.filter(
    (offer) =>
      offer.accepted ||
      (offer.accepted === false &&
        BigNumber.from(offer.acceptedLoanId).toNumber() === 0)
  );

  return (
    <div className={styles.loanContainer}>
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
                <td>{loan.stockName}</td>
                <td>{loan.quantity?.toString()}</td>
                <td>{loan.collateralOwner}</td>
                <td>
                  {((BigNumber.from(loan.interestRate).toNumber()) / 100).toString()}%
                </td>
                <td>
                  ${ethers.utils?.formatUnits(loan.loanAmount, 18)}
                </td>
                <td>{loan.duration?.toString()} months</td>
                <td>
                  {!loan.accepted ? (
                    BigNumber.from(loan.acceptedLoanId).toNumber() !== 0 ? (
                      <Button
                        color="error"
                        onClick={() => handleCancelLoan(loan.loanId)}
                        disabled={loadingCancel[loan.loanId]}
                      >
                        {loadingCancel[loan.loanId] ? (
                          <CircularProgress size={24} />
                        ) : (
                          "Reclaim"
                        )}
                      </Button>
                    ) : (
                      <Button
                        color="error"
                        onClick={() => handleCancelLoan(loan.loanId)}
                        disabled={loadingCancel[loan.loanId]}
                      >
                        {loadingCancel[loan.loanId] ? (
                          <CircularProgress size={24} />
                        ) : (
                          "Cancel"
                        )}
                      </Button>
                    )
                  ) : (
                    <Button disabled>Accepted</Button>
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
