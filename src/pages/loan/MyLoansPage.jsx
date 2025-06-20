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
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../hooks/use-auth-client';
import { BigNumber, ethers } from 'ethers';
import { toast } from 'react-toastify';

const MyLoansPage = () => {
  const { getLoansForUserCollaterals, getActiveLoansForUser, acceptLoan, cancelLoan, contracts, account } = useAuth();

  const [collateralOffers, setCollateralOffers] = useState([]);
  const [myActiveLoans, setMyActiveLoans] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState({});

  const fetchLoans = async () => {
    try {
      const offers = await getLoansForUserCollaterals(account);
      const activeLoans = await getActiveLoansForUser(account);

      setCollateralOffers(offers);
      setMyActiveLoans(activeLoans);
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  };

  useEffect(() => {
    if (contracts.loan) {
      fetchLoans();
    }
  }, [getLoansForUserCollaterals, getActiveLoansForUser, contracts, account]);

  const handleAcceptLoan = async (loanId) => {
    setLoadingAccept(true);
    try {
      await acceptLoan(loanId);
      fetchLoans();
      toast.success('Loan accepted successfully!');
    } catch (error) {
      console.error('Error accepting loan:', error);
      toast.error('Failed to accept loan.');
    } finally {
      setLoadingAccept(false);
    }
  };

  const handleCancelLoan = async (loanId) => {
    setLoadingCancel((prev) => ({ ...prev, [loanId]: true }));
    try {
      await cancelLoan(loanId);
      fetchLoans();
      toast.success('Loan canceled successfully!');
    } catch (error) {
      console.error('Error canceling loan:', error);
      toast.error('Failed to cancel loan.');
    } finally {
      setLoadingCancel((prev) => ({ ...prev, [loanId]: false }));
    }
  };

  const filteredCollateralOffers = collateralOffers?.filter(
    (offer) => offer.accepted || (offer.accepted === false && BigNumber.from(offer.acceptedLoanId).toNumber() === 0)
  );

  return (
    <Box sx={{ padding: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" color="primary" sx={{ marginBottom: 3 }}>
        My Loans
      </Typography>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
        <Tab label="Available Collateral Offers" />
        <Tab label="My Active Loans" />
      </Tabs>

      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Stock</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Lender</TableCell>
                <TableCell>Interest Rate</TableCell>
                <TableCell>Loan Amount</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCollateralOffers?.map((offer) => (
                <TableRow key={offer.loanId}>
                  <TableCell>{offer.stockName}</TableCell>
                  <TableCell>{offer.quantity?.toString()}</TableCell>
                  <TableCell>{offer.lender}</TableCell>
                  <TableCell>{((BigNumber.from(offer.interestRate).toNumber()) / 100).toString()}%</TableCell>
                  <TableCell>${ethers.utils?.formatUnits(offer.loanAmount, 18)}</TableCell>
                  <TableCell>{offer.duration?.toString()} months</TableCell>
                  <TableCell>
                    {!offer.accepted ? (
                      <Button onClick={() => handleAcceptLoan(offer.loanId)} disabled={loadingAccept}>
                        {loadingAccept ? <CircularProgress size={24} /> : 'Accept'}
                      </Button>
                    ) : (
                      <Button disabled>Accepted</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Stock</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Borrower</TableCell>
                <TableCell>Interest Rate</TableCell>
                <TableCell>Loan Amount</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myActiveLoans?.map((loan) => (
                <TableRow key={loan.loanId}>
                  <TableCell>{loan.stockName}</TableCell>
                  <TableCell>{loan.quantity?.toString()}</TableCell>
                  <TableCell>{loan.collateralOwner}</TableCell>
                  <TableCell>{((BigNumber.from(loan.interestRate).toNumber()) / 100).toString()}%</TableCell>
                  <TableCell>${ethers.utils?.formatUnits(loan.loanAmount, 18)}</TableCell>
                  <TableCell>{loan.duration?.toString()} months</TableCell>
                  <TableCell>
                    {!loan.accepted ? (
                      BigNumber.from(loan.acceptedLoanId).toNumber() !== 0 ? (
                        <Button color="error" onClick={() => handleCancelLoan(loan.loanId)} disabled={loadingCancel[loan.loanId]}>
                          {loadingCancel[loan.loanId] ? <CircularProgress size={24} /> : 'Reclaim'}
                        </Button>
                      ) : (
                        <Button color="error" onClick={() => handleCancelLoan(loan.loanId)} disabled={loadingCancel[loan.loanId]}>
                          {loadingCancel[loan.loanId] ? <CircularProgress size={24} /> : 'Cancel'}
                        </Button>
                      )
                    ) : (
                      <Button disabled>Accepted</Button>
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

export default MyLoansPage;
