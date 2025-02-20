import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Typography, Box } from '@mui/material';
import { useAuth } from '../../hooks/use-auth-client';
import { BigNumber } from 'ethers';

const AdminDashboardPage = () => {
  const { getPendingCollaterals, updateCollateralStatus, contracts } = useAuth();
  const [collateralRequests, setCollateralRequests] = useState([]);

  useEffect(() => {
    if (contracts.loan) {
      const fetchCollaterals = async () => {
        try {
          const collaterals = await getPendingCollaterals();
          const formattedCollaterals = collaterals.map((collateral, index) => ({
                  id: index + 1,
                  owner: collateral[0],
                  stockName: collateral[1],
                  quantity: BigNumber.from(collateral[2]).toNumber(),
                  status: collateral[3] === 0 
                  ? "Pending" 
                  : collateral[3] === 1 
                  ? "Approved" 
                  : collateral[3] === 2 
                  ? "Declined" 
                  : "Cancelled",    
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
    try {
      await updateCollateralStatus(id, 1);
      setCollateralRequests(
        collateralRequests.map((request) =>
          request.id === id ? { ...request, status: 'Approved' } : request
        )
      );
    } catch (error) {
      console.error('Error approving collateral:', error);
    }
  };

  const handleDecline = async (id) => {
    try {
      await updateCollateralStatus(id, 2);
      setCollateralRequests(
        collateralRequests.map((request) =>
          request.id === id ? { ...request, status: 'Declined' } : request
        )
      );
    } catch (error) {
      console.error('Error declining collateral:', error);
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
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleDecline(request.id)}
                        >
                          Decline
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
