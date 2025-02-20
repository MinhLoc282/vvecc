import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { ADMIN_ADDRESSES } from '../constants';
import loanABI from '../constants/loan_abi.json'
import tokenABI from '../constants/token_abi.json'
const loanContractAddress = '0xD713C94b6DbfBf885FF6C6c2185311a290C07649';
const tokenContractAddress = '0x69dF8a0E5B51A0122f1e7A34Ce762FB38e354Bfe';

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
    setContracts({ loan: loanContract, token: tokenContract });
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
  const checkIfAdmin = (userAddress) => {
    if (!userAddress) return false;
    const normalizedUserAddress = userAddress.toLowerCase();
    const normalizedAdminAddresses = ADMIN_ADDRESSES.map((addr) => addr.toLowerCase());
    return normalizedAdminAddresses.includes(normalizedUserAddress);
  };

  // Loan contract functions
  const addCollateral = async (stockName, quantity) => {
    try {
      const tx = await contracts.loan
        .addCollateral(stockName, quantity);
      await tx.wait();
      console.log("Collateral added successfully", tx);
    } catch (error) {
      console.error("Error adding collateral:", error);
    }
  };

  const updateCollateralStatus = async (collateralId, status) => {
    try {
      const tx = await contracts.loan
        .updateCollateralStatus(collateralId, status);
      await tx.wait();
      console.log("Collateral status updated successfully", tx);
    } catch (error) {
      console.error("Error updating collateral status:", error);
    }
  };

  const offerLoan = async (collateralId, interestRate, loanAmount, duration) => {
    try {
      const tx = await contracts.loan
        .offerLoan(collateralId, interestRate, loanAmount, duration);
      await tx.wait();
      console.log("Loan offered successfully", tx);
    } catch (error) {
      console.error("Error offering loan:", error);
    }
  };

  const acceptLoan = async (loanId) => {
    try {
      const tx = await contracts.loan
        .acceptLoan(loanId);
      await tx.wait();
      console.log("Loan accepted successfully", tx);
    } catch (error) {
      console.error("Error accepting loan:", error);
    }
  };

  const cancelLoan = async (loanId) => {
    try {
      const tx = await contracts.loan
        .cancelLoan(loanId);
      await tx.wait();
      console.log("Loan canceled successfully", tx);
    } catch (error) {
      console.error("Error canceling loan:", error);
    }
  };

  const addAdmin = async (newAdmin) => {
    try {
      const tx = await contracts.loan
        .addAdmin(newAdmin);
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
  

  const getAdmins = async () => {
    try {
      const admins = await contracts.loan.getAdmins();
      return admins;
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };  

  const getUserCollaterals = async (userAddress) => {
    try {
      return await contracts.loan.getUserCollaterals(userAddress);
    } catch (error) {
      console.error("Error fetching user collaterals:", error);
    }
  };

  const getPendingCollaterals = async () => {
    try {
      return await contracts.loan.getCollateralsByStatus(0);
    } catch (error) {
      console.error("Error fetching pending collaterals:", error);
    }
  };

  const getAcceptedCollaterals = async () => {
    try {
      return await contracts.loan.getCollateralsByStatus(1);
    } catch (error) {
      console.error("Error fetching pending collaterals:", error);
    }
  };

  const getLoansForUserCollaterals = async (userAddress) => {
    try {
      return await contracts.loan.getLoansForUserCollaterals(userAddress);
    } catch (error) {
      console.error("Error fetching offered loans:", error);
    }
  };

  const getActiveLoansForUser = async (userAddress) => {
    try {
      return await contracts.loan.getActiveLoansForUser(userAddress);
    } catch (error) {
      console.error("Error fetching active loans:", error);
    }
  };

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
    updateCollateralStatus,
    offerLoan,
    acceptLoan,
    cancelLoan,
    addAdmin,
    removeAdmin,
    getAdmins,
    getUserCollaterals,
    getPendingCollaterals,
    getAcceptedCollaterals,
    getLoansForUserCollaterals,
    getActiveLoansForUser,
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