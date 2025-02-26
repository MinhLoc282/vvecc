import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Typography, Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../hooks/use-auth-client';
import { BigNumber } from 'ethers';
import { toast } from 'react-toastify';

const AdminDashboardPage = () => {
  const { getPendingCollaterals, updateCollateralStatus, contracts } = useAuth();
  const [collateralRequests, setCollateralRequests] = useState([]);
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [loadingDecline, setLoadingDecline] = useState(false);

  useEffect(() => {
    if (contracts.loan) {
      const fetchCollaterals = async () => {
        try {
          const collaterals = await getPendingCollaterals();
          const formattedCollaterals = collaterals.map((collateral) => ({
            id: BigNumber.from(collateral[0]).toNumber(),
            owner: collateral[1],
            stockName: collateral[2],
            quantity: BigNumber.from(collateral[3]).toNumber(),
            status: collateral[4] === 0 
                ? "Pending" 
                : collateral[4] === 1 
                ? "Approved" 
                : collateral[4] === 2 
                ? "Declined" 
                : "Cancelled",
            acceptedLoanId: BigNumber.from(collateral[5]).toNumber(),
          }));
          setCollateralRequests(formattedCollaterals);
        } catch (error) {
          console.error('Error fetching pending collaterals:', error);
        }
      };
  
      fetchCollaterals();
    }
    
  }, [getPendingCollaterals, contracts]);

  const handleApprove = async (id) => {
    setLoadingApprove(true);
    try {
      await updateCollateralStatus(id, 1);
      setCollateralRequests(
        collateralRequests.map((request) =>
          request.id === id ? { ...request, status: 'Approved' } : request
        )
      );
      toast.success('Collateral approved successfully!');
    } catch (error) {
      console.error('Error approving collateral:', error);
      toast.error('Failed to approve collateral.');
    } finally {
      setLoadingApprove(false);
    }
  };

  const handleDecline = async (id) => {
    setLoadingDecline(true);
    try {
      await updateCollateralStatus(id, 2);
      setCollateralRequests(
        collateralRequests.map((request) =>
          request.id === id ? { ...request, status: 'Declined' } : request
        )
      );
      toast.success('Collateral declined successfully!');
    } catch (error) {
      console.error('Error declining collateral:', error);
      toast.error('Failed to decline collateral.');
    } finally {
      setLoadingDecline(false);
    }
  };

  return (
    <Box sx={{ padding: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" color="primary" sx={{ color: 'rgb(0, 50, 99)', marginBottom: 3 }}>
        Admin Dashboard
      </Typography>

      {collateralRequests.length === 0 ? (
        <Typography variant="h6" color="textSecondary" sx={{ textAlign: 'center', marginTop: 3 }}>
          No pending collaterals
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ backgroundColor: 'white' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Stock Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Owner</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {collateralRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.stockName}</TableCell>
                  <TableCell>{request.quantity}</TableCell>
                  <TableCell>{request.status}</TableCell>
                  <TableCell>{request.owner}</TableCell>
                  <TableCell>
                    {request.status === 'Pending' && (
                      <>
                        <Button
                          variant="contained"
                          sx={{ marginRight: 1 }}
                          onClick={() => handleApprove(request.id)}
                          disabled={loadingApprove}
                        >
                          {loadingApprove ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Approve'}
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleDecline(request.id)}
                          disabled={loadingDecline}
                        >
                          {loadingDecline ? <CircularProgress size={24} sx={{ color: 'red' }} /> : 'Decline'}
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AdminDashboardPage;
