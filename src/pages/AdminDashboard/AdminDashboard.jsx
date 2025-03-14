import React, { useEffect, useState } from "react";
import styles from "./index.module.css";
import { ArrowUpDown, Check, ChevronDown, Filter, Search } from "lucide-react";
import useClickOutSide from "../../hooks/useClickOutSide";
import { TabLoan } from "../../components/TabLoan/TabLoan";
import { TabMarket } from "../../components/TabMarket/TabMarket";
import { useAuth } from "../../hooks/use-auth-client";
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
  Modal,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { AvailableTable } from "../../components/AvailableTable/AvailableTable";
import { ActiveTable } from "../../components/ActiveTable/ActiveTable";

export const AdminDashboard = () => {
  const { getPendingCollaterals, updateCollateralStatus, contracts } =
    useAuth();
  const [collateralRequests, setCollateralRequests] = useState([]);
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [loadingDecline, setLoadingDecline] = useState(false);

  useEffect(() => {
    if (contracts.loan) {
      const fetchCollaterals = async () => {
        try {
          const collaterals = await getPendingCollaterals();
          const formattedCollaterals = collaterals.map((collateral) => ({
            id: BigNumber.from(collateral.collateralId).toNumber(),
            owner: collateral.owner,
            stockName: collateral.stockName,
            quantity: BigNumber.from(collateral.quantity).toNumber(),
            status: collateral.status === 0 
                ? "Pending" 
                : collateral.status === 1 
                ? "Approved" 
                : collateral.status === 2 
                ? "Declined" 
                : "Cancelled",
            acceptedLoanId: BigNumber.from(collateral.acceptedLoanId).toNumber(),
          }))
          setCollateralRequests(formattedCollaterals);
        } catch (error) {
          console.error("Error fetching pending collaterals:", error);
        }
      };

      fetchCollaterals();
    }
  }, [getPendingCollaterals, contracts]);

  const handleApprove = async (id) => {
    setLoadingApprove(true);
    try {
      await updateCollateralStatus(id, 1);
      setCollateralRequests(
        collateralRequests.map((request) =>
          request.id === id ? { ...request, status: "Approved" } : request
        )
      );
      toast.success("Collateral approved successfully!");
    } catch (error) {
      console.error("Error approving collateral:", error);
      toast.error("Failed to approve collateral.");
    } finally {
      setLoadingApprove(false);
    }
  };

  const handleDecline = async (id) => {
    setLoadingDecline(true);
    try {
      await updateCollateralStatus(id, 2);
      setCollateralRequests(
        collateralRequests.map((request) =>
          request.id === id ? { ...request, status: "Declined" } : request
        )
      );
      toast.success("Collateral declined successfully!");
    } catch (error) {
      console.error("Error declining collateral:", error);
      toast.error("Failed to decline collateral.");
    } finally {
      setLoadingDecline(false);
    }
  };
  return (
    <div className={styles.wrapContainer}>
      <div className={styles.container}>
        <div className={styles.wrapFirstContent}>
          <div className={styles.content}>
            <h1 className={styles.title}>Admin Dashboard</h1>
          </div>
        </div>

        <div className={styles.wrapThirdContent}>
          <div className={styles.wrapTabContainer}>
            <div className={styles.wrapContent}>
              {collateralRequests.length === 0 ? (
                <Typography
                  variant="h6"
                  color="textSecondary"
                  sx={{ textAlign: "center", marginTop: 3 }}
                >
                  No pending collaterals
                </Typography>
              ) : (
                <div
                  className={styles.loanContainer}
                  component={Paper}
                  sx={{ backgroundColor: "white" }}
                >
                  <table className={styles.loanTable}>
                    <thead>
                      <tr>
                        <th sx={{ fontWeight: "bold" }}>Stock Name</th>
                        <th sx={{ fontWeight: "bold" }}>Quantity</th>
                        <th sx={{ fontWeight: "bold" }}>Status</th>
                        <th sx={{ fontWeight: "bold" }}>Owner</th>
                        <th sx={{ fontWeight: "bold" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collateralRequests.map((request) => (
                        <tr key={request.id}>
                          <td>{request.stockName}</td>
                          <td>{request.quantity}</td>
                          <td>{request.status}</td>
                          <td>{request.owner}</td>
                          <td>
                            {request.status === "Pending" && (
                              <>
                                <Button
                                  variant="contained"
                                  sx={{ marginRight: 1 }}
                                  onClick={() => handleApprove(request.id)}
                                  disabled={loadingApprove}
                                >
                                  {loadingApprove ? (
                                    <CircularProgress
                                      size={24}
                                      sx={{ color: "white" }}
                                    />
                                  ) : (
                                    "Approve"
                                  )}
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleDecline(request.id)}
                                  disabled={loadingDecline}
                                >
                                  {loadingDecline ? (
                                    <CircularProgress
                                      size={24}
                                      sx={{ color: "red" }}
                                    />
                                  ) : (
                                    "Decline"
                                  )}
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
