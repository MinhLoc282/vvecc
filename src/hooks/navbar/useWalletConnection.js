import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../use-auth-client";
import { authService } from "../../services/authService";

export const useWalletConnection = () => {
  const { isAuthenticated, login, logout, account, isDisconnecting } = useAuth();
  
  // Wallet modal states
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [registeredWallet, setRegisteredWallet] = useState(null);
  const [isProcessingConnection, setIsProcessingConnection] = useState(false);
  const [isLoadingWalletInfo, setIsLoadingWalletInfo] = useState(false);
  const [isManualConnection, setIsManualConnection] = useState(false);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  
  // Use ref to track previous modal state to avoid dependency loops
  const previousModalState = useRef(false);
  const abortControllerRef = useRef(null);
  const lastAccountRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  const isLogin = localStorage.getItem("email");

  // Detect auto-connect phase (when page loads and user is authenticated but no account yet)
  useEffect(() => {
    if (isLogin && !account && !isDisconnecting && !isManualConnection) {
      // Check if there's a saved wallet type (indicates potential auto-connect)
      const savedWalletType = localStorage.getItem('walletType');
      if (savedWalletType) {
        setIsAutoConnecting(true);
        console.log("🔄 Auto-connect phase detected, hiding modal temporarily");
        
        // Auto-connect timeout - if no connection after 3 seconds, show modal
        setTimeout(() => {
          if (!account) {
            setIsAutoConnecting(false);
            console.log("⏰ Auto-connect timeout, showing modal if needed");
          }
        }, 3000);
      }
    } else if (account) {
      // When account is connected, stop auto-connecting
      setIsAutoConnecting(false);
    }
  }, [isLogin, account, isDisconnecting, isManualConnection]);

  // Load registered wallet info once when user logs in
  useEffect(() => {
    const loadRegisteredWallet = async () => {
      if (isLogin && !registeredWallet) {
        try {
          setIsLoadingWalletInfo(true);
          const walletInfo = await authService.getUserWallet();
          setRegisteredWallet(walletInfo.walletAddress);
        } catch (error) {
          console.error("❌ Error loading registered wallet:", error);
        } finally {
          setIsLoadingWalletInfo(false);
        }
      }
    };

    loadRegisteredWallet();
  }, [isLogin, registeredWallet]);

  // Check wallet connection status when account or registered wallet changes
  useEffect(() => {
    // Don't show modal if user is disconnecting or auto-connecting
    if (isLogin && !isConnecting && !isProcessingConnection && !isDisconnecting && !isAutoConnecting) {
      if (registeredWallet) {
        if (account) {
          // User has connected wallet in browser
          if (account.toLowerCase() === registeredWallet.toLowerCase()) {
            // Correct wallet connected - hide modal and show success
            const wasWrongWallet = previousModalState.current;
            setShowWalletModal(false);
            previousModalState.current = false;
            
            // Show success toast when switching from wrong to correct wallet
            // But only show it for manual connections, not auto-reconnect
            if (wasWrongWallet && isManualConnection) {
              toast.success(`Connected successfully!`);
            }
          } else {
            // Wrong wallet connected - show modal and warning
            const wasCorrectWallet = !previousModalState.current;
            setShowWalletModal(true);
            previousModalState.current = true;
            
            // Show warning toast when switching to wrong wallet
            if (wasCorrectWallet) {
              toast.error(`Wrong wallet detected! Please connect: ${registeredWallet.slice(0, 6)}...${registeredWallet.slice(-4)}`);
            }
          }
        } else {
          // No wallet connected in browser but has registered wallet - show modal
          // But only if we're not in auto-connect phase
          setShowWalletModal(true);
          previousModalState.current = true;
        }
      } else if (registeredWallet === null) {
        // No wallet registered yet - show modal for first time connection
        setShowWalletModal(true);
        previousModalState.current = true;
      }
    } else {
      setShowWalletModal(false);
      previousModalState.current = false;
    }
  }, [isLogin, account, registeredWallet, isConnecting, isProcessingConnection, isManualConnection, isDisconnecting, isAutoConnecting]);

  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);
      setIsManualConnection(true);

      // Connect to wallet
      await login();
      
      // Dismiss connecting toast
      toast.dismiss('wallet-connecting-initial');
    } catch (error) {
      // Dismiss connecting toast
      toast.dismiss('wallet-connecting-initial');
      
      toast.error("Failed to connect wallet. Please try again.");
      setIsConnecting(false);
      setIsManualConnection(false);
    }
  };

  // Debounced wallet connection processing
  const debouncedProcessWalletConnection = useCallback((account, registeredWallet, abortSignal) => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        // Check if request was aborted
        if (abortSignal.aborted) {
          console.log("🚫 Debounced wallet connection was aborted");
          return;
        }

        // Dismiss any existing toasts
        toast.dismiss();

        if (!registeredWallet) {
          // First time connection - register wallet on server
          try {
            console.log("🔗 Attempting to connect wallet:", account);
            
            // Show connecting toast
            toast.info(`Registering wallet: ${account.slice(0, 6)}...${account.slice(-4)}`);
            
            const result = await authService.connectWallet(account, abortSignal);
            
            // Check if request was aborted after API call
            if (abortSignal.aborted) {
              console.log("🚫 Wallet connection request was aborted");
              toast.dismiss('wallet-connecting');
              return;
            }
            
            // Dismiss connecting toast
            toast.dismiss('wallet-connecting');
            
            setRegisteredWallet(account);
            setShowWalletModal(false);
            toast.success(
              `Wallet registered successfully! ${account.slice(0, 6)}...${account.slice(-4)} is now permanently linked to your account.`
            );

            // Verify the wallet was actually saved by refetching
            setTimeout(async () => {
              try {
                const verifyWallet = await authService.getUserWallet();
              } catch (error) {
                console.error("Error verifying wallet:", error);
              }
            }, 1000);
          } catch (error) {
            // Dismiss connecting toast
            toast.dismiss('wallet-connecting');
            
            // Don't show error if request was aborted
            if (error.name === 'AbortError') {
              console.log("Wallet connection request was aborted");
              return;
            }
            
            let errorMessage = "Failed to register wallet. Please try again.";
            if (
              error.error &&
              error.error.includes("already connected to another account")
            ) {
              errorMessage =
                "This wallet is already connected to another account!";
            }
            toast.error(errorMessage);
          }
        } else {
          // User already has registered wallet - just verify connection status
          if (account.toLowerCase() === registeredWallet.toLowerCase()) {
            setShowWalletModal(false);
            // Only show success toast for manual connections, not auto-reconnect
            if (isManualConnection) {
              toast.success(`Connected successfully!`);
            }
          } else {
            setShowWalletModal(true);
          }
        }
      } catch (error) {
        // Don't show error if request was aborted
        if (error.name !== 'AbortError') {
          toast.error("Failed to process wallet connection. Please try again.");
        }
      } finally {
        setIsConnecting(false);
        setIsProcessingConnection(false);
        setIsManualConnection(false);
        abortControllerRef.current = null;
        lastAccountRef.current = null;
      }
    }, 500); // 500ms debounce delay
  }, []);

  // Handle manual wallet connection (only when user clicks Connect button)
  useEffect(() => {
    if (isConnecting && isManualConnection && account && !isProcessingConnection) {
      // Skip if this account is already being processed
      if (lastAccountRef.current === account) {
        console.log("🔄 Skipping duplicate account processing:", account);
        return;
      }
      
      // Update last processed account
      lastAccountRef.current = account;
      
      // Cancel any pending API calls
      if (abortControllerRef.current) {
        console.log("🚫 Aborting previous wallet connection request");
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      // Only process for manual connections
      setIsProcessingConnection(true);

      // Use debounced processing
      debouncedProcessWalletConnection(account, registeredWallet, abortControllerRef.current.signal);
    }
    
    // Cleanup function to abort any pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [isConnecting, isManualConnection, account, registeredWallet, debouncedProcessWalletConnection]);

  return {
    showWalletModal,
    isConnecting,
    registeredWallet,
    isProcessingConnection,
    isLoadingWalletInfo,
    isAutoConnecting,
    isLogin,
    handleConnectWallet,
  };
};
