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
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
} from "@mui/material";
import { useAuth } from "../../hooks/use-auth-client";
import { BigNumber } from "ethers";
import { toast } from "react-toastify";
import styles from "./index.module.css";
import { EditIcon } from "lucide-react";
import { bytes32ToString } from "../../utils";

const AdminDashboardPage = () => {
  const { 
    getPendingCollaterals, 
    updateCollateralStatus, 
    contracts,
    addCollateralType,
    updateCollateralTypeStatus,
    getCollateralTypes
  } = useAuth();
  
  const [activeTab, setActiveTab] = useState(0);
  const [collateralRequests, setCollateralRequests] = useState([]);
  const [collateralTypes, setCollateralTypes] = useState([]);
  const [loadingApproveMap, setLoadingApproveMap] = useState({});
  const [loadingDeclineMap, setLoadingDeclineMap] = useState({});
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingPriceFeedUpdate, setLoadingPriceFeedUpdate] = useState({});
  
  // New collateral type form state
  const [newCollateralType, setNewCollateralType] = useState({
    symbol: "",
    priceFeedId: ""
  });
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingType, setEditingType] = useState({
    symbol: "",
    currentPriceFeedId: "",
    newPriceFeedId: ""
  });

  useEffect(() => {
    if (contracts.loan) {
      const fetchData = async () => {
        try {
          const collaterals = await getPendingCollaterals();
          const formattedCollaterals = collaterals.map((collateral) => ({
            id: BigNumber.from(collateral.collateralId).toNumber(),
            owner: collateral.owner,
            stockName: bytes32ToString(collateral.stockName),
            duration: BigNumber.from(collateral.duration).toNumber(),
            requestedAmount: BigNumber.from(collateral.requestedAmount).div(BigNumber.from(10).pow(18)).toNumber(),
            quantity: BigNumber.from(collateral.quantity).toNumber(),
            status: collateral.status === 0 
                ? "Pending" 
                : collateral.status === 1 
                ? "Approved" 
                : collateral.status === 2 
                ? "Declined" 
                : "Cancelled",
            acceptedLoanId: BigNumber.from(collateral.acceptedLoanId).toNumber(),
          }));
          setCollateralRequests(formattedCollaterals);
          
          // Fetch collateral types
          setLoadingTypes(true);
          const types = await getCollateralTypes();
          setCollateralTypes(types);
          setLoadingTypes(false);
        } catch (error) {
          console.error("Error fetching data:", error);
          setLoadingTypes(false);
        }
      };

      fetchData();
    }
  }, [getPendingCollaterals, getCollateralTypes, contracts]);

  const handleApprove = async (id) => {
    setLoadingApproveMap((prev) => ({ ...prev, [id]: true }));
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
      setLoadingApproveMap((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDecline = async (id) => {
    setLoadingDeclineMap((prev) => ({ ...prev, [id]: true }));
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
      setLoadingDeclineMap((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleToggleCollateralType = async (symbol, currentStatus) => {
    try {
      await updateCollateralTypeStatus(symbol, !currentStatus);
      setCollateralTypes(collateralTypes.map(type => 
        type.symbol === symbol ? { ...type, isActive: !currentStatus } : type
      ));
      toast.success(`Collateral type ${!currentStatus ? "activated" : "deactivated"} successfully!`);
    } catch (error) {
      console.error("Error updating collateral type:", error);
      toast.error("Failed to update collateral type status.");
    }
  };

  const handleAddCollateralType = async () => {
    try {
      await addCollateralType(newCollateralType.symbol, newCollateralType.priceFeedId);
      const types = await getCollateralTypes();
      setCollateralTypes(types);
      setOpenAddDialog(false);
      setNewCollateralType({ symbol: "", priceFeedId: "" });
      toast.success("Collateral type added successfully!");
    } catch (error) {
      console.error("Error adding collateral type:", error);
      toast.error(`Failed to add collateral type: ${error.message}`);
    }
  };

  const handleOpenEditDialog = (type) => {
    setEditingType({
      symbol: type.symbol,
      currentPriceFeedId: type.priceFeedId,
      newPriceFeedId: type.priceFeedId
    });
    setOpenEditDialog(true);
  };

  const handleUpdatePriceFeed = async () => {
    try {
      setLoadingPriceFeedUpdate(prev => ({ ...prev, [editingType.symbol]: true }));
      await updateCollateralTypePriceFeed(editingType.symbol, editingType.newPriceFeedId);
      
      // Update local state
      setCollateralTypes(collateralTypes.map(type => 
        type.symbol === editingType.symbol 
          ? { ...type, priceFeedId: editingType.newPriceFeedId } 
          : type
      ));
      
      setOpenEditDialog(false);
      toast.success("Price feed updated successfully!");
    } catch (error) {
      console.error("Error updating price feed:", error);
      toast.error(`Failed to update price feed: ${error.message}`);
    } finally {
      setLoadingPriceFeedUpdate(prev => ({ ...prev, [editingType.symbol]: false }));
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
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ marginBottom: 3 }}
          >
            <Tab label="Pending Collaterals" />
            <Tab label="Collateral Types" />
          </Tabs>

          {activeTab === 0 ? (
            <div className={styles.wrapTabContainer}>
              {collateralRequests.length === 0 ? (
                <Typography
                  variant="h6"
                  color="textSecondary"
                  sx={{ textAlign: "center", marginTop: 3 }}
                >
                  No pending collaterals
                </Typography>
              ) : (
                <div className={styles.loanContainer}>
                  <table className={styles.loanTable}>
                    <thead>
                      <tr>
                        <th>Stock Name</th>
                        <th>Quantity</th>
                        <th>Requested Amount</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Owner</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collateralRequests.map((request) => (
                        <tr key={request.id}>
                          <td>{request.stockName}</td>
                          <td>{request.quantity}</td>
                          <td>{request.requestedAmount} USDT</td>
                          <td>{request.duration} months</td>
                          <td>{request.status}</td>
                          <td>{request.owner}</td>
                          <td>
                            {request.status === "Pending" && (
                              <>
                                <Button
                                  variant="contained"
                                  sx={{ marginRight: 1 }}
                                  onClick={() => handleApprove(request.id)}
                                  disabled={loadingApproveMap[request?.id]}
                                >
                                  {loadingApproveMap[request?.id] ? (
                                    <CircularProgress size={24} />
                                  ) : (
                                    "Approve"
                                  )}
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleDecline(request.id)}
                                  disabled={loadingDeclineMap[request?.id]}
                                >
                                  {loadingDeclineMap[request?.id] ? (
                                    <CircularProgress size={24} />
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
          ) : ""}

          {activeTab === 1 && (
            <div className={styles.wrapTabContainer}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button 
                  variant="contained" 
                  onClick={() => setOpenAddDialog(true)}
                >
                  Add New Collateral Type
                </Button>
              </Box>

              {loadingTypes ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <CircularProgress />
                </Box>
              ) : collateralTypes.length === 0 ? (
                <Typography
                  variant="h6"
                  color="textSecondary"
                  sx={{ textAlign: "center", marginTop: 3 }}
                >
                  No collateral types found
                </Typography>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Symbol</TableCell>
                        <TableCell>Price Feed ID</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {collateralTypes.map((type) => (
                        <TableRow key={type.symbol}>
                          <TableCell>{type.symbol}</TableCell>
                          <TableCell sx={{ wordBreak: 'break-all' }}>
                            {type.priceFeedId}
                            <Tooltip title="Edit Price Feed">
                              <IconButton
                                size="small" 
                                onClick={() => handleOpenEditDialog(type)}
                                sx={{ ml: 1 }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {type.isActive ? (
                              <Typography color="success.main">Active</Typography>
                            ) : (
                              <Typography color="error.main">Inactive</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              color={type.isActive ? "error" : "success"}
                              onClick={() => handleToggleCollateralType(type.symbol, type.isActive)}
                              sx={{ mr: 1 }}
                            >
                              {type.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Collateral Type Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Add New Collateral Type</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Symbol"
            fullWidth
            value={newCollateralType.symbol}
            onChange={(e) => setNewCollateralType({...newCollateralType, symbol: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Price Feed ID"
            fullWidth
            value={newCollateralType.priceFeedId}
            onChange={(e) => setNewCollateralType({...newCollateralType, priceFeedId: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddCollateralType}
            disabled={!newCollateralType.symbol || !newCollateralType.priceFeedId}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Update Price Feed ID</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Updating price feed for: {editingType.symbol}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Current Price Feed ID: {editingType.currentPriceFeedId}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="New Price Feed ID"
            fullWidth
            value={editingType.newPriceFeedId}
            onChange={(e) => setEditingType({
              ...editingType,
              newPriceFeedId: e.target.value
            })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdatePriceFeed}
            disabled={editingType.newPriceFeedId === editingType.currentPriceFeedId || 
                      !editingType.newPriceFeedId}
            endIcon={
              loadingPriceFeedUpdate[editingType.symbol] ? 
                <CircularProgress size={20} /> : null
            }
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminDashboardPage;