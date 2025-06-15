import { useState, useEffect } from "react";
import {
  Button,
  Typography,
  Box,
  Modal,
  TextField,
  CircularProgress,
  Grid
} from "@mui/material";
import { useAuth } from "../../hooks/use-auth-client";
import { BigNumber, ethers } from "ethers";
import { toast } from "react-toastify";
import { bytes32ToString } from "../../utils";
import styles from "./NFTMarketPlace.module.css";
import { TabContainer } from "../../components/TabContainer";
import { NFTCard } from "../../components/NFTCard";
import { EmptyState } from "../../components/EmptyState";
import { BuyNFTModal } from "../../components/BuyNFTModal";
import { LoanDetailsModal } from "../../components/LoanDetailsModal";
import useTheme from "../../hooks/useTheme";

export const LoanNFTMarketplacePage = () => {
  const { contracts, account } = useAuth();
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";
  
  const [activeListings, setActiveListings] = useState([]);
  const [myListedItems, setMyListedItems] = useState([]);
  const [myNFTs, setMyNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  const [openListModal, setOpenListModal] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [price, setPrice] = useState("");
  const [loadingList, setLoadingList] = useState(false);

  const [openBuyModal, setOpenBuyModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [loadingBuy, setLoadingBuy] = useState(false);

  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [loanDetails, setLoanDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const tabs = [
    { id: "available", label: "Available Loans" },
    { id: "listed", label: "My Listed Loans" },
    { id: "nfts", label: "My Loan NFTs" },
  ];

  const [activeTab, setActiveTab] = useState("available");
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  useEffect(() => {
    fetchData();
  }, [contracts, account]);

  const fetchData = async () => {
    if (!contracts.loanNFTMarketplace || !contracts.loanNFT) return;
    setLoading(true);

    try {
      const listings = await contracts.loanNFTMarketplace.fetchActiveListings();
      const formattedListings = await Promise.all(
        listings.map(async (listing) => {
          const tokenId = BigNumber.from(listing.tokenId).toNumber();
          const loanId = BigNumber.from(listing.loanId).toNumber();
          const price = ethers.utils.formatEther(listing.price);
          const seller = listing.seller;

          const loanDetails = await contracts.loanNFT.getLoanDetails(tokenId);
          const collateralId = BigNumber.from(loanDetails[1]).toNumber();
          const interestRate = BigNumber.from(loanDetails[2]).toNumber() / 100; // Convert basis points to percentage
          const loanAmount = ethers.utils.formatEther(loanDetails[3]);
          const duration = BigNumber.from(loanDetails[4]).toNumber();

          const collateral = await contracts.loan.collaterals(collateralId);
          const stockName = collateral[2];
          const quantity = BigNumber.from(collateral[3]).toNumber();

          return {
            listingId: BigNumber.from(listing.listingId).toNumber(),
            tokenId,
            loanId,
            price,
            seller,
            interestRate,
            loanAmount,
            duration,
            stockName,
            quantity,
          };
        })
      );

      setActiveListings(formattedListings);

      const myItems = await contracts.loanNFTMarketplace.fetchMyListedItems();
      const formattedMyItems = await Promise.all(
        myItems.map(async (item) => {
          const tokenId = BigNumber.from(item.tokenId).toNumber();
          const loanId = BigNumber.from(item.loanId).toNumber();
          const price = ethers.utils.formatEther(item.price);

          const loanDetails = await contracts.loanNFT.getLoanDetails(tokenId);
          const collateralId = BigNumber.from(loanDetails[1]).toNumber();
          const interestRate = BigNumber.from(loanDetails[2]).toNumber() / 100;
          const loanAmount = ethers.utils.formatEther(loanDetails[3]);
          const duration = BigNumber.from(loanDetails[4]).toNumber();

          const collateral = await contracts.loan.collaterals(collateralId);
          const stockName = collateral[2];
          const quantity = BigNumber.from(collateral[3]).toNumber();

          return {
            listingId: BigNumber.from(item.listingId).toNumber(),
            tokenId,
            loanId,
            price,
            interestRate,
            loanAmount,
            duration,
            stockName,
            quantity,
          };
        })
      );

      setMyListedItems(formattedMyItems);

      const balance = await contracts.loanNFT.balanceOf(account);
      const myTokensPromises = [];

      for (let i = 0; i < balance; i++) {
        const tokenIdPromise = contracts.loanNFT.tokenOfOwnerByIndex(
          account,
          i
        );
        myTokensPromises.push(tokenIdPromise);
      }

      const myTokenIds = await Promise.all(myTokensPromises);

      const myNFTsPromises = myTokenIds.map(async (tokenId) => {
        const listingId =
          await contracts.loanNFTMarketplace.getListingByTokenId(tokenId);
        if (BigNumber.from(listingId).toNumber() > 0) return null; // Skip if already listed

        const loanDetails = await contracts.loanNFT.getLoanDetails(tokenId);
        const loanId = BigNumber.from(loanDetails[0]).toNumber();
        const collateralId = BigNumber.from(loanDetails[1]).toNumber();
        const interestRate = BigNumber.from(loanDetails[2]).toNumber() / 100;
        const loanAmount = ethers.utils.formatEther(loanDetails[3]);
        const duration = BigNumber.from(loanDetails[4]).toNumber();

        const collateral = await contracts.loan.collaterals(collateralId);
        const stockName = collateral[2];
        const quantity = BigNumber.from(collateral[3]).toNumber();

        return {
          tokenId: BigNumber.from(tokenId).toNumber(),
          loanId,
          interestRate,
          loanAmount,
          duration,
          stockName,
          quantity,
        };
      });

      const unlistedNFTs = (await Promise.all(myNFTsPromises)).filter(
        (nft) => nft !== null
      );
      setMyNFTs(unlistedNFTs);
    } catch (error) {
      console.error("Error fetching marketplace data:", error);
      toast.error("Failed to load marketplace data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenListModal = (nft) => {
    setSelectedNFT(nft);
    setOpenListModal(true);
  };

  const handleCloseListModal = () => {
    setOpenListModal(false);
    setSelectedNFT(null);
    setPrice("");
  };

  const handleOpenBuyModal = (listing) => {
    setSelectedListing(listing);
    setOpenBuyModal(true);
  };

  const handleCloseBuyModal = () => {
    setOpenBuyModal(false);
    setSelectedListing(null);
  };

  const handleOpenDetailsModal = async (listing) => {
    setLoadingDetails(true);
    setOpenDetailsModal(true);

    try {
      const details = await contracts.loanNFTMarketplace.getLoanInformation(
        listing.listingId
      );

      setLoanDetails({
        tokenId: BigNumber.from(details.tokenId).toNumber(),
        loanId: BigNumber.from(details.loanId).toNumber(),
        interestRate: BigNumber.from(details.interestRate).toNumber() / 100,
        loanAmount: ethers.utils.formatEther(details.loanAmount),
        duration: BigNumber.from(details.duration).toNumber(),
        stockName: details.stockName,
        quantity: BigNumber.from(details.quantity).toNumber(),
        borrower: details.borrower,
        lastPaymentTime: new Date(
          BigNumber.from(details.lastPaymentTime).toNumber() * 1000
        ).toLocaleDateString(),
        nextPaymentDue: new Date(
          BigNumber.from(details.nextPaymentDue).toNumber() * 1000
        ).toLocaleDateString(),
      });
    } catch (error) {
      console.error("Error fetching loan details:", error);
      toast.error("Failed to load loan details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setOpenDetailsModal(false);
    setLoanDetails(null);
  };

  const handleListNFT = async () => {
    if (!selectedNFT || !price || parseFloat(price) <= 0) return;

    setLoadingList(true);
    try {
      const approveTx = await contracts.loanNFT.approve(
        contracts.loanNFTMarketplace.address,
        selectedNFT.tokenId
      );
      await approveTx.wait();

      const priceInWei = ethers.utils.parseEther(price);
      const listTx = await contracts.loanNFTMarketplace.listLoanNFT(
        selectedNFT.tokenId,
        priceInWei,
        true
      );
      await listTx.wait();

      toast.success("NFT listed successfully!");
      handleCloseListModal();
      fetchData();
    } catch (error) {
      console.error("Error listing NFT:", error);
      toast.error("Failed to list NFT");
    } finally {
      setLoadingList(false);
    }
  };

  const handleBuyNFT = async () => {
    if (!selectedListing) return;

    setLoadingBuy(true);
    try {
      const priceInSmallestUnit = ethers.utils.parseUnits(
        selectedListing.price.toString(),
        18
      );

      const currentAllowance = await contracts.token.allowance(
        account,
        contracts.loanNFTMarketplace.address
      );

      if (currentAllowance.lt(priceInSmallestUnit)) {
        const approveTx = await contracts.token.approve(
          contracts.loanNFTMarketplace.address,
          priceInSmallestUnit
        );
        await approveTx.wait();
      }

      const buyTx = await contracts.loanNFTMarketplace.buyLoanNFTWithERC20(
        selectedListing.listingId
      );
      await buyTx.wait();

      toast.success("NFT purchased successfully!");
      handleCloseBuyModal();
      fetchData();
    } catch (error) {
      console.error("Error buying NFT:", error);
      toast.error("Failed to buy NFT");
    } finally {
      setLoadingBuy(false);
    }
  };

  const handleCancelListing = async (listingId) => {
    try {
      const cancelTx = await contracts.loanNFTMarketplace.cancelListing(
        listingId
      );
      await cancelTx.wait();

      toast.success("Listing cancelled successfully!");
      fetchData();
    } catch (error) {
      console.error("Error cancelling listing:", error);
      toast.error("Failed to cancel listing");
    }
  };  return (
    <div className={`${styles.wrapContainer} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.container}>
        <div className={styles.wrapFirstContent}>
          <div className={styles.content}>
            <h1 className={styles.title}>NFT Marketplace</h1>
            <p className={styles.subtitle}>
              Trade loan NFTs and explore investment opportunities
            </p>
          </div>
        </div>{" "}
        <div className={styles.wrapThirdContent}>
          <TabContainer
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            gridColumns={3}
          >
            {loading ? (
              <Box
                sx={{ display: "flex", justifyContent: "center", marginTop: 4 }}
              >
                <CircularProgress sx={{ color: "#236cb2" }} />
              </Box>
            ) : (
              <>
                {" "}
                {/* Tab 1: Available Listings */}
                {activeTab === "available" && (
                  <>
                    {activeListings.length === 0 ? (
                      <EmptyState
                        title="No Listings Available"
                        description="There are no loan NFTs available for purchase at the moment. Check back later for new listings."
                        variant="default"
                      />
                    ) : (
                      <Grid container spacing={3}>
                        {activeListings.map((listing) => (
                          <Grid
                            item
                            xs={12}
                            sm={6}
                            md={4}
                            key={listing.listingId}
                          >
                            <NFTCard
                              title={`${bytes32ToString(listing.stockName)} - ${
                                listing.quantity
                              } shares`}
                              subtitle={`Loan ID: ${listing.loanId}`}
                              price={listing.price}
                              currency="USDT"
                              status="Available"
                              metadata={[
                                {
                                  label: "Interest Rate",
                                  value: `${listing.interestRate}%`,
                                },
                                {
                                  label: "Loan Amount",
                                  value: `${listing.loanAmount} USDT`,
                                },
                                {
                                  label: "Duration",
                                  value: `${listing.duration} months`,
                                },
                              ]}
                              actionText="Buy Now"
                              secondaryActionText="Details"
                              onAction={() => handleOpenBuyModal(listing)}
                              onSecondaryAction={() =>
                                handleOpenDetailsModal(listing)
                              }
                              variant="default"
                              className="gridItem"
                            />
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </>
                )}{" "}
                {/* Tab 2: My Listed Items */}
                {activeTab === "listed" && (
                  <>
                    {myListedItems.length === 0 ? (
                      <EmptyState
                        title="No Listed Items"
                        description="You haven't listed any loan NFTs for sale yet."
                        variant="default"
                      />
                    ) : (
                      <Grid container spacing={3}>
                        {myListedItems.map((item) => (
                          <Grid item xs={12} sm={6} md={4} key={item.listingId}>
                            <NFTCard
                              title={`${bytes32ToString(item.stockName)} - ${
                                item.quantity
                              } shares`}
                              subtitle={`Loan ID: ${item.loanId}`}
                              price={item.price}
                              currency="USDT"
                              status="Listed"
                              metadata={[
                                {
                                  label: "Interest Rate",
                                  value: `${item.interestRate}%`,
                                },
                                {
                                  label: "Loan Amount",
                                  value: `${item.loanAmount} USDT`,
                                },
                                {
                                  label: "Duration",
                                  value: `${item.duration} months`,
                                },
                              ]}
                              actionText="Cancel Listing"
                              onAction={() =>
                                handleCancelListing(item.listingId)
                              }
                              variant="default"
                              className="gridItem"
                            />
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </>
                )}{" "}
                {/* Tab 3: My NFTs */}
                {activeTab === "nfts" && (
                  <>
                    {myNFTs.length === 0 ? (
                      <EmptyState
                        title="No Loan NFTs"
                        description="You don't have any loan NFTs in your wallet yet."
                        variant="default"
                      />
                    ) : (
                      <Grid container spacing={3}>
                        {myNFTs.map((nft) => (
                          <Grid item xs={12} sm={6} md={4} key={nft.tokenId}>
                            <NFTCard
                              title={`${bytes32ToString(nft.stockName)} - ${
                                nft.quantity
                              } shares`}
                              subtitle={`Token ID: ${nft.tokenId} | Loan ID: ${nft.loanId}`}
                              status="Owned"
                              metadata={[
                                {
                                  label: "Interest Rate",
                                  value: `${nft.interestRate}%`,
                                },
                                {
                                  label: "Loan Amount",
                                  value: `${nft.loanAmount} USDT`,
                                },
                                {
                                  label: "Duration",
                                  value: `${nft.duration} months`,
                                },
                              ]}
                              actionText="List for Sale"
                              onAction={() => handleOpenListModal(nft)}
                              variant="default"
                              className="gridItem"
                            />
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </>
                )}
              </>
            )}
          </TabContainer>
        </div>
        {/* Modals */}
        {/* Listing Modal */}
        <Modal open={openListModal} onClose={handleCloseListModal}>
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
            <Typography variant="h6" sx={{ marginBottom: 2 }}>
              List Loan NFT for Sale
            </Typography>
            {selectedNFT && (
              <>
                <Typography variant="body1" sx={{ marginBottom: 2 }}>
                  You are about to list your{" "}
                  {bytes32ToString(selectedNFT.stockName)} loan NFT for sale.
                </Typography>
                <Box sx={{ marginBottom: 2 }}>
                  <Typography variant="body2">
                    Token ID: {selectedNFT.tokenId}
                  </Typography>
                  <Typography variant="body2">
                    Loan ID: {selectedNFT.loanId}
                  </Typography>
                  <Typography variant="body2">
                    Interest Rate: {selectedNFT.interestRate}%
                  </Typography>
                  <Typography variant="body2">
                    Loan Amount: {selectedNFT.loanAmount} USDT
                  </Typography>
                  <Typography variant="body2">
                    Duration: {selectedNFT.duration} months
                  </Typography>
                </Box>
                <TextField
                  label="Price (USDT)"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  fullWidth
                  required
                  inputProps={{ min: 0.001, step: 0.001 }}
                  sx={{ marginBottom: 2 }}
                />
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}
                >
                  <Button variant="outlined" onClick={handleCloseListModal}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    sx={{ backgroundColor: "#236cb2" }}
                    onClick={handleListNFT}
                    disabled={!price || parseFloat(price) <= 0 || loadingList}
                  >
                    {loadingList ? (
                      <CircularProgress size={24} sx={{ color: "white" }} />
                    ) : (
                      "List for Sale"
                    )}
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Modal>        
        {/* Buy Modal */}        <BuyNFTModal
          open={openBuyModal}
          onClose={handleCloseBuyModal}
          listing={selectedListing}
          loading={loadingBuy}
          onConfirmPurchase={handleBuyNFT}
        />
        
        {/* Loan Details Modal */}
        <LoanDetailsModal
          open={openDetailsModal}
          onClose={handleCloseDetailsModal}
          loanDetails={loanDetails}
          loading={loadingDetails}
        />
      </div>
    </div>
  );
};
