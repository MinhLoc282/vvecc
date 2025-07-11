import { useState, useEffect } from 'react';
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
import { useAuth } from '../../hooks/use-auth-client';
import { BigNumber } from 'ethers';
import { toast } from 'react-toastify';

const MyCollateralPage = () => {
  const { getUserCollaterals, addCollateral, updateCollateralStatus, account } = useAuth();
  const [collaterals, setCollaterals] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [stockName, setStockName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCollaterals = async () => {
    try {
      setLoading(true);
      const userCollaterals = await getUserCollaterals(account);

      const formattedCollaterals = userCollaterals.map((collateral) => ({
        id: BigNumber.from(collateral.collateralId).toNumber(),
        owner: collateral.owner,
        stockName: collateral.stockName,
        quantity: BigNumber.from(collateral.quantity).toNumber(),
        status: collateral.status === 0 
            ? "Pending" 
            : collateral.status === 1 
            ? "Approved" 
            : collateral.status === 2 
            ? "Declined" 
            : "Cancelled",
        acceptedLoanId: BigNumber.from(collateral.acceptedLoanId).toNumber(),
      }))
    setCollaterals(formattedCollaterals);
    } catch (error) {
      console.error("Error fetching collaterals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollateral = async () => {
    if (!stockName || !quantity) return;

    try {
      setLoading(true);
      await addCollateral(stockName, parseInt(quantity, 10));
      fetchCollaterals();
      handleCloseModal();
      toast.success("Added collaterals successfully!")
    } catch (error) {
      console.error("Error adding collateral:", error);
      toast.error('Failed to add collateral.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (collateralId) => {
    try {
      setLoading(true);
      await updateCollateralStatus(collateralId, 3);
      fetchCollaterals();
      toast.success("Cancel collaterals successfully!")
    } catch (error) {
      console.error("Error cancelling collateral:", error);
      toast.error('Failed to cancel collateral.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setStockName('');
    setQuantity('');
  };

  useEffect(() => {
    if (account) fetchCollaterals();
  }, [account]);

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
            {collaterals?.length > 0 ? (
              collaterals.map((collateral) => (
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
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: 'center', color: 'gray' }}>
                  No collaterals found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Collateral Modal */}
      <Modal open={openModal} onClose={handleCloseModal}>
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
              disabled={!stockName || !quantity || loading}
            >
              {loading ? 'Adding...' : 'Add'}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default MyCollateralPage;
