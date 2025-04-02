import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import loanABI from '../constants/loan_abi.json'
import loanNFTABI from '../constants/loan_nft_abi.json'
import loanNFTMarketplaceABI from '../constants/loan_nft_marketplace_abi.json'
import tokenABI from '../constants/token_abi.json'
import pythABI from '../constants/pyth_abi.json'
import { toast } from 'react-toastify';
import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';
import { bytes32ToString, calculateLTV, convertPythPriceToUint, stringToBytes32 } from '../utils';

const loanContractAddress = '0xc1289147102DDF694A36E6003FB6cB95B2dEf2E8';
const tokenContractAddress = '0x69dF8a0E5B51A0122f1e7A34Ce762FB38e354Bfe';
const loanNFTContractAddress = '0x34F6137c22b2Bf375831571f7a62E2eE901F3C73';
const loanNFTMarketplaceContractAddress = '0x0bACAB4eeD99022E2dbfff9CA01028a67D3DA432';
const pythContractAddress = '0x5744Cbf430D99456a0A8771208b674F27f8EF0Fb';

const AuthContext = createContext();

export const useAuthClient = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [provider, setProvider] = useState(null);
  const [wcProvider, setWcProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contracts, setContracts] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize contracts
  const initializeContracts = (signerInstance) => {
    const loanContract = new ethers.Contract(loanContractAddress, loanABI, signerInstance);
    const tokenContract = new ethers.Contract(tokenContractAddress, tokenABI, signerInstance);
    const loanNFTContract = new ethers.Contract(loanNFTContractAddress, loanNFTABI, signerInstance);
    const loanNFTMarketplaceContract = new ethers.Contract(loanNFTMarketplaceContractAddress, loanNFTMarketplaceABI, signerInstance);
    const pythContract = new ethers.Contract(pythContractAddress, pythABI, signerInstance);
    setContracts({ loan: loanContract, token: tokenContract, loanNFT: loanNFTContract,  loanNFTMarketplace: loanNFTMarketplaceContract, pyth: pythContract });
  };

  // Create WalletConnect provider
  const createWalletConnectProvider = async () => {
    try {
      const wcProvider = await EthereumProvider.init({
        projectId: '792166f5ed272a918f47747caef9b147',
        chains: [97],
        optionalChains: [56, 97],
        showQrModal: true,
        methods: ['eth_sendTransaction', 'personal_sign'],
        events: ['chainChanged', 'accountsChanged'],
        metadata: {
          name: 'Your App Name',
          description: 'Your app description',
          url: window.location.host,
          icons: ['https://yourwebsite.com/logo.png']
        }
      });
      
      setWcProvider(wcProvider);
      return wcProvider;
    } catch (error) {
      console.error('Failed to create WalletConnect provider:', error);
      return null;
    }
  };

  // Handle account connection
  const handleAccountConnection = async (accounts) => {
    if (accounts && accounts.length > 0) {
      const userAddress = accounts[0];
      setAccount(userAddress);
      setIsAuthenticated(true);
      setIsAdmin(checkIfAdmin(userAddress));
    } else {
      setAccount(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
  };

  // Check if MetaMask is available
  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Check network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (parseInt(chainId, 16) !== 97) {
          // Ask user to switch to BSC Testnet
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x61' }], // 0x61 is 97 in hex
            });
          } catch (switchError) {
            // This error code indicates the chain hasn't been added to MetaMask
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x61',
                  chainName: 'BSC Testnet',
                  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                  rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                  blockExplorerUrls: ['https://testnet.bscscan.com']
                }]
              });
            }
          }
        }
        
        // Setup provider
        const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
        const signerInstance = ethersProvider.getSigner();
        
        setProvider(ethersProvider);
        setSigner(signerInstance);
        await handleAccountConnection(accounts);
        initializeContracts(signerInstance);
        
        // Setup event listeners
        window.ethereum.on('accountsChanged', handleAccountConnection);
        window.ethereum.on('chainChanged', () => window.location.reload());
        
        return true;
      } catch (error) {
        console.error('MetaMask connection failed:', error);
        return false;
      }
    } else {
      console.log('MetaMask not detected');
      return false;
    }
  };

  // Login function - Connect wallet
  const login = async () => {
    const metaMaskConnected = await connectMetaMask();

    if (!metaMaskConnected) {
      try {
        let wcProviderInstance = wcProvider;
        
        if (!wcProviderInstance) {
          wcProviderInstance = await createWalletConnectProvider();
          if (!wcProviderInstance) return;
        }
        
        // Connect and display the modal
        const accounts = await wcProviderInstance.enable();

        const chainId = await wcProviderInstance.request({ method: 'eth_chainId' });
        if (parseInt(chainId, 16) !== 97) {
          console.error('Please switch to BSC Testnet (Chain ID: 97)');
          alert('Please switch your network to BSC Testnet.');
          return;
        }
        
        // Set up ethers provider with WalletConnect
        const ethersProvider = new ethers.providers.Web3Provider(wcProviderInstance);
        const signerInstance = ethersProvider.getSigner();
        
        setProvider(ethersProvider);
        setSigner(signerInstance);
        await handleAccountConnection(accounts);
        initializeContracts(signerInstance);
        
        // Set up event listeners
        wcProviderInstance.on('accountsChanged', (accounts) => {
          handleAccountConnection(accounts);
        });
        
        wcProviderInstance.on('chainChanged', async (chainId) => {
          console.log('Chain changed to:', chainId);
          if (parseInt(chainId, 16) !== 97) {
            alert('Please switch to BSC Testnet.');
            return;
          }
          // Refresh provider
          const refreshedProvider = new ethers.providers.Web3Provider(wcProviderInstance);
          setProvider(refreshedProvider);
          setSigner(refreshedProvider.getSigner());
          initializeContracts(refreshedProvider.getSigner());
        });
        
        wcProviderInstance.on('disconnect', () => {
          setIsAuthenticated(false);
          setAccount(null);
          setSigner(null);
          setProvider(null);
          setContracts({});
        });
      } catch (error) {
        console.error('WalletConnect login failed:', error);
      }
    }
  };

  // Logout function
  const logout = async () => {
    if (wcProvider) {
      try {
        await wcProvider.disconnect();
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
    
    setIsAuthenticated(false);
    setAccount(null);
    setSigner(null);
    setProvider(null);
    setContracts({});
  };

  // Check if user is admin
  const checkIfAdmin = async (userAddress) => {
    if (!userAddress) return false;
    if (!contracts.loan) return false;
    
    try {
      const admins = await getAdmins();
      if (!admins || !Array.isArray(admins)) return false;

      const normalizedUserAddress = userAddress.toLowerCase();
      const normalizedAdminAddresses = admins.map((addr) => addr.toLowerCase());

      return normalizedAdminAddresses.includes(normalizedUserAddress);
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  // Loan contract functions
  const addCollateral = async (stockName, quantity, requestedAmount, duration, priceUpdate) => {
    const fee = await contracts.pyth.getUpdateFee(priceUpdate);

    const stockNameBytes32 = stringToBytes32(stockName);
    const tx = await contracts.loan.addCollateral(
      stockNameBytes32, 
      quantity, 
      requestedAmount, 
      duration,
      priceUpdate,
      { value: fee }
    );
    
    await tx.wait();
    return tx.hash;
  };

  const updateCollateralStatus = async (collateralId, status) => {
    const tx = await contracts.loan.updateCollateralStatus(collateralId, status);
    await tx.wait();
  };

  const lockCollateral = async (collateralId) => {
    const tx = await contracts.loan.lockCollateral(collateralId);
    await tx.wait();
  };

  const unlockCollateral = async (collateralId) => {
    const tx = await contracts.loan.unlockCollateral(collateralId);
    await tx.wait();
  };

  const placeBid = async (auctionId, interestRate) => {
    const tx = await contracts.loan.placeBid(auctionId, interestRate);
    await tx.wait();
  };

  const closeAuction = async (auctionId) => {
    const tx = await contracts.loan.closeAuction(auctionId);
    await tx.wait();
  };

  const acceptLoan = async (loanId) => {
    const tx = await contracts.loan.acceptLoan(loanId);
    await tx.wait();
  };

  const declineLoan = async (loanId) => {
    try {
      const tx = await contracts.loan.declineLoan(loanId);
      await tx.wait();
      console.log("Loan declined successfully", tx);
    } catch (error) {
      console.error("Error declining loan:", error);
    }
  };

  const makePayment = async (loanId, paymentType, months) => {
    const tx = await contracts.loan.makePayment(loanId, paymentType, months);
    await tx.wait();
  };

  const markLoanDefaulted = async (loanId) => {
    const tx = await contracts.loan.markLoanDefaulted(loanId);
    await tx.wait();
  };

  const addAdmin = async (newAdmin) => {
    try {
      const tx = await contracts.loan.addAdmin(newAdmin);
      await tx.wait();
      console.log("Admin added successfully", tx);
    } catch (error) {
      console.error("Error adding admin:", error);
    }
  };

  const removeAdmin = async (adminToRemove) => {
    try {
      const tx = await contracts.loan.removeAdmin(adminToRemove);
      await tx.wait();
      console.log("Admin removed successfully", tx);
    } catch (error) {
      console.error("Error removing admin:", error);
    }
  };

  const addCollateralType = async (symbol, priceFeedId) => {
    const symbolBytes32 = stringToBytes32(symbol);
    const tx = await contracts.loan.addCollateralType(symbolBytes32, priceFeedId);
    await tx.wait();
  };

  const updateCollateralTypeStatus = async (symbol, isActive) => {
    const tx = await contracts.loan.updateCollateralTypeStatus(symbol, isActive);
    await tx.wait();
  };

  const updateCollateralTypePriceFeed = async (symbol, newPriceFeedId) => {
    if (!contracts.loan) return;
    const tx = await contracts.loan.updateCollateralTypePriceFeed(symbol, newPriceFeedId);
    await tx.wait();
  };

  // View functions
  const getAdmins = async () => {
    try {
      if (!contracts.loan) return [];
      const admins = await contracts.loan.getAdmins();
      return admins;
    } catch (error) {
      console.error("Error fetching admins:", error);
      return [];
    }
  };

  const getUserCollaterals = async (userAddress) => {
    try {
      const allCollaterals = await contracts.loan.getCollaterals(userAddress, 0, true);

      return await Promise.all(allCollaterals.map(async collateral => {
        const price = await getStockPrice(collateral.stockName);
        const ltvInfo = calculateLTV(collateral, price);
        return {
          ...collateral,
          ...ltvInfo
        };
      }));
    } catch (error) {
      console.error("Error fetching user collaterals:", error);
      return [];
    }
  };
  
  const getPendingCollaterals = async () => {
    try {
      const collaterals = await contracts.loan.getCollaterals(ethers.constants.AddressZero, 0, false);
      return await Promise.all(collaterals.map(async collateral => {
        const price = await getStockPrice(collateral.stockName);
        const ltvInfo = calculateLTV(collateral, price);
        return {
          ...collateral,
          ...ltvInfo
        };
      }));
    } catch (error) {
      console.error("Error fetching pending collaterals:", error);
      return [];
    }
  };
  
  const getAcceptedCollaterals = async () => {
    try {
      const collaterals = await contracts.loan.getCollaterals(ethers.constants.AddressZero, 1, false);
      return await Promise.all(collaterals.map(async collateral => {
        const price = await getStockPrice(collateral.stockName);
        const ltvInfo = calculateLTV(collateral, price);
        return {
          ...collateral,
          ...ltvInfo
        };
      }));
    } catch (error) {
      console.error("Error fetching accepted collaterals:", error);
      return [];
    }
  };  
  
  const getOpenAuctions = async () => {
    try {
      const [auctions, collaterals] = await contracts.loan.getAuctions(ethers.constants.AddressZero, 0, false);
      return await Promise.all(auctions.map(async (auction, index) => {
        const price = await getStockPrice(collaterals[index].stockName);
        const ltvInfo = calculateLTV(collaterals[index], price);
        return {
          ...auction,
          collateral: {
            ...collaterals[index],
            ...ltvInfo
          }
        };
      }));
    } catch (error) {
      console.error("Error fetching open auctions:", error);
      return [];
    }
  };
  
  const getBorrowerAuctions = async (borrowerAddress) => {
    try {
      const [auctions, collaterals] = await contracts.loan.getAuctions(borrowerAddress, 0, false);
      return await Promise.all(auctions.map(async (auction, index) => {
        const price = await getStockPrice(collaterals[index].stockName);
        const ltvInfo = calculateLTV(collaterals[index], price);
        return {
          ...auction,
          collateral: {
            ...collaterals[index],
            ...ltvInfo
          }
        };
      }));
    } catch (error) {
      console.error("Error fetching borrower auctions:", error);
      return [];
    }
  };
  
  const getAuctionBids = async (auctionId) => {
    try {
      const bids = await contracts.loan.getBidsForAuction(auctionId);

      return bids.map(bid => ({
        auctionId: bid.auctionId,
        lender: bid.lender,
        interestRate: bid.interestRate.toString(),
        timestamp: bid.timestamp
      }));
    } catch (error) {
      console.error("Error fetching auction bids:", error);
      return [];
    }
  };
  
  const getAuctionWithCollateralDetails = async (auctionId) => {
    try {
      const auction = await contracts.loan.auctions(auctionId);
      const collateral = await contracts.loan.collaterals(auction.collateralId);
      const price = await getStockPrice(collateral.stockName);
      const ltvInfo = calculateLTV(collateral, price);
      
      return {
        auction: {
          ...auction,
          collateralValue: ltvInfo.currentValue,
          maxLoanAmount: ltvInfo.maxLoanAmount,
          ltvRatio: ltvInfo.ltvRatio,
          lastUpdateTime: ltvInfo.lastUpdateTime
        },
        collateral: {
          ...collateral,
          ...ltvInfo
        }
      };
    } catch (error) {
      console.error("Error fetching auction details:", error);
      return {};
    }
  };
  
  const getLoansForUserCollaterals = async (userAddress) => {
    try {
      const [borrowerLoans, borrowerCollaterals] = await contracts.loan.getLoans(userAddress, 0, false, true);
    
      const [lenderLoans, lenderCollaterals] = await contracts.loan.getLoans(userAddress, 0, false, false);
      
      const processedBorrowerLoans = await Promise.all(
        borrowerLoans.map(async (loan, index) => {
          const price = await getStockPrice(borrowerCollaterals[index].stockName);
          const ltvInfo = calculateLTV(borrowerCollaterals[index], price);
          return {
            ...loan,
            loanType: "Borrower",
            collateral: {
              ...borrowerCollaterals[index],
              ...ltvInfo
            }
          };
        })
      );
      
      const processedLenderLoans = await Promise.all(
        lenderLoans.map(async (loan, index) => {
          const price = await getStockPrice(lenderCollaterals[index].stockName);
          const ltvInfo = calculateLTV(lenderCollaterals[index], price);
          return {
            ...loan,
            loanType: "Lender",
            collateral: {
              ...lenderCollaterals[index],
              ...ltvInfo
            }
          };
        })
      );
      
      return [...processedBorrowerLoans, ...processedLenderLoans];
    } catch (error) {
      console.error("Error fetching loans for user collaterals:", error);
      return [];
    }
  };
  
  const getActiveLoansForUser = async (userAddress) => {
    try {
      const [loans, collaterals] = await contracts.loan.getLoans(userAddress, 0, false, false);
      return await Promise.all(loans.map(async (loan, index) => {
        const price = await getStockPrice(collaterals[index].stockName);
        const ltvInfo = calculateLTV(collaterals[index], price);
        return {
          ...loan,
          collateral: {
            ...collaterals[index],
            ...ltvInfo
          }
        };
      }));
    } catch (error) {
      console.error("Error fetching active loans:", error);
      return [];
    }
  };
  
  const getLoansByStatus = async (status) => {
    try {
      const [loans, collaterals] = await contracts.loan.getLoans(ethers.constants.AddressZero, status, false, false);
      return await Promise.all(loans.map(async (loan, index) => {
        const price = await getStockPrice(collaterals[index].stockName);
        const ltvInfo = calculateLTV(collaterals[index], price);
        return {
          ...loan,
          collateral: {
            ...collaterals[index],
            ...ltvInfo
          }
        };
      }));
    } catch (error) {
      console.error("Error fetching loans by status:", error);
      return [];
    }
  };
  
  const getBorrowerLoanHistory = async (borrowerAddress) => {
    try {
      const [loans, collaterals] = await contracts.loan.getLoans(borrowerAddress, 0, true, true);
      return await Promise.all(loans.map(async (loan, index) => {
        const price = await getStockPrice(collaterals[index].stockName);
        const ltvInfo = calculateLTV(collaterals[index], price);
        return {
          ...loan,
          collateral: {
            ...collaterals[index],
            ...ltvInfo
          }
        };
      }));
    } catch (error) {
      console.error("Error fetching borrower loan history:", error);
      return [];
    }
  };
  
  const getLoanStatus = async (loanId) => {
    try {
      const loan = await contracts.loan.loans(loanId);
      const collateral = await contracts.loan.collaterals(loan.collateralId);
      const price = await getStockPrice(collateral.stockName);
      const ltvInfo = calculateLTV(collateral, price);
      
      return {
        ...loan,
        collateral: {
          ...collateral,
          ...ltvInfo
        }
      };
    } catch (error) {
      console.error("Error fetching loan status:", error);
      return {};
    }
  };
  
  const getCollateralDetails = async (collateralId) => {
    try {
      const result = await contracts.loan.getCollateralDetails(collateralId);
      
      return {
        currentValue: result[0],
        maxLoanAmount: result[1],
        ltvRatio: result[2],
        lastUpdateTime: result[3]
      };
    } catch (error) {
      console.error("Error getting collateral details:", error);
      throw error;
    }
  };
  
  const checkLTV = async (collateralId) => {
    try {
      const result = await contracts.loan.getCollateralDetails(collateralId);
      
      return {
        currentValue: result[0],
        maxLoanAmount: result[1],
        ltvRatio: result[2],
        lastUpdateTime: result[3]
      };
    } catch (error) {
      console.error("Error checking LTV:", error);
      return {
        currentValue: 0,
        maxLoanAmount: 0,
        ltvRatio: 0,
        lastUpdateTime: 0
      };
    }
  };
  
  const getStockPrice = async (symbol) => {
    try {
      const type = await contracts.loan.collateralTypes(symbol);

      const price = await contracts.pyth.getPriceUnsafe(type.priceFeedId);
      return convertPythPriceToUint(price);
    } catch (error) {
      console.error("Error getting stock price:", error);
      throw error;
    }
  };
  
  const getCollateralTypes = async () => {
    try {
      const types = await contracts.loan.getAllCollateralTypes();
      return types.map((type, i) => ({
        symbol: bytes32ToString(type.symbol || ''),
        priceFeedId: type.priceFeedId,
        isActive: type.isActive
      }));
    } catch (error) {
      console.error("Error fetching all collateral types:", error);
      return [];
    }
  };

  const fetchPythPriceUpdate = async (priceFeedId) => {
    try {
      const connectionEVM = new EvmPriceServiceConnection(
        'https://hermes.pyth.network',
      );

      const priceUpdateData = await connectionEVM.getPriceFeedsUpdateData([priceFeedId]);
      return priceUpdateData;
    } catch (error) {
      console.error("Error fetching Pyth price update:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum !== undefined) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          toast.error('No accounts connected to the site');
        } else {
          setAccount(accounts[0]);
          toast.success(`Connected to account: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
        }
      };

      const handleChainChanged = (newChainId) => {
        const parsedChainId = parseInt(newChainId, 16);
        // setChainId(parsedChainId);
        toast.info(`Network Changed to Chain Id: ${parsedChainId}`, { toastId: 'changeChainId' });
      };

      const handleDisconnect = (error) => {
        console.log("Disconnect event:", error);
        setAccount(null);
        setIsAuthenticated(false);
        toast.error('Wallet disconnected');
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      };
    } else {
      toast.error('Metamask is not installed', { toastId: 'metamask-missing' });
    }
  }, []);

  return {
    isAuthenticated,
    login,
    logout,
    isAdmin,
    provider,
    signer,
    account,
    contracts,
    addCollateral,
    placeBid,
    closeAuction,
    updateCollateralStatus,
    lockCollateral,
    unlockCollateral,
    acceptLoan,
    declineLoan,
    makePayment,
    markLoanDefaulted,
    addAdmin,
    removeAdmin,
    addCollateralType,
    updateCollateralTypeStatus,
    updateCollateralTypePriceFeed,
    getAdmins,
    getUserCollaterals,
    getPendingCollaterals,
    getAcceptedCollaterals,
    getLoansForUserCollaterals,
    getActiveLoansForUser,
    getOpenAuctions,
    getBorrowerAuctions,
    getAuctionBids,
    getAuctionWithCollateralDetails,
    getLoansByStatus,
    getBorrowerLoanHistory,
    getLoanStatus,
    getCollateralDetails,
    getStockPrice,
    getCollateralTypes,
    fetchPythPriceUpdate,
    checkLTV
  };
};

export function AuthProvider({ children }) {
  const auth = useAuthClient();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);