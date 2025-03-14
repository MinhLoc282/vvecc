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
import { BigNumber } from 'ethers';
import { toast } from "react-toastify";

export const MyLoanPage = () => {
  const tabs = [
    { id: "Collateral", label: "My Collateral" },
    { id: "Available", label: "Available Collateral Offers" },
  ];
  const { getUserCollaterals, addCollateral, updateCollateralStatus, account } =
    useAuth();
  const [collaterals, setCollaterals] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [stockName, setStockName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Collateral");

  const fetchCollaterals = async () => {
    try {
      setLoading(true);
      const userCollaterals = await getUserCollaterals(account);

      const formattedCollaterals = userCollaterals.map((collateral) => ({
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
      setCollaterals(formattedCollaterals);
    } catch (error) {
      console.error("Error fetching collaterals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollateral = async () => {
    if (!stockName || !quantity) return;

    try {
      setLoading(true);
      await addCollateral(stockName, parseInt(quantity, 10));
      fetchCollaterals();
      handleCloseModal();
      toast.success("Added collaterals successfully!");
    } catch (error) {
      console.error("Error adding collateral:", error);
      toast.error("Failed to add collateral.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (collateralId) => {
    try {
      setLoading(true);
      await updateCollateralStatus(collateralId, 3);
      fetchCollaterals();
      toast.success("Cancel collaterals successfully!");
    } catch (error) {
      console.error("Error cancelling collateral:", error);
      toast.error("Failed to cancel collateral.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setStockName("");
    setQuantity("");
  };

  useEffect(() => {
    if (account) fetchCollaterals();
  }, [account]);

  return (
    <div className={styles.wrapContainer}>
      <div className={styles.container}>
        <div className={styles.wrapFirstContent}>
          <div className={styles.content}>
            <h1 className={styles.title}>My Loan</h1>
          </div>
          <div className={styles.primaryButton} onClick={handleOpenModal}>
            <AddIcon /> Add Collateral
          </div>
          <Modal open={openModal} onClose={handleCloseModal}>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 400,
                backgroundColor: "white",
                padding: 3,
                borderRadius: 2,
                boxShadow: 24,
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: "rgb(0, 50, 99)", marginBottom: 2 }}
              >
                Add Collateral
              </Typography>
              <TextField
                label="Stock Name"
                value={stockName}
                onChange={(e) => setStockName(e.target.value)}
                fullWidth
                required
                sx={{ marginBottom: 2 }}
              />
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                fullWidth
                required
                sx={{ marginBottom: 2 }}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button
                  variant="outlined"
                  sx={{ color: "#236cb2", borderColor: "#236cb2" }}
                  onClick={handleCloseModal}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#236cb2",
                    "&:hover": { backgroundColor: "#1a4f8a" },
                  }}
                  onClick={handleAddCollateral}
                  disabled={!stockName || !quantity || loading}
                >
                  {loading ? "Adding..." : "Add"}
                </Button>
              </Box>
            </Box>
          </Modal>
        </div>

        <div className={styles.wrapThirdContent}>
          <div className={styles.wrapTabContainer}>
            <div className={styles.wrapTab}>
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`${styles.tab} ${
                    activeTab === tab.id ? styles.active : styles.inactive
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </div>
              ))}
            </div>
            <div className={styles.wrapContent}>
              {activeTab === "Collateral" && (
                <div className={styles.loanContainer}>
                  <table className={styles.loanTable}>
                    <thead>
                      <tr>
                        <th
                          sx={{ color: "rgb(0, 50, 99)", fontWeight: "bold" }}
                        >
                          Stock Name
                        </th>
                        <th
                          sx={{ color: "rgb(0, 50, 99)", fontWeight: "bold" }}
                        >
                          Quantity
                        </th>
                        <th
                          sx={{ color: "rgb(0, 50, 99)", fontWeight: "bold" }}
                        >
                          Status
                        </th>
                        <th
                          sx={{ color: "rgb(0, 50, 99)", fontWeight: "bold" }}
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {collaterals?.length > 0 ? (
                        collaterals.map((collateral) => (
                          <tr key={collateral.id}>
                            <td sx={{ color: "rgb(133, 134, 151)" }}>
                              {collateral.stockName}
                            </td>
                            <td sx={{ color: "rgb(133, 134, 151)" }}>
                              {collateral.quantity}
                            </td>
                            <td sx={{ color: "rgb(133, 134, 151)" }}>
                              {collateral.status}
                            </td>
                            <td>
                              {collateral.status === "Pending" && (
                                <Button
                                  variant="outlined"
                                  sx={{
                                    color: "#236cb2",
                                    borderColor: "#236cb2",
                                    "&:hover": { borderColor: "#1a4f8a" },
                                  }}
                                  onClick={() => handleCancel(collateral.id)}
                                  disabled={loading}
                                >
                                  Cancel
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            sx={{ textAlign: "center", color: "gray" }}
                          >
                            No collaterals found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <Modal open={openModal} onClose={handleCloseModal}>
                    <Box
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 400,
                        backgroundColor: "white",
                        padding: 3,
                        borderRadius: 2,
                        boxShadow: 24,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{ color: "rgb(0, 50, 99)", marginBottom: 2 }}
                      >
                        Add Collateral
                      </Typography>
                      <TextField
                        label="Stock Name"
                        value={stockName}
                        onChange={(e) => setStockName(e.target.value)}
                        fullWidth
                        required
                        sx={{ marginBottom: 2 }}
                      />
                      <TextField
                        label="Quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        fullWidth
                        required
                        sx={{ marginBottom: 2 }}
                      />
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 2,
                        }}
                      >
                        <Button
                          variant="outlined"
                          sx={{ color: "#236cb2", borderColor: "#236cb2" }}
                          onClick={handleCloseModal}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          sx={{
                            backgroundColor: "#236cb2",
                            "&:hover": { backgroundColor: "#1a4f8a" },
                          }}
                          onClick={handleAddCollateral}
                          disabled={!stockName || !quantity || loading}
                        >
                          {loading ? "Adding..." : "Add"}
                        </Button>
                      </Box>
                    </Box>
                  </Modal>
                </div>
              )}

              {activeTab == "Available" && <AvailableTable />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
