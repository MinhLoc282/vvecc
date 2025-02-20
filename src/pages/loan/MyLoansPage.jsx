import React, { useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';

const MyLoansPage = () => {
  // Mock data for collateral offers (loans from other users that I can accept)
  const [collateralOffers, setCollateralOffers] = useState([
    { 
      id: 1, 
      stockName: 'AAPL', 
      quantity: 10, 
      owner: '0x123...', 
      interestRate: 5.5,
      loanAmount: 2000,
      duration: 12,
    },
    { 
      id: 2, 
      stockName: 'MSFT', 
      quantity: 15, 
      owner: '0x456...', 
      interestRate: 7.2,
      loanAmount: 3500,
      duration: 6,
    },
    { 
      id: 3, 
      stockName: 'TSLA', 
      quantity: 5, 
      owner: '0x789...', 
      interestRate: 8.5,
      loanAmount: 1800,
      duration: 24,
    },
  ]);

  // Mock data for my active loans (loans I've given out)
  const [myActiveLoans, setMyActiveLoans] = useState([
    { 
      id: 1, 
      stockName: 'GOOGL', 
      quantity: 8, 
      borrower: '0xabc...', 
      interestRate: 6.5,
      loanAmount: 4000,
      duration: 12,
      startDate: '2024-12-15',
      endDate: '2025-12-15',
    },
    { 
      id: 2, 
      stockName: 'AMZN', 
      quantity: 3, 
      borrower: '0xdef...', 
      interestRate: 9.0,
      loanAmount: 2500,
      duration: 6,
      startDate: '2025-01-10',
      endDate: '2025-07-10',
    },
  ]);

  // State for tabs
  const [tabValue, setTabValue] = useState(0);

  // State for modals
  const [openAcceptModal, setOpenAcceptModal] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [acceptAmount, setAcceptAmount] = useState(0);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle open accept modal
  const handleOpenAcceptModal = (offer) => {
    setSelectedOffer(offer);
    setAcceptAmount(offer.loanAmount);
    setOpenAcceptModal(true);
  };

  // Handle close accept modal
  const handleCloseAcceptModal = () => {
    setOpenAcceptModal(false);
    setSelectedOffer(null);
    setAcceptAmount(0);
  };

  // Handle open cancel modal
  const handleOpenCancelModal = (loan) => {
    setSelectedLoan(loan);
    setOpenCancelModal(true);
  };

  // Handle close cancel modal
  const handleCloseCancelModal = () => {
    setOpenCancelModal(false);
    setSelectedLoan(null);
  };

  // Handle accept loan
  const handleAcceptLoan = () => {
    console.log('Accepting loan offer:', {
      offer: selectedOffer,
      acceptAmount: acceptAmount
    });
    
    // Remove from collateral offers
    const updatedOffers = collateralOffers.filter(offer => offer.id !== selectedOffer.id);
    setCollateralOffers(updatedOffers);
    
    handleCloseAcceptModal();
  };

  // Handle cancel loan
  const handleCancelLoan = () => {
    console.log('Cancelling loan:', selectedLoan);
    
    // Remove from my active loans
    const updatedLoans = myActiveLoans.filter(loan => loan.id !== selectedLoan.id);
    setMyActiveLoans(updatedLoans);
    
    handleCloseCancelModal();
  };

  // Format duration to display
  const formatDuration = (months) => {
    if (months < 12) {
      return `${months} months`;
    } else if (months === 12) {
      return '1 year';
    } else if (months === 24) {
      return '2 years';
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      return remainingMonths > 0 
        ? `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
        : `${years} year${years > 1 ? 's' : ''}`;
    }
  };

  return (
    <Box sx={{ padding: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" color="primary" sx={{ color: 'rgb(0, 50, 99)', marginBottom: 3 }}>
        My Loans
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="loan tabs"
          sx={{
            '& .MuiTab-root': { color: 'rgb(133, 134, 151)' },
            '& .Mui-selected': { color: 'rgb(0, 50, 99)' },
            '& .MuiTabs-indicator': { backgroundColor: 'rgb(0, 50, 99)' },
          }}
        >
          <Tab label="Available Collateral Offers" />
          <Tab label="My Active Loans" />
        </Tabs>
      </Box>

      {/* Tab 1: Collateral Offers (Loans from others that I can accept) */}
      {tabValue === 0 && (
        <TableContainer component={Paper} sx={{ backgroundColor: 'white', marginBottom: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Stock</TableCell>
                <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Quantity</TableCell>
                <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Owner</TableCell>
                <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Interest Rate</TableCell>
                <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Loan Amount</TableCell>
                <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Duration</TableCell>
                <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {collateralOffers.length > 0 ? (
                collateralOffers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{offer.stockName}</TableCell>
                    <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{offer.quantity}</TableCell>
                    <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{offer.owner}</TableCell>
                    <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{offer.interestRate}%</TableCell>
                    <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>${offer.loanAmount}</TableCell>
                    <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{formatDuration(offer.duration)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        sx={{
                          color: '#236cb2',
                          borderColor: '#236cb2',
                          '&:hover': { borderColor: '#1a4f8a' },
                        }}
                        onClick={() => handleOpenAcceptModal(offer)}
                      >
                        Accept
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', color: 'rgb(133, 134, 151)' }}>
                    No collateral offers available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tab 2: My Active Loans (Loans I've given out that I can cancel) */}
      {tabValue === 1 && (
        <TableContainer component={Paper} sx={{ backgroundColor: 'white' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Stock</TableCell>
                <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Quantity</TableCell>
                <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Borrower</TableCell>
                <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Interest Rate</TableCell>
                <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Loan Amount</TableCell>
                <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Duration</TableCell>
                <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>End Date</TableCell>
                <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myActiveLoans.length > 0 ? (
                myActiveLoans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{loan.stockName}</TableCell>
                    <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{loan.quantity}</TableCell>
                    <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{loan.borrower}</TableCell>
                    <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{loan.interestRate}%</TableCell>
                    <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>${loan.loanAmount}</TableCell>
                    <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{formatDuration(loan.duration)}</TableCell>
                    <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{loan.endDate}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="error"
                        sx={{
                          borderColor: '#d32f2f',
                          '&:hover': { borderColor: '#c62828' },
                        }}
                        onClick={() => handleOpenCancelModal(loan)}
                      >
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', color: 'rgb(133, 134, 151)' }}>
                    You have no active loans
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Accept Loan Modal */}
      <Modal
        open={openAcceptModal}
        onClose={handleCloseAcceptModal}
        aria-labelledby="accept-loan-modal"
        aria-describedby="accept-loan-form"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            backgroundColor: 'white',
            padding: 3,
            borderRadius: 2,
            boxShadow: 24,
          }}
        >
          <Typography variant="h6" sx={{ color: 'rgb(0, 50, 99)', marginBottom: 2 }}>
            Accept Loan Offer for {selectedOffer?.stockName}
          </Typography>
          
          <Box sx={{ marginBottom: 2 }}>
            <Typography variant="body1">
              <strong>Stock:</strong> {selectedOffer?.stockName}
            </Typography>
            <Typography variant="body1">
              <strong>Quantity:</strong> {selectedOffer?.quantity}
            </Typography>
            <Typography variant="body1">
              <strong>Owner:</strong> {selectedOffer?.owner}
            </Typography>
            <Typography variant="body1">
              <strong>Interest Rate:</strong> {selectedOffer?.interestRate}%
            </Typography>
            <Typography variant="body1">
              <strong>Duration:</strong> {selectedOffer ? formatDuration(selectedOffer.duration) : ''}
            </Typography>
          </Box>
          
          <TextField
            label="Loan Amount"
            type="number"
            value={acceptAmount}
            onChange={(e) => setAcceptAmount(parseFloat(e.target.value))}
            fullWidth
            required
            inputProps={{ 
              min: 1, 
              max: selectedOffer?.loanAmount,
              step: 1
            }}
            helperText={`Maximum amount: $${selectedOffer?.loanAmount}`}
            sx={{ marginBottom: 2 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              sx={{ color: '#236cb2', borderColor: '#236cb2' }}
              onClick={handleCloseAcceptModal}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{ backgroundColor: '#236cb2', '&:hover': { backgroundColor: '#1a4f8a' } }}
              onClick={handleAcceptLoan}
              disabled={!acceptAmount || acceptAmount <= 0 || acceptAmount > selectedOffer?.loanAmount}
            >
              Accept
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Cancel Loan Modal */}
      <Modal
        open={openCancelModal}
        onClose={handleCloseCancelModal}
        aria-labelledby="cancel-loan-modal"
        aria-describedby="cancel-loan-confirmation"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            backgroundColor: 'white',
            padding: 3,
            borderRadius: 2,
            boxShadow: 24,
          }}
        >
          <Typography variant="h6" sx={{ color: 'rgb(0, 50, 99)', marginBottom: 2 }}>
            Cancel Loan for {selectedLoan?.stockName}
          </Typography>
          
          <Typography variant="body1" sx={{ marginBottom: 3 }}>
            Are you sure you want to cancel this loan? This action cannot be undone.
          </Typography>
          
          <Box sx={{ marginBottom: 3 }}>
            <Typography variant="body1">
              <strong>Stock:</strong> {selectedLoan?.stockName}
            </Typography>
            <Typography variant="body1">
              <strong>Borrower:</strong> {selectedLoan?.borrower}
            </Typography>
            <Typography variant="body1">
              <strong>Loan Amount:</strong> ${selectedLoan?.loanAmount}
            </Typography>
            <Typography variant="body1">
              <strong>End Date:</strong> {selectedLoan?.endDate}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              sx={{ color: '#236cb2', borderColor: '#236cb2' }}
              onClick={handleCloseCancelModal}
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="error"
              sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#c62828' } }}
              onClick={handleCancelLoan}
            >
              Cancel Loan
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default MyLoansPage;