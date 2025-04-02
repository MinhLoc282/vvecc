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
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../../hooks/use-auth-client";
import { BigNumber } from "ethers";
import { toast } from "react-toastify";
import styles from "./index.module.css";
import { bytes32ToString } from "../../utils";

const MarketPlace = () => {
  const { 
    getOpenAuctions, 
    placeBid, 
    contracts, 
    account,
    getAuctionWithCollateralDetails,
    getAuctionBids
  } = useAuth();
  
  const [auctions, setAuctions] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bidInterestRate, setBidInterestRate] = useState(0);
  const [loadingBidMap, setLoadingBidMap] = useState({});
  const [loadingApproveMap, setLoadingApproveMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [bidHistory, setBidHistory] = useState([]);
  const [collateralDetails, setCollateralDetails] = useState(null);
  const [isApproved, setIsApproved] = useState(false);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const openAuctions = await getOpenAuctions();

      const formattedAuctions = openAuctions.map(auction => ({
        ...auction,
        auctionId: BigNumber.from(auction.auctionId).toNumber(),
        collateralId: BigNumber.from(auction.collateralId).toNumber(),
        requestedAmount: BigNumber.from(auction.requestedAmount).div(BigNumber.from(10).pow(18)).toNumber(),
        duration: BigNumber.from(auction.duration).toNumber(),
        lowestInterestRate: BigNumber.from(auction.lowestInterestRate).toNumber(),
        startTime: BigNumber.from(auction.startTime).toNumber(),
        endTime: BigNumber.from(auction.endTime).toNumber(),
      }));

      setAuctions(formattedAuctions);
    } catch (error) {
      console.error("Error fetching auctions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuctionDetails = async (auctionId) => {
    try {
      const { auction: auctionData, collateral: collateralData} = await getAuctionWithCollateralDetails(auctionId);

      const formattedAuction = {
        auctionId: BigNumber.from(auctionData.auctionId).toNumber(),
        collateralId: BigNumber.from(auctionData.collateralId).toNumber(),
        requestedAmount: BigNumber.from(auctionData.requestedAmount).div(BigNumber.from(10).pow(18)).toNumber(),
        duration: BigNumber.from(auctionData.duration).toNumber(),
        lowestInterestRate: BigNumber.from(auctionData.lowestInterestRate).toNumber(),
        currentBestLender: auctionData.currentBestLender,
        startTime: BigNumber.from(auctionData.startTime).toNumber(),
        endTime: BigNumber.from(auctionData.endTime).toNumber(),
        status: auctionData.status
      };
  
      const formattedCollateral = {
        collateralId: BigNumber.from(collateralData.collateralId).toNumber(),
        owner: collateralData.owner,
        stockName: bytes32ToString(collateralData.stockName),
        quantity: BigNumber.from(collateralData.quantity).toNumber(),
        status: collateralData.status,
        acceptedLoanId: BigNumber.from(collateralData.acceptedLoanId).toNumber(),
        requestedAmount: BigNumber.from(collateralData.requestedAmount).div(BigNumber.from(10).pow(18)).toNumber(),
        duration: BigNumber.from(collateralData.duration).toNumber(),
        auctionId: BigNumber.from(collateralData.auctionId).toNumber()
      };
  
      setSelectedAuction(formattedAuction);
      setCollateralDetails(formattedCollateral);
      
      // Check approval status for this auction amount
      await checkTokenApproval(formattedAuction.requestedAmount);
      
      // Get bid history
      const bids = await getAuctionBids(auctionId);

      const formattedBids = bids.map(bid => ({
        auctionId: BigNumber.from(bid.auctionId).toNumber(),
        lender: bid.lender,
        interestRate: BigNumber.from(bid.interestRate).toNumber(),
        timestamp: BigNumber.from(bid.timestamp).toNumber()
      }));
      setBidHistory(formattedBids);
    } catch (error) {
      console.error("Error fetching auction details:", error);
    }
  };

  const checkTokenApproval = async (amount) => {
    try {
      if (!contracts.token || !account) {
        setIsApproved(false);
        return;
      }

      const allowance = await contracts.token.allowance(
        account,
        contracts.loan.address
      );
      const requiredAmount = BigNumber.from(amount).mul(BigNumber.from(10).pow(18));
      setIsApproved(BigNumber.from(allowance).gte(requiredAmount));
    } catch (error) {
      console.error("Error checking token allowance:", error);
      setIsApproved(false);
    }
  };

  const handleApproveToken = async (amount) => {
    try {
      setLoadingApproveMap((prev) => ({ ...prev, [selectedAuction.auctionId]: true }));
      
      const tx = await contracts.token.approve(
        contracts.loan.address,
        BigNumber.from(amount).mul(BigNumber.from(10).pow(18))
      );
      await tx.wait();
      
      setIsApproved(true);
      toast.success("Token approval successful!");
    } catch (error) {
      console.error("Error approving token:", error);
      toast.error("Failed to approve tokens");
    } finally {
      setLoadingApproveMap((prev) => ({ ...prev, [selectedAuction.auctionId]: false }));
    }
  };

  const handleOpenBidModal = async (auction) => {
    setSelectedAuction(auction);
    await fetchAuctionDetails(auction.auctionId);
  };

  const handleCloseBidModal = () => {
    setSelectedAuction(null);
    setBidInterestRate(0);
    setBidHistory([]);
    setCollateralDetails(null);
    setIsApproved(false);
  };

  const handlePlaceBid = async (auctionId) => {
    if (!bidInterestRate || bidInterestRate <= 0) {
      toast.error("Please enter a valid interest rate");
      return;
    }

    try {
      setLoadingBidMap((prev) => ({ ...prev, [auctionId]: true }));

      const interestRateBasisPoints = Math.round(bidInterestRate * 100);
      
      await placeBid(auctionId, interestRateBasisPoints);
      toast.success("Bid placed successfully!");
      
      await fetchAuctions();
      await fetchAuctionDetails(auctionId);
    } catch (error) {
      console.error("Error placing bid:", error);
      toast.error(`Failed to place bid: ${error.message}`);
    } finally {
      setLoadingBidMap((prev) => ({ ...prev, [auctionId]: false }));
    }
  };

  const formatTimeRemaining = (endTime) => {
    const now = Math.floor(Date.now() / 1000);
    const remainingSeconds = Math.max(0, endTime - now);
    
    const days = Math.floor(remainingSeconds / (24 * 60 * 60));
    const hours = Math.floor((remainingSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((remainingSeconds % (60 * 60)) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  useEffect(() => {
    if (contracts.loan) {
      fetchAuctions();
    }
  }, [contracts]);

  return (
    <div className={styles.loanContainer}>
      <table className={styles.loanTable}>
        <thead>
          <tr>
            <th>Collateral</th>
            <th>Requested Amount</th>
            <th>Duration</th>
            <th>Current Best Rate</th>
            <th>Time Remaining</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} align="center">
                <CircularProgress />
              </td>
            </tr>
          ) : auctions.length === 0 ? (
            <tr>
              <td colSpan={6} align="center">
                No open auctions found
              </td>
            </tr>
          ) : (
            auctions.map((auction) => (
              <tr key={auction.auctionId}>
                <td>Auction #{auction.auctionId}</td>
                <td>{auction.requestedAmount} USDT</td>
                <td>{auction.duration} months</td>
                <td>
                  {auction.lowestInterestRate > 0 
                    ? `${(auction.lowestInterestRate / 100).toFixed(2)}%` 
                    : "No bids yet"}
                </td>
                <td>{formatTimeRemaining(auction.endTime)}</td>
                <td>
                  <Button
                    variant="contained"
                    sx={{ backgroundColor: "#236cb2" }}
                    onClick={() => handleOpenBidModal(auction)}
                  >
                    Place Bid
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Bid Modal */}
      <Modal open={!!selectedAuction} onClose={handleCloseBidModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            backgroundColor: "white",
            padding: 3,
            borderRadius: 2,
            boxShadow: 24,
          }}
        >
          {selectedAuction && collateralDetails && (
            <>
              <Typography variant="h6" gutterBottom>
                Place Bid for Auction #{selectedAuction.auctionId}
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                <strong>Collateral:</strong> {collateralDetails.stockName} ({collateralDetails.quantity} shares)
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                <strong>Requested Amount:</strong> {selectedAuction.requestedAmount} USDT
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                <strong>Duration:</strong> {selectedAuction.duration} months
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                <strong>Current Best Rate:</strong> {selectedAuction.lowestInterestRate > 0 
                  ? `${(selectedAuction.lowestInterestRate / 100).toFixed(2)}%` 
                  : "No bids yet"}
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                <strong>Time Remaining:</strong> {formatTimeRemaining(selectedAuction.endTime)}
              </Typography>

              <TextField
                label="Your Bid Interest Rate (%)"
                type="number"
                value={bidInterestRate}
                onChange={(e) => setBidInterestRate(parseFloat(e.target.value) || 0)}
                fullWidth
                margin="normal"
                inputProps={{
                  min: 0.1,
                  max: 40,
                  step: 0.1
                }}
                helperText={
                  selectedAuction.lowestInterestRate > 0
                    ? `Must be lower than current best rate (${(selectedAuction.lowestInterestRate / 100).toFixed(2)}%)`
                    : "Enter your desired interest rate (0.1% - 40%)"
                }
              />

              {bidHistory.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle1">Bid History:</Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 200, overflow: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Lender</TableCell>
                          <TableCell>Rate</TableCell>
                          <TableCell>Time</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bidHistory.map((bid, index) => (
                          <TableRow key={index}>
                            <TableCell>{bid.lender}</TableCell>
                            <TableCell>{(bid.interestRate / 100).toFixed(2)}%</TableCell>
                            <TableCell>{new Date(bid.timestamp * 1000).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  sx={{ color: "#236cb2", borderColor: "#236cb2" }}
                  onClick={handleCloseBidModal}
                >
                  Cancel
                </Button>
                
                {!isApproved ? (
                  <Button
                    variant="contained"
                    sx={{ backgroundColor: "#236cb2" }}
                    onClick={() => handleApproveToken(selectedAuction.requestedAmount)}
                    disabled={loadingApproveMap[selectedAuction.auctionId]}
                  >
                    {loadingApproveMap[selectedAuction.auctionId] ? (
                      <CircularProgress size={24} sx={{ color: "white" }} />
                    ) : (
                      "Approve USDT"
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    sx={{ backgroundColor: "#236cb2" }}
                    onClick={() => handlePlaceBid(selectedAuction.auctionId)}
                    disabled={
                      !bidInterestRate || 
                      bidInterestRate <= 0 || 
                      loadingBidMap[selectedAuction.auctionId] ||
                      (selectedAuction.lowestInterestRate > 0 && 
                       bidInterestRate >= selectedAuction.lowestInterestRate / 100)
                    }
                  >
                    {loadingBidMap[selectedAuction.auctionId] ? (
                      <CircularProgress size={24} sx={{ color: "white" }} />
                    ) : (
                      "Place Bid"
                    )}
                  </Button>
                )}
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </div>
  );
};

export default MarketPlace;