import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import loanABI from '../constants/loan_abi.json'
import loanNFTABI from '../constants/loan_nft_abi.json'
import loanNFTMarketplaceABI from '../constants/loan_nft_marketplace_abi.json'
import tokenABI from '../constants/token_abi.json'
import { toast } from 'react-toastify';
const loanContractAddress = '0x5752fE4884eEE4a92018D2EF4426BB817aEC05Be';
const tokenContractAddress = '0x69dF8a0E5B51A0122f1e7A34Ce762FB38e354Bfe';
const loanNFTContractAddress = '0x1D815241E20FcCFd55099F060E83767248934dd8';
const loanNFTMarketplaceContractAddress = '0xBE80b01728e51e0dA78f644918d05CB4BEb729Cf';

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
    setContracts({ loan: loanContract, token: tokenContract, loanNFT: loanNFTContract,  loanNFTMarketplace: loanNFTMarketplaceContract});
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
  const addCollateral = async (stockName, quantity) => {
    const tx = await contracts.loan
      .addCollateral(stockName, quantity);
    await tx.wait();
  };

  const updateCollateralStatus = async (collateralId, status) => {
    const tx = await contracts.loan
      .updateCollateralStatus(collateralId, status);
    await tx.wait();
  };

  const offerLoan = async (collateralId, interestRate, loanAmount, duration) => {
    const tx = await contracts.loan
      .offerLoan(collateralId, interestRate, loanAmount, duration);
    await tx.wait();
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
    const tx = await contracts.loan
      .cancelLoan(loanId);
    await tx.wait();
  };

  const payInterest = async (loanId) => {
    const tx = await contracts.loan.payInterest(loanId);
    await tx.wait();
  };
  
  const repayLoan = async (loanId) => {
    const tx = await contracts.loan.repayLoan(loanId);
    await tx.wait();
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
    updateCollateralStatus,
    offerLoan,
    acceptLoan,
    cancelLoan,
    payInterest,
    repayLoan,
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