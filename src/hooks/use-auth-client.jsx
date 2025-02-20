import React, { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { ADMIN_ADDRESSES } from '../constants';

// Your contract addresses
const swapContractAddress = 'YOUR_SWAP_CONTRACT_ADDRESS';
const ledgerContractAddress = 'YOUR_LEDGER_CONTRACT_ADDRESS';
const faucetContractAddress = 'YOUR_FAUCET_CONTRACT_ADDRESS';
const depositContractAddress = 'YOUR_DEPOSIT_CONTRACT_ADDRESS';
const aggregatorContractAddress = 'YOUR_AGGREGATOR_CONTRACT_ADDRESS';
const borrowContractAddress = 'YOUR_BORROW_CONTRACT_ADDRESS';

// Your contract ABIs
const swapABI = [ /* Your Swap Contract ABI */ ];
const ledgerABI = [ /* Your Ledger Contract ABI */ ];
const faucetABI = [ /* Your Faucet Contract ABI */ ];
const depositABI = [ /* Your Deposit Contract ABI */ ];
const aggregatorABI = [ /* Your Aggregator Contract ABI */ ];
const borrowABI = [ /* Your Borrow Contract ABI */ ];

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
    const swapContract = new ethers.Contract(swapContractAddress, swapABI, signerInstance);
    const ledgerContract = new ethers.Contract(ledgerContractAddress, ledgerABI, signerInstance);
    const faucetContract = new ethers.Contract(faucetContractAddress, faucetABI, signerInstance);
    const depositContract = new ethers.Contract(depositContractAddress, depositABI, signerInstance);
    const aggregatorContract = new ethers.Contract(aggregatorContractAddress, aggregatorABI, signerInstance);
    const borrowContract = new ethers.Contract(borrowContractAddress, borrowABI, signerInstance);

    setContracts({
      swapActor: swapContract,
      ledgerActor: ledgerContract,
      faucetActor: faucetContract,
      depositActor: depositContract,
      aggregatorActor: aggregatorContract,
      borrowActor: borrowContract,
    });
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

  return {
    isAuthenticated,
    login,
    logout,
    isAdmin,
    provider,
    signer,
    account,
    contracts,
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