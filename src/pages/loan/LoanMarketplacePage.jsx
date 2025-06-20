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
  Modal,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../../hooks/use-auth-client";
import { BigNumber } from "ethers";
import { toast } from "react-toastify";

const LoanMarketplacePage = () => {
  const { getAcceptedCollaterals, offerLoan, contracts, account } = useAuth();
  const [acceptedCollaterals, setAcceptedCollaterals] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedCollateral, setSelectedCollateral] = useState(null);
  const [interestRate, setInterestRate] = useState(0.1);
  const [loanAmount, setLoanAmount] = useState(0);
  const [duration, setDuration] = useState(6);
  const [interestRateError, setInterestRateError] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [loadingApproveMap, setLoadingApproveMap] = useState({});
  const [loadingSubmitMap, setLoadingSubmitMap] = useState({});

  const handleApprove = async (collateralId) => {
    if (!selectedCollateral || loanAmount <= 0) return;
    setLoadingApproveMap((prev) => ({ ...prev, [collateralId]: true }));
    try {
      const approveTx = await contracts.token.approve(
        contracts.loan.address,
        BigNumber.from(loanAmount).mul(BigNumber.from("1000000000000000000"))
      );
      await approveTx.wait();
      setIsApproved(true);
      console.log("Token approved successfully.", loadingApproveMap);
    } catch (error) {
      console.error("Error approving token:", error);
    }
    setLoadingApproveMap((prev) => ({ ...prev, [collateralId]: false }));

  };

  useEffect(() => {
    const checkApproval = async () => {
      if (!selectedCollateral || loanAmount <= 0) return;

      try {
        const allowance = await contracts.token.allowance(
          account,
          contracts.loan.address
        );
        const requiredAmount = BigNumber.from(loanAmount).mul(
          BigNumber.from("1000000000000000000")
        ); // Convert safely
        setIsApproved(BigNumber.from(allowance).gte(requiredAmount));
      } catch (error) {
        console.error("Error checking token allowance:", error);
      }
    };

    checkApproval();
  }, [loanAmount, selectedCollateral, contracts, account]);

  useEffect(() => {
    if (contracts.loan) {
      const fetchCollaterals = async () => {
        try {
          const collaterals = await getAcceptedCollaterals();

          const formattedCollaterals = collaterals
            .map((collateral) => ({
              id: BigNumber.from(collateral.collateralId).toNumber(),
              owner: collateral.owner,
              stockName: collateral.stockName,
              quantity: BigNumber.from(collateral.quantity).toNumber(),
              status:
                collateral.status === 0
                  ? "Pending"
                  : collateral.status === 1
                  ? "Approved"
                  : collateral.status === 2
                  ? "Declined"
                  : "Cancelled",
              acceptedLoanId: BigNumber.from(
                collateral.acceptedLoanId
              ).toNumber(),
            }))
            .filter(
              (collateral) =>
                collateral.owner.toLowerCase() !== account.toLowerCase() &&
                collateral.acceptedLoanId === 0
            );
          setAcceptedCollaterals(formattedCollaterals);
        } catch (error) {
          console.error("Error fetching accepted collaterals:", error);
        }
      };
      fetchCollaterals();
    }
  }, [getAcceptedCollaterals, contracts]);

  const handleOpenModal = (collateral) => {
    setSelectedCollateral(collateral);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedCollateral(null);
    setInterestRate(0.1);
    setLoanAmount(0);
    setDuration(6);
    setInterestRateError("");
  };

  const validateInterestRate = (value) => {
    if (value < 0.1 || value > 40) {
      setInterestRateError("Interest rate must be between 0.1% and 40%.");
      return false;
    } else {
      setInterestRateError("");
      return true;
    }
  };

  const handleInterestRateChange = (e) => {
    const value = parseFloat(e.target.value);
    setInterestRate(value);
    validateInterestRate(value);
  };

  const handleSubmitLoanRequest = async (collateralId) => {
    if (
      selectedCollateral &&
      loanAmount > 0 &&
      validateInterestRate(interestRate) &&
      isApproved
    ) {
      setLoadingSubmitMap((prev) => ({ ...prev, [collateralId]: true }));
      try {
        await offerLoan(
          selectedCollateral.id,
          interestRate * 100,
          BigNumber.from(loanAmount).mul(BigNumber.from("1000000000000000000")),
          duration
        );
        toast.success("Offer loan successfully!");
      
      } catch (error) {
        console.error("Error submitting loan request:", error);
        toast.error("Failed to offer loan.");
      } finally {
        setLoadingSubmitMap((prev) => ({ ...prev, [collateralId]: false }));
        handleCloseModal();
      }
    }
  };
  useEffect(() => {
    console.log("loadingApproveMap changed:", loadingApproveMap);
  }, [loadingApproveMap]);
  
  useEffect(() => {
    console.log("loadingSubmitMap changed:", loadingSubmitMap);
  }, [loadingSubmitMap]);

  return (
    <Box sx={{ backgroundColor: "hsl(var(--background))", minHeight: "100vh" }}>
      {/* <Typography variant="h4" color="primary" sx={{ color: 'rgb(0, 50, 99)', marginBottom: 3 }}>
        Loan Marketplace
      </Typography> */}
      <TableContainer component={Paper} sx={{ backgroundColor: "white" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Stock Name</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Quantity</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Owner</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {acceptedCollaterals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No collaterals found.
                </TableCell>
              </TableRow>
            ) : (
              acceptedCollaterals.map((collateral) => (
                <TableRow key={collateral.id}>
                  <TableCell>{collateral.stockName}</TableCell>
                  <TableCell>{collateral.quantity}</TableCell>
                  <TableCell>{collateral.owner}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      sx={{ color: "#236cb2", borderColor: "#236cb2" }}
                      onClick={() => handleOpenModal(collateral)}
                    >
                      Request Loan
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
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
          <Typography variant="h6">
            Request Loan for {selectedCollateral?.stockName}
          </Typography>
          <TextField
            label="Interest Rate (%)"
            type="number"
            value={interestRate}
            onChange={handleInterestRateChange}
            fullWidth
            required
            inputProps={{ min: 0.1, max: 40, step: 0.1 }}
            error={!!interestRateError}
            helperText={interestRateError}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            label="Loan Amount"
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(parseFloat(e.target.value))}
            fullWidth
            required
            inputProps={{ max: selectedCollateral?.quantity }}
            sx={{ marginBottom: 2 }}
          />
          <FormControl fullWidth sx={{ marginBottom: 2 }}>
            <InputLabel>Duration</InputLabel>
            <Select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              label="Duration"
            >
              <MenuItem value={6}>6 Months</MenuItem>
              <MenuItem value={8}>8 Months</MenuItem>
              <MenuItem value={12}>12 Months</MenuItem>
              <MenuItem value={12}>1 Year</MenuItem>
              <MenuItem value={18}>1.5 Years</MenuItem>
              <MenuItem value={24}>2 Years</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="outlined"
              sx={{ color: "#236cb2", borderColor: "#236cb2" }}
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            {!isApproved ? (
              <Button
                variant="contained"
                sx={{ backgroundColor: "#236cb2" }}
                onClick={() => handleApprove(selectedCollateral.id)}
                disabled={
                  loanAmount <= 0 || loadingApproveMap[selectedCollateral?.id]
                }
              >
                {loadingApproveMap[selectedCollateral?.id] ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Approve"
                )}
              </Button>
            ) : (
              <Button
                variant="contained"
                sx={{ backgroundColor: "#236cb2" }}
                onClick={() => handleSubmitLoanRequest(selectedCollateral.id)}
                disabled={
                  !!interestRateError || loanAmount <= 0 || loadingSubmitMap[selectedCollateral?.id]
                }
              >
                {loadingSubmitMap[selectedCollateral?.id] ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Submit"
                )}
              </Button>
            )}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default LoanMarketplacePage;
