import { useEffect, useState } from "react";
import styles from "./index.module.css";
import {
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
import { NFTCard } from "../NFTCard";
import { BigNumber } from "ethers";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { TabContainer } from "../TabContainer";
import useTheme from "../../hooks/useTheme";
import { HowVeccWorks } from "../HowVeccWorks";
export const TabLoan = () => {
  const tabs = [
    { id: "marketplace", label: "Loan Marketplace" },
    { id: "collateral", label: "My Collateral" },
    { id: "loans", label: "My Loans" },
  ];
  const listings = [
    {
      stockName: "AAPL",
      title: "AAPL Shares",
      company: "Apple Inc.",
      quantity: 500,
      value: 92500,
      interest: 5.2,
      term: 90,
      status: "Public",
    },
    {
      stockName: "TSLA",
      title: "TSLA Shares",
      company: "Tesla Inc.",
      quantity: 200,
      value: 43600,
      interest: 6.8,
      term: 60,
      status: "Public",
    },
    {
      stockName: "Acme",
      title: "Acme Startup",
      company: "Series B Shares",
      quantity: 50000,
      value: 250000,
      interest: 8.5,
      term: 180,
      status: "Private",
    },
  ];

  const [activeTab, setActiveTab] = useState("marketplace");
  const { getAcceptedCollaterals, offerLoan, contracts, account } = useAuth();
  const [acceptedCollaterals, setAcceptedCollaterals] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedCollateral, setSelectedCollateral] = useState(null);
  const [interestRate, setInterestRate] = useState(0.1);
  const [loanAmount, setLoanAmount] = useState(0);
  const [duration, setDuration] = useState(6);
  const [interestRateError, setInterestRateError] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleApprove = async () => {
    if (!selectedCollateral || loanAmount <= 0) return;
    setLoadingApprove(true);
    try {
      const approveTx = await contracts.token.approve(
        contracts.loan.address,
        BigNumber.from(loanAmount).mul(BigNumber.from("1000000000000000000"))
      );
      await approveTx.wait();
      setIsApproved(true);
      console.log("Token approved successfully.");
    } catch (error) {
      console.error("Error approving token:", error);
    }
    setLoadingApprove(false);
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
    console.log(collateral);
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

  const handleSubmitLoanRequest = async () => {
    if (
      selectedCollateral &&
      loanAmount > 0 &&
      validateInterestRate(interestRate) &&
      isApproved
    ) {
      setLoadingSubmit(true);
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
        setLoadingSubmit(false);
        handleCloseModal();
      }
    }
  };
  const handleAAPLClick = (stockName) => {
    const selectedCollateral = acceptedCollaterals.find(
      (collateral) => collateral.stockName === stockName
    );

    if (selectedCollateral) {
      handleOpenModal(selectedCollateral);
    } else {
      console.warn(`No collateral found for stock: ${stockName}`);
    }
    console.log(acceptedCollaterals);
  };

  return (
    <div>
      <TabContainer
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        gridColumns={3}
      >
        {activeTab === "marketplace" && (
          <div className={styles.tab}>
            <div className={styles.wrapShare}>
              {listings.map((item, index) => (
                <NFTCard
                  key={index}
                  title={item.title}
                  subtitle={item.company}
                  status={item.status}
                  metadata={[
                    { label: "Quantity", value: `${item.quantity} shares` },
                    { label: "Value", value: `$${item.value.toLocaleString()}` },
                    { label: "Min. Interest", value: `${item.interest}% APR` },
                    { label: "Loan Term", value: `${item.term} days` }
                  ]}
                  actionText="Place Bid"
                  onAction={() => handleAAPLClick(item.stockName)}
                  variant="default"
                  className="gridItem"
                />
              ))}
            </div>
            <div
              className={styles.viewAll}
              onClick={() => handleNavigate("/loan-marketplace")}
            >
              <p className={`${styles.viewButton} ${isDarkMode ? styles.dark : ""}`}>
                View All
              </p>
            </div>
          </div>
        )}
      </TabContainer>
      
      {/* Modal placed outside TabContainer */}
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
            onChange={(e) =>
              setLoanAmount(parseFloat(e.target.value))
            }
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
            {!isApproved ? (
              <Button
                variant="contained"
                sx={{ backgroundColor: "#236cb2" }}
                onClick={handleApprove}
                disabled={loanAmount <= 0 || loadingApprove}
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
            ) : (
              <Button
                variant="contained"
                sx={{ backgroundColor: "#236cb2" }}
                onClick={handleSubmitLoanRequest}
                disabled={
                  !!interestRateError ||
                  loanAmount <= 0 ||
                  loadingSubmit
                }
              >
                {loadingSubmit ? (
                  <CircularProgress
                    size={24}
                    sx={{ color: "white" }}
                  />
                ) : (
                  "Submit"
                )}
              </Button>
            )}
          </Box>
        </Box>
      </Modal>
      
      <HowVeccWorks />
    </div>
  );
};
