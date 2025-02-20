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
} from '@mui/material';

const AdminDashboardPage = () => {
  const [collateralRequests, setCollateralRequests] = useState([
    { id: 1, stockName: 'AAPL', quantity: 10, owner: '0x123...', status: 'Pending' },
    { id: 2, stockName: 'GOOGL', quantity: 5, owner: '0x456...', status: 'Pending' },
    { id: 3, stockName: 'TSLA', quantity: 8, owner: '0x789...', status: 'Pending' },
  ]);

  // Handle approving collateral
  const handleApprove = (id) => {
    setCollateralRequests(
      collateralRequests.map((request) =>
        request.id === id ? { ...request, status: 'Approved' } : request
      )
    );
  };

  // Handle declining collateral
  const handleDecline = (id) => {
    setCollateralRequests(
      collateralRequests.map((request) =>
        request.id === id ? { ...request, status: 'Declined' } : request
      )
    );
  };

  return (
    <Box sx={{ padding: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" color="primary" sx={{ color: 'rgb(0, 50, 99)', marginBottom: 3 }}>
        Admin Dashboard
      </Typography>

      <TableContainer component={Paper} sx={{ backgroundColor: 'white' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Stock Name</TableCell>
              <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Quantity</TableCell>
              <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Owner</TableCell>
              <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'rgb(0, 50, 99)', fontWeight: 'bold' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {collateralRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{request.stockName}</TableCell>
                <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{request.quantity}</TableCell>
                <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{request.owner}</TableCell>
                <TableCell sx={{ color: 'rgb(133, 134, 151)' }}>{request.status}</TableCell>
                <TableCell>
                  {request.status === 'Pending' && (
                    <>
                      <Button
                        variant="contained"
                        sx={{ backgroundColor: '#236cb2', '&:hover': { backgroundColor: '#1a4f8a' }, marginRight: 1 }}
                        onClick={() => handleApprove(request.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        sx={{ color: '#d32f2f', borderColor: '#d32f2f', '&:hover': { borderColor: '#9a0007' } }}
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
    </Box>
  );
};

export default AdminDashboardPage;
