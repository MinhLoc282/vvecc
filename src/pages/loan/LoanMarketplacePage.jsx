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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

const LoanMarketplacePage = () => {
  // Mock data for accepted collaterals (replace with real data from your backend)
  const [acceptedCollaterals, setAcceptedCollaterals] = useState([
    { id: 1, stockName: 'AAPL', quantity: 10, owner: '0x123...' },
    { id: 2, stockName: 'GOOGL', quantity: 5, owner: '0x456...' },
    { id: 3, stockName: 'TSLA', quantity: 8, owner: '0x789...' },
  ]);

  const [openModal, setOpenModal] = useState(false); // State to control modal visibility
  const [selectedCollateral, setSelectedCollateral] = useState(null); // Selected collateral for loan request
  const [interestRate, setInterestRate] = useState(0.1); // Interest rate (0.1% to 40%)
  const [loanAmount, setLoanAmount] = useState(0); // Loan amount (cannot exceed collateral value)
  const [duration, setDuration] = useState(6); // Duration in months
  const [interestRateError, setInterestRateError] = useState(''); // Error message for interest rate

  // Handle open modal for loan request
  const handleOpenModal = (collateral) => {
    setSelectedCollateral(collateral);
    setOpenModal(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedCollateral(null);
    setInterestRate(0.1);
    setLoanAmount(0);
    setDuration(6);
    setInterestRateError('');
  };

  // Validate interest rate
  const validateInterestRate = (value) => {
    if (value < 0.1 || value > 40) {
      setInterestRateError('Interest rate must be between 0.1% and 40%.');
      return false;
    } else {
      setInterestRateError('');
      return true;
    }
  };

  // Handle interest rate change
  const handleInterestRateChange = (e) => {
    const value = parseFloat(e.target.value);
    setInterestRate(value);
    validateInterestRate(value);
  };

  // Handle submit loan request
  const handleSubmitLoanRequest = () => {
    if (
      selectedCollateral &&
      loanAmount > 0 &&
      loanAmount <= selectedCollateral.quantity &&
      validateInterestRate(interestRate)
    ) {
      console.log('Loan Request Submitted:', {
        collateral: selectedCollateral,
        interestRate,
        loanAmount,
        duration,
      });
      handleCloseModal();
    }
  };

  return (
    <Box sx={{ padding: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" color="primary" sx={{ color: 'rgb(0, 50, 99)', marginBottom: 3 }}>
        Loan Marketplace
      </Typography>

      <TableContainer component={Paper} sx={{ backgroundColor: 'white' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Stock Name</TableCell>
              <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Quantity</TableCell>
              <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Owner</TableCell>
              <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {acceptedCollaterals.map((collateral) => (
              <TableRow key={collateral.id}>
                <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{collateral.stockName}</TableCell>
                <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{collateral.quantity}</TableCell>
                <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{collateral.owner}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    sx={{
                      color: '#236cb2',
                      borderColor: '#236cb2',
                      '&:hover': { borderColor: '#1a4f8a' },
                    }}
                    onClick={() => handleOpenModal(collateral)}
                  >
                    Request Loan
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Loan Request Modal */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="loan-request-modal"
        aria-describedby="loan-request-form"
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
              <MenuItem value={24}>1 Year</MenuItem>
              <MenuItem value={36}>1.5 Years</MenuItem>
              <MenuItem value={48}>2 Years</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              sx={{ color: '#236cb2', borderColor: '#236cb2' }}
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{ backgroundColor: '#236cb2', '&:hover': { backgroundColor: '#1a4f8a' } }}
              onClick={handleSubmitLoanRequest}
              disabled={!!interestRateError || loanAmount <= 0 || loanAmount > selectedCollateral?.quantity}
            >
              Submit
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default LoanMarketplacePage;