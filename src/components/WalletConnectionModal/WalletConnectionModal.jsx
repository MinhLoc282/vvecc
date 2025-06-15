import {
  Modal,
  Box,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { authService } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import useTheme from "../../hooks/useTheme";

export const WalletConnectionModal = ({
  showWalletModal,
  isLogin,
  isAuthPage,
  registeredWallet,
  isProcessingConnection,
  isConnecting,
  handleConnectWallet,
}) => {
  const navigate = useNavigate();
  const { theme } = useTheme({});

  return (
    <Modal
      open={showWalletModal && isLogin && !isAuthPage}
      onClose={() => {}} // Cannot close modal manually
      aria-labelledby="wallet-modal-title"
      aria-describedby="wallet-modal-description"
      sx={{
        backdropFilter: "blur(10px)",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 480 },
          maxWidth: 500,
          bgcolor: theme === "dark" ? "#0f172a" : "#ffffff",
          color: theme === "dark" ? "#f8fafc" : "#1e293b",
          border: "none",
          borderRadius: "24px",
          boxShadow:
            theme === "dark"
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)"
              : "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
        }}
      >
        {/* Header with gradient */}
        <Box
          sx={{
            background:
              theme === "dark"
                ? "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%)"
                : "linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #06b6d4 100%)",
            p: 4,
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)",
            },
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1 }}>
            {/* Wallet Icon */}
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                backdropFilter: "blur(10px)",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 3v2a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V3"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "white",
                mb: 1,
                fontSize: "1.5rem",
              }}
            >
              {registeredWallet
                ? "Connect Your Registered Wallet"
                : "Connect Your Wallet"}
            </Typography>
            <Typography
              sx={{
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "0.95rem",
                fontWeight: 400,
              }}
            >
              Secure access to VECC platform
            </Typography>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ p: 4 }}>
          {isProcessingConnection ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              py: 4 
            }}>
              <CircularProgress 
                size={40} 
                sx={{ 
                  mb: 2,
                  color: theme === 'dark' ? '#3b82f6' : '#2563eb'
                }} 
              />
              <Typography sx={{ 
                fontSize: '1rem',
                fontWeight: 500,
                color: theme === 'dark' ? '#cbd5e1' : '#64748b',
                textAlign: 'center'
              }}>
                Processing wallet connection...
              </Typography>
              <Typography sx={{ 
                fontSize: '0.85rem',
                color: theme === 'dark' ? '#94a3b8' : '#9ca3af',
                textAlign: 'center',
                mt: 1
              }}>
                Please wait while we verify your wallet
              </Typography>
            </Box>
          ) : (
            <>
              {registeredWallet ? (
                <Typography
                  sx={{
                    mb: 3,
                    fontSize: "1rem",
                    lineHeight: 1.6,
                    color: theme === "dark" ? "#cbd5e1" : "#64748b",
                    textAlign: "center",
                  }}
                >
                  Please connect your permanently registered wallet: <br />
                  <strong>
                    {registeredWallet.slice(0, 6)}...{registeredWallet.slice(-4)}
                  </strong>
                  <br />
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "0.85rem",
                      color: theme === "dark" ? "#94a3b8" : "#6b7280",
                      mt: 1,
                      display: "block",
                    }}
                  >
                    This wallet cannot be changed once connected.
                  </Typography>
                </Typography>
              ) : (
                <Typography
                  sx={{
                    mb: 3,
                    fontSize: "1rem",
                    lineHeight: 1.6,
                    color: theme === "dark" ? "#cbd5e1" : "#64748b",
                    textAlign: "center",
                  }}
                >
                  Connect your wallet to access lending and borrowing features.
                  <br />
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "0.85rem",
                      color: theme === "dark" ? "#f59e0b" : "#d97706",
                      mt: 1,
                      display: "block",
                      fontWeight: 600,
                    }}
                  >
                    ⚠️ Important: This wallet will be permanently linked to your
                    account and cannot be changed later.
                  </Typography>
                </Typography>
              )}

              {/* Connect Button */}
              <Button
                fullWidth
                variant="contained"
                onClick={handleConnectWallet}
                disabled={isConnecting || isProcessingConnection}
                sx={{
                  background:
                    theme === "dark"
                      ? "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)"
                      : "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                  color: "white",
                  py: 1.8,
                  fontSize: "1rem",
                  fontWeight: 600,
                  mb: 2,
                  borderRadius: "16px",
                  textTransform: "none",
                  boxShadow: "0 8px 25px rgba(37, 99, 235, 0.3)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 12px 30px rgba(37, 99, 235, 0.4)",
                  },
                  "&:disabled": {
                    background: theme === "dark" ? "#374151" : "#e5e7eb",
                    color: theme === "dark" ? "#9ca3af" : "#6b7280",
                    transform: "none",
                    boxShadow: "none",
                  },
                }}
              >
                {isConnecting || isProcessingConnection ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
                    {isConnecting ? "Connecting Wallet..." : "Processing..."}
                  </>
                ) : (
                  <>
                    {registeredWallet
                      ? "Connect Registered Wallet"
                      : "Connect Wallet"}
                    <Box component="span" sx={{ ml: 1, fontSize: "1.1rem" }}>
                      →
                    </Box>
                  </>
                )}
              </Button>

              {/* Logout Button */}
              <Button
                fullWidth
                variant="text"
                onClick={() => {
                  authService.logout();
                  navigate("/login");
                }}
                disabled={isConnecting || isProcessingConnection}
                sx={{
                  color: theme === "dark" ? "#f87171" : "#dc2626",
                  py: 1.5,
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  borderRadius: "12px",
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor:
                      theme === "dark"
                        ? "rgba(248, 113, 113, 0.1)"
                        : "rgba(220, 38, 38, 0.05)",
                  },
                  "&:disabled": {
                    color: theme === "dark" ? "#6b7280" : "#9ca3af",
                  },
                }}
              >
                Sign out instead
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Modal>
  );
};
