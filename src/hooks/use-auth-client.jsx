import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { authService } from '../services/authService';
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
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Kiểm tra authentication status từ authService và tự động kết nối lại wallet
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    };
    
    checkAuth();
    // Kiểm tra định kỳ nếu token bị expire
    const interval = setInterval(checkAuth, 60000); // Kiểm tra mỗi phút
    
    return () => clearInterval(interval);
  }, []);

  // Auto-connect wallet on page load if user is authenticated
  useEffect(() => {
    const autoConnectWallet = async () => {
      // Don't auto-connect if user is disconnecting or already has account
      if (isAuthenticated && !account && !isDisconnecting) {
        console.log("🔄 Attempting to auto-connect wallet after page reload...");
        
        // Check if we have a saved wallet type
        const savedWalletType = localStorage.getItem('walletType');
        if (!savedWalletType) {
          console.log("❌ No saved wallet type found, skipping auto-connect");
          return;
        }
        
        // Additional check: Don't auto-connect if we just disconnected
        const lastDisconnectTime = localStorage.getItem('lastDisconnectTime');
        if (lastDisconnectTime) {
          const timeSinceDisconnect = Date.now() - parseInt(lastDisconnectTime);
          if (timeSinceDisconnect < 10000) { // 10 seconds
            console.log("❌ Recently disconnected, skipping auto-connect for", (10000 - timeSinceDisconnect) / 1000, "more seconds");
            return;
          } else {
            // Remove old disconnect timestamp
            localStorage.removeItem('lastDisconnectTime');
          }
        }
        
        // Try MetaMask first if it was the saved type
        if (savedWalletType === 'metamask' && window.ethereum) {
          try {
            // Check if already connected to MetaMask
            const accounts = await window.ethereum.request({ 
              method: 'eth_accounts' 
            });
            
            if (accounts.length > 0) {
              console.log("✅ Found existing MetaMask connection, restoring...");
              const chainId = await window.ethereum.request({ method: 'eth_chainId' });
              
              if (parseInt(chainId, 16) === 97) {
                const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
                const signerInstance = ethersProvider.getSigner();
                
                setProvider(ethersProvider);
                setSigner(signerInstance);
                await handleAccountConnection(accounts);
                initializeContracts(signerInstance);
                
                console.log("✅ MetaMask auto-connection successful");
                return;
              }
            } else {
              console.log("❌ MetaMask has no connected accounts, clearing saved wallet type");
              localStorage.removeItem('walletType');
            }
          } catch (error) {
            console.log("❌ MetaMask auto-connect failed:", error);
            localStorage.removeItem('walletType');
          }
        }
        
        // Try WalletConnect if it was the saved type
        if (savedWalletType === 'walletconnect') {
          try {
            console.log("🔄 Attempting WalletConnect auto-reconnect...");
            
            let wcProviderInstance = wcProvider;
            if (!wcProviderInstance) {
              wcProviderInstance = await createWalletConnectProvider();
            }
            
            if (wcProviderInstance && wcProviderInstance.connected) {
              console.log("✅ Found existing WalletConnect session, restoring...");
              
              const ethersProvider = new ethers.providers.Web3Provider(wcProviderInstance);
              const signerInstance = ethersProvider.getSigner();
              
              setProvider(ethersProvider);
              setSigner(signerInstance);
              await handleAccountConnection(wcProviderInstance.accounts);
              initializeContracts(signerInstance);
              
              console.log("✅ WalletConnect auto-connection successful");
            } else {
              console.log("❌ WalletConnect session not found, clearing saved wallet type");
              localStorage.removeItem('walletType');
            }
          } catch (error) {
            console.log("❌ WalletConnect auto-connect failed:", error);
            localStorage.removeItem('walletType');
          }
        }
      }
    };

    // Delay auto-connect to ensure all components are initialized
    const timeoutId = setTimeout(autoConnectWallet, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, account, wcProvider, isDisconnecting]);

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

      // Listen for display_uri to detect when modal opens
      wcProvider.on('display_uri', (uri) => {
        console.log('WalletConnect modal opened');
        
        // Watch for modal close via DOM mutation
        setTimeout(() => {
          const checkForModal = () => {
            const modalSelectors = [
              'wcm-modal',
              'w3m-modal', 
              '[data-testid="w3m-modal"]',
              '[data-testid="wcm-modal"]'
            ];

            let modalElement = null;
            for (const selector of modalSelectors) {
              modalElement = document.querySelector(selector);
              if (modalElement) break;
            }

            if (modalElement) {
              // Create observer to watch for modal removal
              const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                  if (mutation.type === 'childList') {
                    mutation.removedNodes.forEach((node) => {
                      if (node.nodeType === Node.ELEMENT_NODE) {
                        const isModal = modalSelectors.some(selector => {
                          try {
                            return (node.matches && node.matches(selector)) || 
                                   (node.querySelector && node.querySelector(selector));
                          } catch (e) {
                            return false;
                          }
                        });
                        
                        if (isModal) {
                          observer.disconnect();
                        }
                      }
                    });
                  }
                });
              });

              observer.observe(document.body, {
                childList: true,
                subtree: true
              });

              // Store observer reference to clean up later
              wcProvider._modalObserver = observer;
            }
          };

          checkForModal();
        }, 100);
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
            
      // Note: Wallet connection to server is handled by Navbar component
      // to prevent duplicate API calls and provide proper user feedback
      
      // Check admin status asynchronously
      const adminStatus = await checkIfAdmin(userAddress);
      setIsAdmin(adminStatus);
    } else {
      setAccount(null);
      setIsAdmin(false);
      
      // Note: Wallet disconnection from server is handled by Navbar component
      // or explicit logout actions
    }
  };

  // Check if MetaMask is available
  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Save wallet type for auto-reconnect
        localStorage.setItem('walletType', 'metamask');
        
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
        
        // Note: Event listeners are setup in the global useEffect at the bottom
        // to avoid duplicate listeners and ensure proper handling
        
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
  const login = useCallback(async () => {
    const metaMaskConnected = await connectMetaMask();

    if (!metaMaskConnected) {
      try {
        let wcProviderInstance = wcProvider;
        
        if (!wcProviderInstance) {
          wcProviderInstance = await createWalletConnectProvider();
          if (!wcProviderInstance) return;
        }
        
        // Save wallet type for auto-reconnect
        localStorage.setItem('walletType', 'walletconnect');
        
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
          console.log("🔄 WalletConnect disconnected - performing full cleanup");
          
          // Mark disconnect time
          localStorage.setItem('lastDisconnectTime', Date.now().toString());
          
          // Full cleanup
          setAccount(null);
          setSigner(null);
          setProvider(null);
          setContracts({});
          setWcProvider(null);
          
          // Clear wallet storage
          localStorage.removeItem('walletType');
          localStorage.removeItem('walletconnect');
          localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
          sessionStorage.removeItem('walletconnect');
          sessionStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
          
          // Set disconnecting flag to prevent auto-reconnect
          setIsDisconnecting(true);
          setTimeout(() => {
            setIsDisconnecting(false);
          }, 3000);
        });
      } catch (error) {
        console.error('WalletConnect login failed:', error);
        
        // Check if user closed modal or rejected connection
        if (error.message && (
          error.message.includes('User rejected') || 
          error.message.includes('User closed modal') ||
          error.message.includes('Connection request reset') ||
          error.message.includes('Modal closed') ||
          error.code === 4001 || // User rejected the request
          error.code === -32000 // User closed modal
        )) {
          console.log('ĐÃ TẮT');
        }
        
        // Clean up modal observer if it exists
        if (wcProviderInstance && wcProviderInstance._modalObserver) {
          wcProviderInstance._modalObserver.disconnect();
          delete wcProviderInstance._modalObserver;
        }
      }
    }
  }, [wcProvider]);

  // Logout function
  const logout = async () => {
    console.log("🔄 Starting wallet logout...");
    
    // Set disconnecting flag to prevent auto-reconnect
    setIsDisconnecting(true);
    
    try {
      // Clean up modal observer if it exists
      if (wcProvider && wcProvider._modalObserver) {
        wcProvider._modalObserver.disconnect();
        delete wcProvider._modalObserver;
      }

      // Disconnect WalletConnect properly
      if (wcProvider) {
        try {
          // Disconnect from WalletConnect
          await wcProvider.disconnect();
          console.log("✅ WalletConnect disconnected");
          
          // Clean up WalletConnect provider
          setWcProvider(null);
        } catch (error) {
          console.error('WalletConnect disconnect error:', error);
        }
      }
      
      // For MetaMask, try to request account change (this will trigger user to manually disconnect)
      if (window.ethereum && window.ethereum.isMetaMask && account) {
        try {
          // Try to revoke permissions (newer MetaMask versions)
          await window.ethereum.request({
            method: "wallet_revokePermissions",
            params: [{ eth_accounts: {} }]
          });
          console.log("✅ MetaMask permissions revoked");
        } catch (revokeError) {
          console.log("MetaMask permission revocation not supported:", revokeError.message);
          
          // Fallback: Request permissions again (this will show permission dialog)
          try {
            await window.ethereum.request({
              method: 'wallet_requestPermissions',
              params: [{ eth_accounts: {} }]
            });
          } catch (permError) {
            console.log("MetaMask permission request failed:", permError.message);
          }
        }
      }
      
      // Disconnect wallet from server
      if (authService.isAuthenticated()) {
        try {
          await authService.disconnectWallet();
          console.log("✅ Wallet disconnected from server");
        } catch (error) {
          console.error("Disconnect wallet from server error:", error);
        }
      }
      
    } catch (error) {
      console.error("Error during wallet logout:", error);
    } finally {
      // Always clear all wallet-related data regardless of errors
      console.log("🧹 Cleaning up all wallet data...");
      
      // Mark disconnect time to prevent immediate auto-reconnect
      localStorage.setItem('lastDisconnectTime', Date.now().toString());
      
      // Clear all localStorage wallet data
      localStorage.removeItem('walletType');
      localStorage.removeItem('walletconnect');
      localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
      localStorage.removeItem('wc@2:client:0.3//session');
      localStorage.removeItem('wc@2:core:0.3//messages');
      localStorage.removeItem('wc@2:universal_provider://');
      
      // Clear sessionStorage wallet data
      sessionStorage.removeItem('walletconnect');
      sessionStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
      
      // Clear any other WalletConnect related storage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('walletconnect') || key.includes('wc@2') || key.includes('wagmi')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('walletconnect') || key.includes('wc@2') || key.includes('wagmi')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Reset all states
      setAccount(null);
      setSigner(null);
      setProvider(null);
      setContracts({});
      setWcProvider(null);
      setIsAdmin(false);
      
      console.log("✅ All wallet data cleared");
      console.log("✅ Wallet logout completed");
      
      // Reset disconnecting flag after cleanup is complete
      setTimeout(() => {
        setIsDisconnecting(false);
      }, 3000);
    }
  };

  // Force disconnect and refresh - for complete wallet disconnect
  const forceDisconnectAndRefresh = async () => {
    console.log("🔄 Starting force disconnect and refresh...");
    
    // Set disconnecting flag
    setIsDisconnecting(true);
    
    // Perform logout
    await logout();
    
    console.log("🔄 Refreshing page to ensure complete disconnect...");
    
    // Force refresh after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Complete logout (wallet + server)
  const completeLogout = async () => {
    console.log("🔄 Starting complete logout...");
    
    // Set disconnecting flag
    setIsDisconnecting(true);
    
    // Mark disconnect time to prevent immediate auto-reconnect
    localStorage.setItem('lastDisconnectTime', Date.now().toString());
    
    // Logout wallet first
    await logout();
    
    // Logout from server
    authService.logout();
    
    // Clear all possible wallet-related storage
    localStorage.removeItem('walletType');
    localStorage.removeItem('walletconnect');
    localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
    sessionStorage.removeItem('walletconnect');
    sessionStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
    
    // Update authentication state
    setIsAuthenticated(false);
    
    console.log("✅ Complete logout finished");
    
    // Add a small delay before redirect to ensure all cleanup is done
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  };

  // Check if user is admin
  const checkIfAdmin = async (userAddress) => {
    if (!userAddress) return false;
    if (!contracts?.loan) return false;
    
    try {
      const admins = await contracts.loan.getAdmins();
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

  const getUserCollaterals = useCallback(async (userAddress) => {
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
  }, [contracts.loan]);
  
  const getPendingCollaterals = useCallback(async () => {
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
  }, [contracts.loan]);
  
  const getAcceptedCollaterals = useCallback(async () => {
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
  }, [contracts.loan]);  
  
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
  
  const getLoansForUserCollaterals = useCallback(async (userAddress) => {
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
  }, [contracts.loan]);
  
  const getActiveLoansForUser = useCallback(async (userAddress) => {
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
  }, [contracts.loan]);
  
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
        console.log("🔄 MetaMask accounts changed:", accounts);
        if (accounts.length === 0) {
          console.log("🔄 MetaMask disconnected - clearing all wallet data");
          
          // Mark disconnect time
          localStorage.setItem('lastDisconnectTime', Date.now().toString());
          
          setAccount(null);
          setSigner(null);
          setProvider(null);
          setContracts({});
          
          // Clear wallet storage
          localStorage.removeItem('walletType');
          
          // Set disconnecting flag to prevent auto-reconnect
          setIsDisconnecting(true);
          setTimeout(() => {
            setIsDisconnecting(false);
          }, 3000);
        } else {
          setAccount(accounts[0]);
        }
        // Note: User feedback (toasts) and wallet connection API calls 
        // are handled by the Navbar component to prevent duplicates
      };

      const handleChainChanged = (newChainId) => {
        const parsedChainId = parseInt(newChainId, 16);
        // Only show toast when user is logged in
        if (authService.isAuthenticated()) {
          toast.info(`Network Changed to Chain Id: ${parsedChainId}`, { toastId: 'changeChainId' });
        }
        // Reload page to reset provider and contracts
        window.location.reload();
      };

      const handleDisconnect = (error) => {
        console.log("🔄 MetaMask disconnect event triggered - performing full cleanup");
        
        // Mark disconnect time
        localStorage.setItem('lastDisconnectTime', Date.now().toString());
        
        // Full cleanup
        setAccount(null);
        setSigner(null);
        setProvider(null);
        setContracts({});
        
        // Only show toast when user is logged in
        if (authService.isAuthenticated()) {
          setIsAuthenticated(false);
          toast.error('Wallet disconnected');
        }
        
        // Clear wallet storage
        localStorage.removeItem('walletType');
        localStorage.removeItem('walletconnect');
        localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
        
        // Set disconnecting flag to prevent auto-reconnect
        setIsDisconnecting(true);
        setTimeout(() => {
          setIsDisconnecting(false);
        }, 3000);
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
      // Only show MetaMask missing error when user is logged in
      if (authService.isAuthenticated()) {
        toast.error('Metamask is not installed', { toastId: 'metamask-missing' });
      }
    }
  }, []);

  return {
    isAuthenticated,
    login,
    logout,
    completeLogout,
    forceDisconnectAndRefresh,
    isAdmin,
    provider,
    signer,
    account,
    contracts,
    isDisconnecting,
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