import { useState, useEffect } from "react";
import {
  Modal,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../../hooks/use-auth-client";
import { BigNumber } from "ethers";
import { toast } from "react-toastify";
import styles from "./index.module.css";
import { bytes32ToString } from "../../utils";
import useTheme from "../../hooks/useTheme";

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

  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";

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
    <div className={`${styles.loanContainer} ${isDarkMode ? styles.dark : ''}`}>
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
                  <button
                    className={styles.loanButton}
                    onClick={() => handleOpenBidModal(auction)}
                  >
                    Place Bid
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Bid Modal */}
      <Modal open={!!selectedAuction} onClose={handleCloseBidModal}>
        <div className={`${styles.modalOverlay} ${isDarkMode ? styles.dark : ''}`}>
          <div className={styles.modalContainer}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <div className={styles.headerContent}>
                <div className={styles.iconWrapper}>
                  <svg 
                    className={styles.headerIcon} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" 
                    />
                  </svg>
                </div>
                <div className={styles.titleSection}>
                  <h2 className={styles.modalTitle}>Place Bid on Auction</h2>
                  <p className={styles.modalSubtitle}>Review auction details and submit your bid</p>
                </div>
              </div>
              <button 
                className={styles.closeButton}
                onClick={handleCloseBidModal}
                disabled={loadingBidMap[selectedAuction?.auctionId] || loadingApproveMap[selectedAuction?.auctionId]}
              >
                <svg className={styles.closeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className={styles.modalContent}>
              {selectedAuction && collateralDetails && (
                <>
                  {/* Auction Preview Card */}
                  <div className={styles.auctionPreview}>
                    <div className={styles.auctionHeader}>
                      <h3 className={styles.auctionTitle}>
                        Auction #{selectedAuction.auctionId} - {collateralDetails.stockName}
                      </h3>
                      <div className={styles.statusBadge}>
                        <svg className={styles.statusIcon} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Active
                      </div>
                    </div>
                    
                    <div className={styles.auctionDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Collateral</span>
                        <span className={styles.detailValue}>{collateralDetails.stockName} ({collateralDetails.quantity} shares)</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Requested Amount</span>
                        <span className={styles.detailValue}>{selectedAuction.requestedAmount} USDT</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Duration</span>
                        <span className={styles.detailValue}>{selectedAuction.duration} months</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Current Best Rate</span>
                        <span className={styles.detailValue}>
                          {selectedAuction.lowestInterestRate > 0 
                            ? `${(selectedAuction.lowestInterestRate / 100).toFixed(2)}%` 
                            : "No bids yet"}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Time Remaining</span>
                        <span className={styles.detailValue}>{formatTimeRemaining(selectedAuction.endTime)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bid Input Section */}
                  <div className={styles.bidInputSection}>
                    <label className={styles.inputLabel}>Your Bid Interest Rate (%)</label>
                    <input
                      type="number"
                      className={styles.bidInput}
                      value={bidInterestRate}
                      onChange={(e) => setBidInterestRate(parseFloat(e.target.value) || 0)}
                      placeholder="Enter interest rate"
                      min="0.1"
                      max="40"
                      step="0.1"
                    />
                    <p className={styles.inputHelper}>
                      {selectedAuction.lowestInterestRate > 0
                        ? `Must be lower than current best rate (${(selectedAuction.lowestInterestRate / 100).toFixed(2)}%)`
                        : "Enter your desired interest rate (0.1% - 40%)"}
                    </p>
                  </div>

                  {/* Bid History */}
                  {bidHistory.length > 0 && (
                    <div className={styles.bidHistorySection}>
                      <h4 className={styles.sectionTitle}>Bid History</h4>
                      <div className={styles.bidHistoryTable}>
                        <div className={styles.tableHeader}>
                          <span>Lender</span>
                          <span>Rate</span>
                          <span>Time</span>
                        </div>
                        {bidHistory.slice(0, 5).map((bid, index) => (
                          <div key={index} className={styles.tableRow}>
                            <span className={styles.tableCell}>{bid.lender.slice(0, 6)}...{bid.lender.slice(-4)}</span>
                            <span className={styles.tableCell}>{(bid.interestRate / 100).toFixed(2)}%</span>
                            <span className={styles.tableCell}>{new Date(bid.timestamp * 1000).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warning Notice */}
                  <div className={styles.warningNotice}>
                    <svg className={styles.warningIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className={styles.warningText}>
                      <p className={styles.warningTitle}>Important Notice</p>
                      <p className={styles.warningDescription}>
                        By placing a bid, you commit to providing the loan at your specified interest rate if you win the auction.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={handleCloseBidModal}
                disabled={loadingBidMap[selectedAuction?.auctionId] || loadingApproveMap[selectedAuction?.auctionId]}
              >
                Cancel
              </button>
              
              {!isApproved ? (
                <button
                  className={styles.confirmButton}
                  onClick={() => handleApproveToken(selectedAuction.requestedAmount)}
                  disabled={loadingApproveMap[selectedAuction?.auctionId]}
                >
                  {loadingApproveMap[selectedAuction?.auctionId] ? (
                    <>
                      <div className={styles.spinner}></div>
                      Approving...
                    </>
                  ) : (
                    <>
                      <svg className={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve USDT
                    </>
                  )}
                </button>
              ) : (
                <button
                  className={styles.confirmButton}
                  onClick={() => handlePlaceBid(selectedAuction.auctionId)}
                  disabled={
                    !bidInterestRate || 
                    bidInterestRate <= 0 || 
                    loadingBidMap[selectedAuction?.auctionId] ||
                    (selectedAuction.lowestInterestRate > 0 && 
                     bidInterestRate >= selectedAuction.lowestInterestRate / 100)
                  }
                >
                  {loadingBidMap[selectedAuction?.auctionId] ? (
                    <>
                      <div className={styles.spinner}></div>
                      Placing Bid...
                    </>
                  ) : (
                    <>
                      <svg className={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Place Bid
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MarketPlace;