import React, { useEffect, useState } from "react";
import styles from "./index.module.css";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  LineChart,
  Share,
} from "lucide-react";
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
import { ShareCard } from "../ShareCard/ShareCard";
import { CollateralTable } from "../CollateralTable/CollateralTable";
import { ActiveTable } from "../ActiveTable/ActiveTable";
import { useAuth } from "../../hooks/use-auth-client";
import { BigNumber } from "ethers";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
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
        {activeTab === "marketplace" && (
          <div className={styles.tab}>
            <div className={styles.wrapShare}>
              {listings.map((item, index) => (
                <div className={styles.shareCard}>
                  <div className={styles.shareCardHeader}>
                    <h3 className={styles.title}>{item.title}</h3>
                    <div
                      className={`${
                        item.status == "Public" ? styles.public : styles.private
                      }`}
                    >
                      {item.status}
                    </div>
                  </div>
                  <p className={styles.companyName}>{item.company}</p>

                  <div className={styles.shareInfo}>
                    <div className={styles.info}>
                      Quantity: <span>{item.quantity} shares</span>
                    </div>
                    <div className={styles.info}>
                      Value: <span>${item.value}</span>
                    </div>
                    <div className={styles.info}>
                      Min. Interest<span>{item.interest}% APR</span>
                    </div>
                    <div className={styles.info}>
                      Loan Term: <span>{item.term} days</span>
                    </div>
                  </div>

                  <div
                    className={styles.placeBid}
                    onClick={() => handleAAPLClick(item.stockName)}
                  >
                    Place Bid
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
                </div>
              ))}
            </div>
            <div
              className={styles.viewAll}
              onClick={() => handleNavigate("/loan-marketplace")}
            >
              <p className={styles.viewButton}>
                View All Listings
                <ArrowUpRight className={styles.arrowIcon} />
              </p>
            </div>
          </div>
        )}
        {activeTab === "collateral" && (
          // <div className={styles.wrapCol}>
          //   <div className={styles.wrapIcon}>
          //     <Briefcase className={styles.IconBrief} />
          //   </div>
          //   <h3 className={styles.titleCol}>No Collateral Added Yet</h3>
          //   <p className={styles.contentCol}>
          //     Add your public or private equity holdings as collateral to start
          //     borrowing against your assets.
          //   </p>
          //   <div className={styles.primaryButton}>Add Collateral</div>
          // </div>
          <CollateralTable />
        )}
        {activeTab === "loans" && (
          // <div className={styles.wrapCol}>
          //   <div className={styles.wrapIcon}>
          //     <LineChart className={styles.IconBrief} />
          //   </div>
          //   <h3 className={styles.titleCol}>No Active Loans</h3>
          //   <p className={styles.contentCol}>
          //     You don't have any active loans. Browse the marketplace to find
          //     borrowers or add collateral to start borrowing.
          //   </p>
          //   <div className={styles.wrapButton}>
          //     <div className={styles.browButton}>Browse Marketplace</div>
          //     <div className={styles.primaryButton}>Add Collateral</div>
          //   </div>
          // </div>
          <ActiveTable />
        )}
      </div>
      <div className={styles.wrapVECC}>
        <h2 className={styles.textWork}>How VECC Works</h2>
        <div className={styles.wrapWork}>
          <div className={styles.wrapBox}>
            <h3 className={styles.title}>Collateralize Assets</h3>
            <p className={styles.content}>
              Tokenize and pledge your public or private equity holdings as
              collateral to access liquidity without selling your assets.
            </p>
          </div>

          <div className={styles.wrapBox}>
            <h3 className={styles.title}>Participate in Auctions</h3>
            <p className={styles.content}>
              Lenders compete in free-market loan auctions to offer the best
              rates, creating a transparent and efficient marketplace.
            </p>
          </div>

          <div className={styles.wrapBox}>
            <h3 className={styles.title}>Trade Loan NFTs</h3>
            <p className={styles.content}>
              Loan positions are tokenized as NFTs that can be traded on the
              secondary market, providing additional liquidity options.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
