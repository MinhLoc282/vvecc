import React from "react";
import {
  Modal,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import styles from "./index.module.css";
import useTheme from "../../hooks/useTheme";

export const AddCollateralModal = ({
  open,
  onClose,
  stockName,
  setStockName,
  quantity,
  setQuantity,
  requestedAmount,
  setRequestedAmount,
  duration,
  setDuration,
  maxLoanAmount,
  collateralTypes,
  loading,
  onAddCollateral,
  onCalculateMaxLoan,
}) => {
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";

  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div 
        className={`${styles.modalOverlay} ${isDarkMode ? styles.dark : ""}`} 
        onClick={handleBackdropClick}
      >
        <div className={styles.modalContainer}>
          {/* Header */}
          <div className={styles.modalHeader}>
            <div className={styles.headerContent}>
              <div className={styles.iconWrapper}>
                <AddIcon className={styles.headerIcon} />
              </div>
              <div className={styles.titleSection}>
                <h2 className={styles.modalTitle}>Add Collateral</h2>
                <p className={styles.modalSubtitle}>Create a new collateral request</p>
              </div>
            </div>
            <button 
              className={styles.closeButton}
              onClick={onClose}
              disabled={loading}
            >
              <span className={styles.closeIcon}>×</span>
            </button>
          </div>

          {/* Content */}
          <div className={styles.modalContent}>
            <FormControl fullWidth className={styles.formControl}>
              <InputLabel
                sx={{
                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                  "&.Mui-focused": {
                    color: "#3b82f6",
                  },
                  "&.MuiInputLabel-shrink": {
                    color: isDarkMode ? "#e5e7eb" : "#374151",
                  },
                }}
              >
                Stock Name
              </InputLabel>
              <Select
                value={stockName}
                label="Stock Name"
                onChange={(e) => setStockName(e.target.value)}
                required
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                      border: isDarkMode ? "1px solid #4b5563" : "1px solid #e2e8f0",
                      boxShadow: isDarkMode 
                        ? "0 10px 30px rgba(0, 0, 0, 0.5)" 
                        : "0 4px 16px rgba(0, 0, 0, 0.1)",
                    },
                  },
                }}
                sx={{
                  backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDarkMode ? "#4b5563" : "#e2e8f0",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#3b82f6",
                  },
                  "& .MuiSelect-select": {
                    color: isDarkMode ? "#f9fafb" : "#1f2937",
                  },
                }}
              >
                {collateralTypes
                  .filter(type => type.isActive)
                  .map((type) => (
                    <MenuItem 
                      key={type.symbol} 
                      value={type.symbol}
                      sx={{
                        backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                        color: isDarkMode ? "#f9fafb" : "#1f2937",
                        "&:hover": {
                          backgroundColor: isDarkMode ? "#4b5563" : "#f3f4f6",
                        },
                        "&.Mui-selected": {
                          backgroundColor: isDarkMode ? "#4b5563" : "#e5e7eb",
                          "&:hover": {
                            backgroundColor: isDarkMode ? "#6b7280" : "#d1d5db",
                          },
                        },
                      }}
                    >
                      {type.symbol}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                onCalculateMaxLoan();
              }}
              fullWidth
              required
              className={styles.formControl}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                  "& fieldset": {
                    borderColor: isDarkMode ? "#4b5563" : "#e2e8f0",
                  },
                  "&:hover fieldset": {
                    borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#3b82f6",
                  },
                  "& input": {
                    color: isDarkMode ? "#f9fafb" : "#1f2937",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                  "&.Mui-focused": {
                    color: "#3b82f6",
                  },
                },
              }}
            />
            
            {maxLoanAmount && (
              <div className={styles.infoNotice}>
                <Typography variant="body2" className={styles.infoText}>
                  Max loan amount: {parseFloat(maxLoanAmount).toFixed(2)} USDT (70% of collateral value)
                </Typography>
              </div>
            )}
            
            <TextField
              label="Requested Amount (USDT)"
              type="number"
              value={requestedAmount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                  setRequestedAmount(value);
                }
              }}
              fullWidth
              required
              className={styles.formControl}
              helperText={maxLoanAmount && `Max: ${parseFloat(maxLoanAmount).toFixed(2)} USDT`}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                  "& fieldset": {
                    borderColor: isDarkMode ? "#4b5563" : "#e2e8f0",
                  },
                  "&:hover fieldset": {
                    borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#3b82f6",
                  },
                  "& input": {
                    color: isDarkMode ? "#f9fafb" : "#1f2937",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                  "&.Mui-focused": {
                    color: "#3b82f6",
                  },
                },
                "& .MuiFormHelperText-root": {
                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                },
              }}
            />
            
            <FormControl fullWidth className={styles.formControl}>
              <InputLabel
                sx={{
                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                  "&.Mui-focused": {
                    color: "#3b82f6",
                  },
                  "&.MuiInputLabel-shrink": {
                    color: isDarkMode ? "#e5e7eb" : "#374151",
                  },
                }}
              >
                Duration (months)
              </InputLabel>
              <Select
                value={duration}
                label="Duration (months)"
                onChange={(e) => setDuration(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                      border: isDarkMode ? "1px solid #4b5563" : "1px solid #e2e8f0",
                      boxShadow: isDarkMode 
                        ? "0 10px 30px rgba(0, 0, 0, 0.5)" 
                        : "0 4px 16px rgba(0, 0, 0, 0.1)",
                    },
                  },
                }}
                sx={{
                  backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDarkMode ? "#4b5563" : "#e2e8f0",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#3b82f6",
                  },
                  "& .MuiSelect-select": {
                    color: isDarkMode ? "#f9fafb" : "#1f2937",
                  },
                }}
              >
                <MenuItem 
                  value={6}
                  sx={{
                    backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                    color: isDarkMode ? "#f9fafb" : "#1f2937",
                    "&:hover": {
                      backgroundColor: isDarkMode ? "#4b5563" : "#f3f4f6",
                    },
                    "&.Mui-selected": {
                      backgroundColor: isDarkMode ? "#4b5563" : "#e5e7eb",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#6b7280" : "#d1d5db",
                      },
                    },
                  }}
                >
                  6 months
                </MenuItem>
                <MenuItem 
                  value={8}
                  sx={{
                    backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                    color: isDarkMode ? "#f9fafb" : "#1f2937",
                    "&:hover": {
                      backgroundColor: isDarkMode ? "#4b5563" : "#f3f4f6",
                    },
                    "&.Mui-selected": {
                      backgroundColor: isDarkMode ? "#4b5563" : "#e5e7eb",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#6b7280" : "#d1d5db",
                      },
                    },
                  }}
                >
                  8 months
                </MenuItem>
                <MenuItem 
                  value={12}
                  sx={{
                    backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                    color: isDarkMode ? "#f9fafb" : "#1f2937",
                    "&:hover": {
                      backgroundColor: isDarkMode ? "#4b5563" : "#f3f4f6",
                    },
                    "&.Mui-selected": {
                      backgroundColor: isDarkMode ? "#4b5563" : "#e5e7eb",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#6b7280" : "#d1d5db",
                      },
                    },
                  }}
                >
                  12 months
                </MenuItem>
                <MenuItem 
                  value={18}
                  sx={{
                    backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                    color: isDarkMode ? "#f9fafb" : "#1f2937",
                    "&:hover": {
                      backgroundColor: isDarkMode ? "#4b5563" : "#f3f4f6",
                    },
                    "&.Mui-selected": {
                      backgroundColor: isDarkMode ? "#4b5563" : "#e5e7eb",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#6b7280" : "#d1d5db",
                      },
                    },
                  }}
                >
                  18 months
                </MenuItem>
                <MenuItem 
                  value={24}
                  sx={{
                    backgroundColor: isDarkMode ? "#374151" : "#ffffff",
                    color: isDarkMode ? "#f9fafb" : "#1f2937",
                    "&:hover": {
                      backgroundColor: isDarkMode ? "#4b5563" : "#f3f4f6",
                    },
                    "&.Mui-selected": {
                      backgroundColor: isDarkMode ? "#4b5563" : "#e5e7eb",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#6b7280" : "#d1d5db",
                      },
                    },
                  }}
                >
                  24 months
                </MenuItem>
              </Select>
            </FormControl>
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button 
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              className={styles.confirmButton}
              onClick={onAddCollateral}
              disabled={
                !stockName || 
                !quantity || 
                !requestedAmount || 
                loading ||
                (maxLoanAmount && parseFloat(requestedAmount) > parseFloat(maxLoanAmount))
              }
            >
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  Adding...
                </>
              ) : (
                <>
                  <AddIcon className={styles.buttonIcon} />
                  Add Collateral
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddCollateralModal;
