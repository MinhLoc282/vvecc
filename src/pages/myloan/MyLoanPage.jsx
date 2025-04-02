import React, { useEffect, useState } from "react";
import styles from "./index.module.css";
import { useAuth } from "../../hooks/use-auth-client";
import {
  Button,
  Typography,
  Box,
  Modal,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { BigNumber, ethers } from 'ethers';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { bytes32ToString } from "../../utils";
import { LTV_DECIMALS } from "../../constants";

export const MyLoanPage = () => {
  const tabs = [
    { id: "Collateral", label: "My Collateral" },
    { id: "Loans", label: "My Loans" },
    { id: "Auctions", label: "My Auctions" },
  ];
  
  const {
    contracts,
    getUserCollaterals, 
    addCollateral, 
    updateCollateralStatus, 
    getLoansForUserCollaterals,
    getActiveLoansForUser,
    account,
    acceptLoan,
    getBorrowerAuctions,
    closeAuction,
    getCollateralTypes,
    fetchPythPriceUpdate,
    makePayment
  } = useAuth();
  
  const navigate = useNavigate();
  const [collaterals, setCollaterals] = useState([]);
  const [loans, setLoans] = useState([]);
  const [auctions, setAuctions] = useState([]);
  // const [activeLoans, setActiveLoans] = useState([]);
  const [maxLoanAmount, setMaxLoanAmount] = useState("");
  const [collateralTypes, setCollateralTypes] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [stockName, setStockName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [duration, setDuration] = useState(6);
  const [loading, setLoading] = useState(false);
  const [loadingCancelMap, setLoadingCancelMap] = useState({});
  const [loadingAcceptMap, setLoadingAcceptMap] = useState({});
  const [loadingCloseMap, setLoadingCloseMap] = useState({});
  const [activeTab, setActiveTab] = useState("Collateral");
  const [loadingPayInterest, setLoadingPayInterest] = useState({});
  const [loadingRepay, setLoadingRepay] = useState({});
  const [loadingFullPayment, setLoadingFullPayment] = useState({});
  const [loadingApproveInterest, setLoadingApproveInterest] = useState({});
  const [loadingApproveRepay, setLoadingApproveRepay] = useState({});
  const [loadingApproveFullPayment, setLoadingApproveFullPayment] = useState({});
  const [approvedInterestLoans, setApprovedInterestLoans] = useState({});
  const [approvedRepayLoans, setApprovedRepayLoans] = useState({});
  const [approvedFullPaymentLoans, setApprovedFullPaymentLoans] = useState({});
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

  const calculateMonthlyInterest = (loanAmount, interestRate) => {
    return BigNumber.from(loanAmount).mul(BigNumber.from(10).pow(18)).mul(BigNumber.from(interestRate)).div(12 * 10000);
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
    return BigNumber.from(loan.loanAmount).mul(BigNumber.from(10).pow(18)).add(remainingInterest);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleDateString();
  };
  
  const handleMonthsChange = (loanId, newValue) => {
    const loan = loans.find(loan => loan.loanId === loanId);
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

  const handleApproveInterest = async (loanId, amount) => {
    setLoadingApproveInterest((prev) => ({ ...prev, [loanId]: true }));
    try {
      const totalAmount = amount.mul(BigNumber.from(monthsToPay[loanId] || 1));
      
      const approveTx = await contracts.token.approve(
        contracts.loan.address, 
        totalAmount
      );
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
      const amountWithDecimals = BigNumber.from(amount);
      
      const approveTx = await contracts.token.approve(
        contracts.loan.address, 
        amountWithDecimals
      );
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
      
      const approveTx = await contracts.token.approve(
        contracts.loan.address, 
        fullAmount
      );
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
      // PaymentType.Interest = 0
      await makePayment(loanId, 0, months || 1);

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
      // PaymentType.Repayment = 1
      await makePayment(loanId, 1, 0);

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
      // PaymentType.FullPayment = 2
      console.log(loanId)
      await makePayment(loanId, 2, 0);

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

  const calculateMaxLoan = async () => {
    if (!stockName || !quantity) {
      setMaxLoanAmount("");
      return;
    }
  
    try {
      const selectedType = collateralTypes.find(type => type.symbol === stockName);
      if (!selectedType) return;
  
      const price = await contracts.pyth.getPriceUnsafe(selectedType.priceFeedId);
      const quantityBN = ethers.BigNumber.from(quantity);
      const priceBN = ethers.BigNumber.from(price.price);
      const expoBN = ethers.BigNumber.from(10).pow(Math.abs(price.expo));
      
      const currentValue = price.expo < 0 
        ? priceBN.mul(quantityBN).div(expoBN)
        : priceBN.mul(quantityBN).mul(expoBN);
      
      const maxLoan = currentValue.mul(70).div(100);
      setMaxLoanAmount(ethers.utils.formatUnits(maxLoan, 0));
    } catch (error) {
      console.error("Error calculating max loan:", error);
      setMaxLoanAmount("");
    }
  };

  const fetchCollaterals = async () => {
    try {
      setLoading(true);
      const userCollaterals = await getUserCollaterals(account);
      const formattedCollaterals = userCollaterals.map((collateral) => ({
        id: BigNumber.from(collateral.collateralId).toNumber(),
        owner: collateral.owner,
        stockName: bytes32ToString(collateral.stockName),
        quantity: BigNumber.from(collateral.quantity).toNumber(),
        status: collateral.status === 0 
            ? "Pending" 
            : collateral.status === 1 
            ? "Approved" 
            : collateral.status === 2 
            ? "Declined" 
            : "Cancelled",
        acceptedLoanId: BigNumber.from(collateral.acceptedLoanId).toNumber(),
        requestedAmount: ethers.utils.formatUnits(collateral.requestedAmount, 18),
        duration: BigNumber.from(collateral.duration).toNumber(),
        auctionId: BigNumber.from(collateral.auctionId).toNumber(),
        currentValue: ethers.BigNumber.from(collateral.currentValue).toNumber(),
        maxLoanAmount: ethers.BigNumber.from(collateral.maxLoanAmount).toNumber(),
        ltvRatio: ethers.BigNumber.from(collateral.ltvRatio).toNumber() / (10 ** LTV_DECIMALS), 
        lastUpdateTime: BigNumber.from(collateral.lastUpdateTime).toNumber(),
      }));

      setCollaterals(formattedCollaterals);
    } catch (error) {
      console.error("Error fetching collaterals:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const userLoans = await getLoansForUserCollaterals(account);
      
      const formattedLoans = userLoans.map(loan => {
        const safeConvert = (value, defaultValue = 0) => {
          try {
            return value ? BigNumber.from(value).toNumber() : defaultValue;
          } catch {
            return defaultValue;
          }
        };
  
        return {
          ...loan,
          loanId: safeConvert(loan.loanId),
          collateralId: safeConvert(loan.collateralId),
          interestRate: safeConvert(loan.interestRate),
          loanAmount:  BigNumber.from(loan.loanAmount).div(BigNumber.from(10).pow(18)).toNumber(),
          duration: safeConvert(loan.duration),
          startTime: safeConvert(loan.startTime),
          nextInterestDue: safeConvert(loan.nextInterestDue),
          interestPaidMonths: safeConvert(loan.interestPaidMonths),
          stockName: loan.collateral?.stockName ? bytes32ToString(loan.collateral.stockName) : "",
          quantity: safeConvert(loan.collateral?.quantity),
          loanType: loan.loanType || 
            (loan.lender?.toLowerCase() === account.toLowerCase() ? "Lender" : "Borrower"),
          collateral: loan.collateral ? {
            ...loan.collateral,
            collateralId: safeConvert(loan.collateral.collateralId),
            quantity: safeConvert(loan.collateral.quantity),
            currentValue: loan.collateral.currentValue ? 
              ethers.BigNumber.from(loan.collateral.currentValue).toNumber() : 0,
            ltvRatio: loan.collateral.ltvRatio ? 
              (ethers.BigNumber.from(loan.collateral.ltvRatio).toNumber() / (10 ** LTV_DECIMALS)) : 0,
            requestedAmount: loan.collateral.requestedAmount ? 
              ethers.utils.formatUnits(loan.collateral.requestedAmount, 18) : "0"
          } : null
        };
      });
      
      setLoans(formattedLoans);
    } catch (error) {
      console.error("Error fetching loans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const userAuctions = await getBorrowerAuctions(account);
      const formattedAuctions = userAuctions.map(auction => ({
        ...auction,
        auctionId: BigNumber.from(auction.auctionId).toNumber(),
        collateralId: BigNumber.from(auction.collateralId).toNumber(),
        requestedAmount: BigNumber.from(auction.requestedAmount).div(BigNumber.from(10).pow(18)).toNumber(),
        duration: BigNumber.from(auction.duration).toNumber(),
        lowestInterestRate: BigNumber.from(auction.lowestInterestRate).toNumber(),
        startTime: BigNumber.from(auction.startTime).toNumber(),
        endTime: BigNumber.from(auction.endTime).toNumber(),
        status: auction.status === 0 
            ? "Open" 
            : auction.status === 1 
            ? "Closed" 
            : "Expired",
        loanDeclined: auction.loanDeclined,
        currentBestLender: auction.currentBestLender || "N/A",
      }));

      setAuctions(formattedAuctions);
    } catch (error) {
      console.error("Error fetching loans:", error);
    } finally {
      setLoading(false);
    }
  };

  // const fetchActiveLoans = async () => {
  //   try {
  //     setLoading(true);
  //     const loans = await getActiveLoansForUser(account);
  //     const formattedLoans = loans.map(loan => ({
  //       ...loan,
  //       loanId: BigNumber.from(loan.loanId).toNumber(),
  //       collateralId: BigNumber.from(loan.collateralId).toNumber(),
  //       interestRate: BigNumber.from(loan.interestRate).toNumber(),
  //       loanAmount: BigNumber.from(loan.loanAmount).toNumber(),
  //       duration: BigNumber.from(loan.duration).toNumber(),
  //       startTime: BigNumber.from(loan.startTime).toNumber(),
  //       nextInterestDue: BigNumber.from(loan.nextInterestDue).toNumber(),
  //       interestPaidMonths: BigNumber.from(loan.interestPaidMonths).toNumber(),
  //       quantity: BigNumber.from(loan.quantity).toNumber(),
  //     }));
  //     setActiveLoans(formattedLoans);
  //   } catch (error) {
  //     console.error("Error fetching active loans:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleAddCollateral = async () => {
    if (!stockName || !quantity || !requestedAmount) return;
  
    try {
      setLoading(true);

      const selectedType = collateralTypes.find(type => type.symbol === stockName);
      if (!selectedType) {
        throw new Error("Selected collateral type not found");
      }
  
      const priceUpdate = await fetchPythPriceUpdate(selectedType.priceFeedId);
      const price = await contracts.pyth.getPriceUnsafe(selectedType.priceFeedId);
      
      const quantityBN = ethers.BigNumber.from(quantity);
      const priceBN = ethers.BigNumber.from(price.price);
      const expoBN = ethers.BigNumber.from(10).pow(Math.abs(price.expo));

      const currentValue = price.expo < 0 
      ? priceBN.mul(quantityBN).div(expoBN)
      : priceBN.mul(quantityBN).mul(expoBN);
    
      // Calculate max loan amount (70% of current value)
      const maxLoanAmount =  ethers.utils.parseUnits(currentValue.mul(70).div(100).toString(), 18);
      
      const requestedAmountInWei = ethers.utils.parseUnits(requestedAmount.toString(), 18);

      if (requestedAmountInWei.gt(maxLoanAmount)) {
        throw new Error(`Requested amount cannot exceed ${maxLoanAmount.div(ethers.BigNumber.from(10).pow(18))} USDT (70% of collateral value)`);
      }

      await addCollateral(
        stockName, 
        parseInt(quantity, 10), 
        requestedAmountInWei, 
        duration,
        priceUpdate
      );
  
      fetchCollaterals();
      handleCloseModal();
      toast.success("Added collateral successfully!");
    } catch (error) {
      console.error("Error adding collateral:", error);
      toast.error(`Failed to add collateral`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (collateralId) => {
    try {
      setLoadingCancelMap((prev) => ({ ...prev, [collateralId]: true }));
      await updateCollateralStatus(collateralId, 3); // 3 = Cancelled
      fetchCollaterals();
      toast.success("Collateral cancelled successfully!");
    } catch (error) {
      console.error("Error cancelling collateral:", error);
      toast.error("Failed to cancel collateral.");
    } finally {
      setLoadingCancelMap((prev) => ({ ...prev, [collateralId]: false }));
    }
  };

  const handleAcceptLoan = async (loanId) => {
    try {
      setLoadingAcceptMap((prev) => ({ ...prev, [loanId]: true }));
      await acceptLoan(loanId);
      fetchLoans();
      toast.success("Loan accepted successfully!");
    } catch (error) {
      console.error("Error accepting loan:", error);
      toast.error("Failed to accept loan.");
    } finally {
      setLoadingAcceptMap((prev) => ({ ...prev, [loanId]: false }));
    }
  };

  const handleCloseAuction = async (auction) => {
    try {
      setLoadingCloseMap((prev) => ({ ...prev, [auction.auctionId]: true }));
  
      await closeAuction(auction.auctionId);
      toast.success("Auction closed successfully!");
  
      fetchAuctions();
    } catch (error) {
      console.error("Error closing auction:", error);
      toast.error("Failed to close auction.");
    } finally {
      setLoadingCloseMap((prev) => ({ ...prev, [auction.auctionId]: false }));
    }
  };  

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setStockName("");
    setQuantity("");
    setRequestedAmount("");
    setDuration(6);
  };

  const navigateToAuctions = () => {
    navigate("/auctions");
  };

  useEffect(() => {
    if (account) {
      fetchCollaterals();
      const fetchInitialData = async () => {
        const types = await getCollateralTypes();
        setCollateralTypes(types);
      };
      fetchInitialData();
      if (activeTab === "Loans") {
        fetchLoans();
      } else if (activeTab === "Auctions") {
        fetchAuctions();
      }
    }
  }, [account, activeTab]);

  useEffect(() => {
    calculateMaxLoan();
  }, [stockName, quantity]);

  return (
    <div className={styles.wrapContainer}>
      <div className={styles.container}>
        <div className={styles.wrapFirstContent}>
          <div className={styles.content}>
            <h1 className={styles.title}>My Loan</h1>
          </div>
          <div className={styles.buttonGroup}>
            <div className={styles.primaryButton} onClick={handleOpenModal}>
              <AddIcon /> Add Collateral
            </div>
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
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel>Stock Name</InputLabel>
                <Select
                  value={stockName}
                  label="Stock Name"
                  onChange={(e) => setStockName(e.target.value)}
                  required
                >
                  {collateralTypes
                    .filter(type => type.isActive)
                    .map((type) => (
                      <MenuItem key={type.symbol} value={type.symbol}>
                        {type.symbol}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  calculateMaxLoan();
                }}
                fullWidth
                required
                sx={{ marginBottom: 2 }}
              />
              {maxLoanAmount && (
                <Typography variant="body2" sx={{ mb: 1, color: "#666" }}>
                  Max loan amount: {parseFloat(maxLoanAmount).toFixed(2)} USDT (70% of collateral value)
                </Typography>
              )}
              <TextField
                label="Requested Amount (USDT)"
                type="number"
                value={requestedAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                    setRequestedAmount(value);
                  }
                }}
                fullWidth
                required
                sx={{ marginBottom: 2 }}
                helperText={maxLoanAmount && `Max: ${parseFloat(maxLoanAmount).toFixed(2)} USDT`}
              />
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel>Duration (months)</InputLabel>
                <Select
                  value={duration}
                  label="Duration (months)"
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <MenuItem value={6}>6 months</MenuItem>
                  <MenuItem value={8}>8 months</MenuItem>
                  <MenuItem value={12}>12 months</MenuItem>
                  <MenuItem value={18}>18 months</MenuItem>
                  <MenuItem value={24}>24 months</MenuItem>
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
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#236cb2",
                    "&:hover": { backgroundColor: "#1a4f8a" },
                  }}
                  onClick={handleAddCollateral}
                  disabled={
                    !stockName || 
                    !quantity || 
                    !requestedAmount || 
                    loading ||
                    (maxLoanAmount && parseFloat(requestedAmount) > parseFloat(maxLoanAmount))
                  }
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
                        <th>Stock Name</th>
                        <th>Quantity</th>
                        <th>Current Value</th>
                        <th>Requested Amount</th>
                        <th>Max Loan</th>
                        <th>LTV Ratio</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collaterals?.length > 0 ? (
                        collaterals.map((collateral) => (
                          <tr key={collateral.id}>
                            <td>{collateral.stockName}</td>
                            <td>{collateral.quantity}</td>
                            <td>${parseFloat(collateral.currentValue).toFixed(2)}</td>
                            <td>${parseFloat(collateral.requestedAmount).toFixed(2)} USDT</td>
                            <td>${parseFloat(collateral.maxLoanAmount).toFixed(2)}</td>
                            <td>{collateral.ltvRatio.toFixed(2)}%</td>
                            <td>{collateral.duration} months</td>
                            <td>{collateral.status}</td>
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
                                  disabled={loadingCancelMap[collateral?.id]}
                                >
                                  {loadingCancelMap[collateral?.id] ? "Cancelling..." : "Cancel"}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} style={{ textAlign: "center", color: "gray" }}>
                            No collaterals found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "Loans" && (
                <div className={styles.loanContainer}>
                  <table className={styles.loanTable}>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Stock Name</th>
                        <th>Quantity</th>
                        <th>Current Value</th>
                        <th>LTV Ratio</th>
                        <th>Loan Amount</th>
                        <th>Interest Rate</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans?.length > 0 ? (
                        loans.map((loan) => {
                          const loanStatus = getLoanPaymentStatus(loan);
                          const isRepaid = loan.accepted && BigNumber.from(loan.status).toNumber() === 1;
                          const needsRepayment = loan.accepted && loanStatus?.requiresRepayment;
                          const remainingMonths = calculateRemainingMonths(loan);
                          const monthlyInterest = calculateMonthlyInterest(loan.loanAmount, loan.interestRate);
                          const fullPaymentAmount = calculateFullPaymentAmount(loan);

                          return (
                            <tr key={loan.loanId}>
                              <td>{loan.loanType}</td>
                              <td>{loan.stockName}</td>
                              <td>{loan.quantity}</td>
                              <td>${parseFloat(loan.collateral?.currentValue || 0).toFixed(2)}</td>
                              <td>{loan.collateral?.ltvRatio?.toFixed(2) || '0.00'}%</td>
                              <td>{loan.loanAmount} USDT</td>
                              <td>{(loan.interestRate / 100).toFixed(2)}%</td>
                              <td>{loan.duration} months</td>
                              <td>
                                {loan.accepted ? (
                                  <div className={styles.paymentInfo}>
                                    <p className={isRepaid ? styles.repaid : ""}>
                                      <strong>{isRepaid ? "✓ Fully Repaid" : loanStatus?.status || "Loading..."}</strong>
                                    </p>
                                    {!isRepaid && loanStatus?.nextPaymentDue && (
                                      <p>Next Payment: {formatDate(loanStatus.nextPaymentDue)}</p>
                                    )}
                                    {loan.interestPaidMonths && !isRepaid && (
                                      <p>
                                        Paid: {loan.interestPaidMonths.toString()}/{loan.duration.toString()} months
                                        {BigNumber.from(loan.interestPaidMonths).gte(loan.duration) && " (All interest paid)"}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  "Pending"
                                )}
                              </td>
                              <td>
                                {!loan.accepted && loan.loanType === "Borrower" && (
                                  <Button
                                    variant="contained"
                                    sx={{
                                      backgroundColor: "#236cb2",
                                      "&:hover": { backgroundColor: "#1a4f8a" },
                                    }}
                                    onClick={() => handleAcceptLoan(loan.loanId)}
                                    disabled={loadingAcceptMap[loan.loanId]}
                                  >
                                    {loadingAcceptMap[loan.loanId] ? "Accepting..." : "Accept"}
                                  </Button>
                                )}
                                {loan.loanType === "Lender" && (
                                  <span>No actions available</span>
                                )}
                                {loan.accepted && loan.loanType === "Borrower" && !isRepaid && (
                                  <div className={styles.actionButtons}>
                                    <Stack spacing={2}>
                                      {remainingMonths > 0 && (
                                        <div className={styles.paymentSection}>
                                          <div className={styles.monthSelector}>
                                            <label>Months:</label>
                                            <input
                                              type="number"
                                              min="1"
                                              max={remainingMonths}
                                              value={monthsToPay[loan.loanId] || 1}
                                              onChange={(e) => handleMonthsChange(loan.loanId, parseInt(e.target.value))}
                                              className={styles.monthInput}
                                            />
                                          </div>
                                          {!approvedInterestLoans[loan.loanId] ? (
                                            <Button
                                              sx={{ mt: 1 }} // Add 8px top margin
                                              onClick={() => handleApproveInterest(loan.loanId, monthlyInterest)}
                                              disabled={loadingApproveInterest[loan.loanId]}
                                              variant="contained"
                                              color="primary"
                                              className={styles.actionButton}
                                            >
                                              {loadingApproveInterest[loan.loanId] ? (
                                                <CircularProgress size={20} />
                                              ) : (
                                                "Approve Interest"
                                              )}
                                            </Button>
                                          ) : (
                                            <Button
                                              sx={{ mt: 1 }}
                                              onClick={() => handlePayInterest(loan.loanId, monthsToPay[loan.loanId])}
                                              disabled={loadingPayInterest[loan.loanId]}
                                              variant="contained"
                                              color="secondary"
                                              className={styles.actionButton}
                                            >
                                              {loadingPayInterest[loan.loanId] ? (
                                                <CircularProgress size={20} />
                                              ) : (
                                                `Pay ${Number(
                                                  parseFloat(
                                                    ethers.utils.formatUnits(
                                                      monthlyInterest.mul(BigNumber.from(monthsToPay[loan.loanId] || 1)),
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
                                        {!approvedFullPaymentLoans[loan.loanId] ? (
                                          <Button
                                            sx={{ mt: 1 }}
                                            onClick={() => handleApproveFullPayment(loan.loanId, loan)}
                                            disabled={loadingApproveFullPayment[loan.loanId]}
                                            variant="contained"
                                            color="primary"
                                            className={styles.actionButton}
                                          >
                                            {loadingApproveFullPayment[loan.loanId] ? (
                                              <CircularProgress size={20} />
                                            ) : (
                                              "Approve Full Payment"
                                            )}
                                          </Button>
                                        ) : (
                                          <Button
                                            sx={{ mt: 1 }}
                                            onClick={() => handleMakeFullPayment(loan.loanId)}
                                            disabled={loadingFullPayment[loan.loanId]}
                                            variant="contained"
                                            color="success"
                                            className={styles.actionButton}
                                          >
                                            {loadingFullPayment[loan.loanId] ? (
                                              <CircularProgress size={20} />
                                            ) : (
                                              `Pay ${Number(
                                                parseFloat(
                                                  ethers.utils.formatUnits(
                                                    fullPaymentAmount,
                                                    18
                                                  )
                                                ).toFixed(4)
                                              )} USDT Full Payment`
                                            )}
                                          </Button>
                                        )}
                                      </div>

                                      {remainingMonths <= 0 && (
                                        <div className={styles.paymentSection}>
                                          {!approvedRepayLoans[loan.loanId] ? (
                                            <Button
                                              sx={{ mt: 1 }}
                                              onClick={() => handleApproveRepay(loan.loanId, loan.loanAmount)}
                                              disabled={loadingApproveRepay[loan.loanId]}
                                              variant="contained"
                                              color="primary"
                                              className={styles.actionButton}
                                            >
                                              {loadingApproveRepay[loan.loanId] ? (
                                                <CircularProgress size={20} />
                                              ) : (
                                                "Approve Repay"
                                              )}
                                            </Button>
                                          ) : (
                                            <Button
                                              sx={{ mt: 1 }}
                                              onClick={() => handleRepayLoan(loan.loanId)}
                                              disabled={loadingRepay[loan.loanId]}
                                              variant="contained"
                                              color="primary"
                                              className={styles.actionButton}
                                            >
                                              {loadingRepay[loan.loanId] ? (
                                                <CircularProgress size={20} />
                                              ) : (
                                                `Repay ${ethers.utils.formatUnits(loan.loanAmount, 18)} USDT Loan`
                                              )}
                                            </Button>
                                          )}
                                        </div>
                                      )}
                                    </Stack>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={10} style={{ textAlign: "center", color: "gray" }}>
                            No loans found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "Auctions" && ( 
                <div className={styles.loanContainer}>
                  <table className={styles.loanTable}>
                    <thead>
                      <tr>
                        <th>Auction ID</th>
                        <th>Collateral ID</th>
                        <th>Requested Amount</th>
                        <th>Duration</th>
                        <th>Lowest Interest Rate</th>
                        <th>Best Lender</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auctions?.length > 0 ? (
                        auctions.map((auction) => (
                          <tr key={auction.auctionId}>
                            <td>{auction.auctionId}</td>
                            <td>{auction.collateralId}</td>
                            <td>{auction.requestedAmount} USDT</td>
                            <td>{auction.duration} months</td>
                            <td>{(auction.lowestInterestRate / 100).toFixed(2)}%</td>
                            <td>{auction.currentBestLender || "N/A"}</td>
                            <td>{new Date(auction.startTime * 1000).toLocaleString()}</td>
                            <td>{new Date(auction.endTime * 1000).toLocaleString()}</td>
                            <td>{auction.status}</td>
                            <td>
                              {auction.status === "Open" && (
                                <Button
                                  variant="contained"
                                  sx={{
                                    backgroundColor: "#d9534f",
                                    "&:hover": { backgroundColor: "#c9302c" },
                                  }}
                                  onClick={() => handleCloseAuction(auction)}
                                  disabled={loadingCloseMap[auction.auctionId]}
                                >
                                  {loadingCloseMap[auction.auctionId] ? "Closing..." : "Close"}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={10} style={{ textAlign: "center", color: "gray" }}>
                            No auctions found.
                          </td>
                        </tr>
                      )}
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