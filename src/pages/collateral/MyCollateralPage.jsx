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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const MyCollateralPage = () => {
  const [collaterals, setCollaterals] = useState([
    { id: 1, stockName: 'AAPL', quantity: 10, status: 'Pending' },
    { id: 2, stockName: 'GOOGL', quantity: 5, status: 'Approved' },
    { id: 3, stockName: 'TSLA', quantity: 8, status: 'Declined' },
  ]);

  const [openModal, setOpenModal] = useState(false); // State to control modal visibility
  const [stockName, setStockName] = useState('');
  const [quantity, setQuantity] = useState('');

  // Handle cancel collateral
  const handleCancel = (id) => {
    setCollaterals(collaterals.filter((collateral) => collateral.id !== id));
  };

  // Handle open modal
  const handleOpenModal = () => {
    setOpenModal(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setOpenModal(false);
    setStockName('');
    setQuantity('');
  };

  // Handle add collateral
  const handleAddCollateral = () => {
    if (stockName && quantity) {
      const newCollateral = {
        id: collaterals.length + 1, // Generate a unique ID (replace with a better method in production)
        stockName,
        quantity: parseInt(quantity, 10),
        status: 'Pending',
      };
      setCollaterals([...collaterals, newCollateral]);
      handleCloseModal();
    }
  };

  return (
    <Box sx={{ padding: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 3,
        }}
      >
        <Typography variant="h4" color="primary" sx={{ color: 'rgb(0, 50, 99)' }}>
          My Collateral
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ backgroundColor: '#236cb2', '&:hover': { backgroundColor: '#1a4f8a' } }}
          onClick={handleOpenModal}
        >
          Add Collateral
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ backgroundColor: 'white' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Stock Name</TableCell>
              <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Quantity</TableCell>
              <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {collaterals.map((collateral) => (
              <TableRow key={collateral.id}>
                <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{collateral.stockName}</TableCell>
                <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{collateral.quantity}</TableCell>
                <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{collateral.status}</TableCell>
                <TableCell>
                  {collateral.status === 'Pending' && (
                    <Button
                      variant="outlined"
                      sx={{
                        color: '#236cb2',
                        borderColor: '#236cb2',
                        '&:hover': { borderColor: '#1a4f8a' },
                      }}
                      onClick={() => handleCancel(collateral.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Collateral Modal */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="add-collateral-modal"
        aria-describedby="add-collateral-form"
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
            Add Collateral
          </Typography>
          <TextField
            label="Stock Name"
            value={stockName}
            onChange={(e) => setStockName(e.target.value)}
            fullWidth
            required
            sx={{ marginBottom: 2 }}
          />
          <TextField
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            fullWidth
            required
            sx={{ marginBottom: 2 }}
          />
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
              onClick={handleAddCollateral}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default MyCollateralPage;