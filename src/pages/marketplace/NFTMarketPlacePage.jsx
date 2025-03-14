import { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Button, Typography, Box, Modal, TextField, 
  CircularProgress, Card, CardContent, Grid, Divider, Tabs, Tab
} from '@mui/material';
import { useAuth } from '../../hooks/use-auth-client';
import { BigNumber, ethers } from 'ethers';
import { toast } from 'react-toastify';

export const LoanNFTMarketplacePage = () => {
  const { contracts, account } = useAuth();
  const [activeListings, setActiveListings] = useState([]);
  const [myListedItems, setMyListedItems] = useState([]);
  const [myNFTs, setMyNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  
  const [openListModal, setOpenListModal] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [price, setPrice] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  
  const [openBuyModal, setOpenBuyModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [loadingBuy, setLoadingBuy] = useState(false);
  
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [loanDetails, setLoanDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    fetchData();
  }, [contracts, account]);

  const fetchData = async () => {
    if (!contracts.loanNFTMarketplace || !contracts.loanNFT) return;
    setLoading(true);
    
    try {
      const listings = await contracts.loanNFTMarketplace.fetchActiveListings();
      const formattedListings = await Promise.all(listings.map(async (listing) => {
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
          quantity
        };
      }));
      
      setActiveListings(formattedListings);
      
      const myItems = await contracts.loanNFTMarketplace.fetchMyListedItems();
      const formattedMyItems = await Promise.all(myItems.map(async (item) => {
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
          quantity
        };
      }));
      
      setMyListedItems(formattedMyItems);
      
      const balance = await contracts.loanNFT.balanceOf(account);
      const myTokensPromises = [];

      for (let i = 0; i < balance; i++) {
        const tokenIdPromise = contracts.loanNFT.tokenOfOwnerByIndex(account, i);
        myTokensPromises.push(tokenIdPromise);
      }
      
      const myTokenIds = await Promise.all(myTokensPromises);
      
      const myNFTsPromises = myTokenIds.map(async (tokenId) => {
        const listingId = await contracts.loanNFTMarketplace.getListingByTokenId(tokenId);
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
          quantity
        };
      });
      
      const unlistedNFTs = (await Promise.all(myNFTsPromises)).filter(nft => nft !== null);
      setMyNFTs(unlistedNFTs);
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
      toast.error('Failed to load marketplace data');
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
    setPrice('');
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
      const details = await contracts.loanNFTMarketplace.getLoanInformation(listing.listingId);
      
      setLoanDetails({
        tokenId: BigNumber.from(details.tokenId).toNumber(),
        loanId: BigNumber.from(details.loanId).toNumber(),
        interestRate: BigNumber.from(details.interestRate).toNumber() / 100,
        loanAmount: ethers.utils.formatEther(details.loanAmount),
        duration: BigNumber.from(details.duration).toNumber(),
        stockName: details.stockName,
        quantity: BigNumber.from(details.quantity).toNumber(),
        borrower: details.borrower,
        lastPaymentTime: new Date(BigNumber.from(details.lastPaymentTime).toNumber() * 1000).toLocaleDateString(),
        nextPaymentDue: new Date(BigNumber.from(details.nextPaymentDue).toNumber() * 1000).toLocaleDateString()
      });
    } catch (error) {
      console.error('Error fetching loan details:', error);
      toast.error('Failed to load loan details');
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
      const approveTx = await contracts.loanNFT.approve(contracts.loanNFTMarketplace.address, selectedNFT.tokenId);
      await approveTx.wait();
      
      const priceInWei = ethers.utils.parseEther(price);
      const listTx = await contracts.loanNFTMarketplace.listLoanNFT(selectedNFT.tokenId, priceInWei);
      await listTx.wait();
      
      toast.success('NFT listed successfully!');
      handleCloseListModal();
      fetchData();
    } catch (error) {
      console.error('Error listing NFT:', error);
      toast.error('Failed to list NFT');
    } finally {
      setLoadingList(false);
    }
  };

  const handleBuyNFT = async () => {
    if (!selectedListing) return;
    
    setLoadingBuy(true);
    try {
      const priceInWei = ethers.utils.parseEther(selectedListing.price.toString());
      // Add a small buffer to account for gas price fluctuations
      const valueToSend = BigNumber.from(priceInWei).mul(102).div(100);
      
      const buyTx = await contracts.loanNFTMarketplace.buyLoanNFT(selectedListing.listingId, {
        value: valueToSend
      });
      await buyTx.wait();
      
      toast.success('NFT purchased successfully!');
      handleCloseBuyModal();
      fetchData();
    } catch (error) {
      console.error('Error buying NFT:', error);
      toast.error('Failed to buy NFT');
    } finally {
      setLoadingBuy(false);
    }
  };

  const handleCancelListing = async (listingId) => {
    try {
      const cancelTx = await contracts.loanNFTMarketplace.cancelListing(listingId);
      await cancelTx.wait();
      
      toast.success('Listing cancelled successfully!');
      fetchData();
    } catch (error) {
      console.error('Error cancelling listing:', error);
      toast.error('Failed to cancel listing');
    }
  };

  return (
    <Box sx={{ backgroundColor: 'hsl(var(--background))', minHeight: '100vh', padding: 2 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Available Loans" />
          <Tab label="My Listed Loans" />
          <Tab label="My Loan NFTs" />
        </Tabs>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
          <CircularProgress sx={{ color: '#236cb2' }} />
        </Box>
      ) : (
        <>
          {/* Tab 1: Available Listings */}
          {tabValue === 0 && (
            <>
              <Typography variant="h6" color="primary" sx={{ marginBottom: 2 }}>
                Available Loan NFTs for Purchase
              </Typography>
              {activeListings.length === 0 ? (
                <Card>
                  <CardContent>
                    <Typography>No listings available at the moment.</Typography>
                  </CardContent>
                </Card>
              ) : (
                <Grid container spacing={2}>
                  {activeListings.map((listing) => (
                    <Grid item xs={12} sm={6} md={4} key={listing.listingId}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ color: '#236cb2', marginBottom: 1 }}>
                            {listing.stockName} - {listing.quantity} shares
                          </Typography>
                          <Divider sx={{ marginY: 1 }} />
                          <Box sx={{ marginY: 1 }}>
                            <Typography variant="body2">Loan ID: {listing.loanId}</Typography>
                            <Typography variant="body2">Interest Rate: {listing.interestRate}%</Typography>
                            <Typography variant="body2">Loan Amount: {listing.loanAmount} USDT</Typography>
                            <Typography variant="body2">Duration: {listing.duration} months</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold', marginTop: 1 }}>
                              Price: {listing.price} BNB
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                            <Button 
                              variant="outlined" 
                              sx={{ color: '#236cb2', borderColor: '#236cb2' }}
                              onClick={() => handleOpenDetailsModal(listing)}
                            >
                              Details
                            </Button>
                            <Button 
                              variant="contained" 
                              sx={{ backgroundColor: '#236cb2' }}
                              onClick={() => handleOpenBuyModal(listing)}
                            >
                              Buy
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}
          
          {/* Tab 2: My Listed Items */}
          {tabValue === 1 && (
            <>
              <Typography variant="h6" color="primary" sx={{ marginBottom: 2 }}>
                My Listed Loan NFTs
              </Typography>
              {myListedItems.length === 0 ? (
                <Card>
                  <CardContent>
                    <Typography>You haven't listed any loan NFTs yet.</Typography>
                  </CardContent>
                </Card>
              ) : (
                <Grid container spacing={2}>
                  {myListedItems.map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.listingId}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ color: '#236cb2', marginBottom: 1 }}>
                            {item.stockName} - {item.quantity} shares
                          </Typography>
                          <Divider sx={{ marginY: 1 }} />
                          <Box sx={{ marginY: 1 }}>
                            <Typography variant="body2">Loan ID: {item.loanId}</Typography>
                            <Typography variant="body2">Interest Rate: {item.interestRate}%</Typography>
                            <Typography variant="body2">Loan Amount: {item.loanAmount} USDT</Typography>
                            <Typography variant="body2">Duration: {item.duration} months</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold', marginTop: 1 }}>
                              Listed Price: {item.price} BNB
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
                            <Button 
                              variant="outlined" 
                              color="error"
                              onClick={() => handleCancelListing(item.listingId)}
                            >
                              Cancel Listing
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}

          {/* Tab 3: My NFTs */}
          {tabValue === 2 && (
            <>
              <Typography variant="h6" color="primary" sx={{ marginBottom: 2 }}>
                My Loan NFTs
              </Typography>
              {myNFTs.length === 0 ? (
                <Card>
                  <CardContent>
                    <Typography>You don't have any loan NFTs yet.</Typography>
                  </CardContent>
                </Card>
              ) : (
                <Grid container spacing={2}>
                  {myNFTs.map((nft) => (
                    <Grid item xs={12} sm={6} md={4} key={nft.tokenId}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ color: '#236cb2', marginBottom: 1 }}>
                            {nft.stockName} - {nft.quantity} shares
                          </Typography>
                          <Divider sx={{ marginY: 1 }} />
                          <Box sx={{ marginY: 1 }}>
                            <Typography variant="body2">Token ID: {nft.tokenId}</Typography>
                            <Typography variant="body2">Loan ID: {nft.loanId}</Typography>
                            <Typography variant="body2">Interest Rate: {nft.interestRate}%</Typography>
                            <Typography variant="body2">Loan Amount: {nft.loanAmount} USDT</Typography>
                            <Typography variant="body2">Duration: {nft.duration} months</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
                            <Button 
                              variant="contained" 
                              sx={{ backgroundColor: '#236cb2' }}
                              onClick={() => handleOpenListModal(nft)}
                            >
                              List for Sale
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}

          {/* Modals */}
          {/* Listing Modal */}
          <Modal open={openListModal} onClose={handleCloseListModal}>
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, backgroundColor: 'white', padding: 3, borderRadius: 2, boxShadow: 24 }}>
              <Typography variant="h6" sx={{ marginBottom: 2 }}>List Loan NFT for Sale</Typography>
              {selectedNFT && (
                <>
                  <Typography variant="body1" sx={{ marginBottom: 2 }}>
                    You are about to list your {selectedNFT.stockName} loan NFT for sale.
                  </Typography>
                  <Box sx={{ marginBottom: 2 }}>
                    <Typography variant="body2">Token ID: {selectedNFT.tokenId}</Typography>
                    <Typography variant="body2">Loan ID: {selectedNFT.loanId}</Typography>
                    <Typography variant="body2">Interest Rate: {selectedNFT.interestRate}%</Typography>
                    <Typography variant="body2">Loan Amount: {selectedNFT.loanAmount} USDT</Typography>
                    <Typography variant="body2">Duration: {selectedNFT.duration} months</Typography>
                  </Box>
                  <TextField
                    label="Price (BNB)"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    fullWidth
                    required
                    inputProps={{ min: 0.001, step: 0.001 }}
                    sx={{ marginBottom: 2 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button variant="outlined" onClick={handleCloseListModal}>Cancel</Button>
                    <Button 
                      variant="contained" 
                      sx={{ backgroundColor: '#236cb2' }} 
                      onClick={handleListNFT}
                      disabled={!price || parseFloat(price) <= 0 || loadingList}
                    >
                      {loadingList ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'List for Sale'}
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          </Modal>

          {/* Buy Modal */}
          <Modal open={openBuyModal} onClose={handleCloseBuyModal}>
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, backgroundColor: 'white', padding: 3, borderRadius: 2, boxShadow: 24 }}>
              <Typography variant="h6" sx={{ marginBottom: 2 }}>Buy Loan NFT</Typography>
              {selectedListing && (
                <>
                  <Typography variant="body1" sx={{ marginBottom: 2 }}>
                    You are about to buy the following loan NFT:
                  </Typography>
                  <Box sx={{ marginBottom: 2 }}>
                    <Typography variant="body2">Stock: {selectedListing.stockName} - {selectedListing.quantity} shares</Typography>
                    <Typography variant="body2">Interest Rate: {selectedListing.interestRate}%</Typography>
                    <Typography variant="body2">Loan Amount: {selectedListing.loanAmount} USDT</Typography>
                    <Typography variant="body2">Duration: {selectedListing.duration} months</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', marginTop: 1 }}>
                      Price: {selectedListing.price} BNB
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button variant="outlined" onClick={handleCloseBuyModal}>Cancel</Button>
                    <Button 
                      variant="contained" 
                      sx={{ backgroundColor: '#236cb2' }} 
                      onClick={handleBuyNFT}
                      disabled={loadingBuy}
                    >
                      {loadingBuy ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Confirm Purchase'}
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          </Modal>

          {/* Loan Details Modal */}
          <Modal open={openDetailsModal} onClose={handleCloseDetailsModal}>
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, backgroundColor: 'white', padding: 3, borderRadius: 2, boxShadow: 24 }}>
              <Typography variant="h6" sx={{ marginBottom: 2 }}>Loan Details</Typography>
              {loadingDetails ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', marginY: 2 }}>
                  <CircularProgress sx={{ color: '#236cb2' }} />
                </Box>
              ) : loanDetails ? (
                <>
                  <Box sx={{ marginBottom: 2 }}>
                    <Typography variant="body2">Loan ID: {loanDetails.loanId}</Typography>
                    <Typography variant="body2">Token ID: {loanDetails.tokenId}</Typography>
                    <Typography variant="body2">Stock: {loanDetails.stockName} - {loanDetails.quantity} shares</Typography>
                    <Typography variant="body2">Interest Rate: {loanDetails.interestRate}%</Typography>
                    <Typography variant="body2">Loan Amount: {loanDetails.loanAmount} USDT</Typography>
                    <Typography variant="body2">Duration: {loanDetails.duration} months</Typography>
                    <Divider sx={{ marginY: 1 }} />
                    <Typography variant="body2">Borrower: {loanDetails.borrower}</Typography>
                    <Typography variant="body2">Last Payment: {loanDetails.lastPaymentTime}</Typography>
                    <Typography variant="body2">Next Payment Due: {loanDetails.nextPaymentDue}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="outlined" onClick={handleCloseDetailsModal}>Close</Button>
                  </Box>
                </>
              ) : (
                <Typography>No details available</Typography>
              )}
            </Box>
          </Modal>
        </>
      )}
    </Box>
  )
}