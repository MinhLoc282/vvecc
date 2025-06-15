import { X, ShoppingCart, AlertCircle, CheckCircle2 } from "lucide-react";
import styles from "./index.module.css";
import { bytes32ToString } from "../../utils";
import useTheme from "../../hooks/useTheme";

export const BuyNFTModal = ({
  open,
  onClose,
  listing,
  loading,
  onConfirmPurchase
}) => {
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";
  
  if (!open || !listing) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirmPurchase && !loading) {
      onConfirmPurchase();
    }
  };

  return (
    <div className={`${styles.modalOverlay} ${isDarkMode ? styles.dark : ""}`} onClick={handleBackdropClick}>
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <div className={styles.iconWrapper}>
              <ShoppingCart className={styles.headerIcon} />
            </div>
            <div className={styles.titleSection}>
              <h2 className={styles.modalTitle}>Purchase Loan NFT</h2>
              <p className={styles.modalSubtitle}>Review and confirm your purchase</p>
            </div>
          </div>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
          >
            <X className={styles.closeIcon} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {/* NFT Preview Card */}
          <div className={styles.nftPreview}>
            <div className={styles.nftHeader}>
              <h3 className={styles.nftTitle}>
                {bytes32ToString(listing.stockName)} - {listing.quantity} shares
              </h3>
              <div className={styles.statusBadge}>
                <CheckCircle2 className={styles.statusIcon} />
                Available
              </div>
            </div>
            
            <div className={styles.nftDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Loan ID</span>
                <span className={styles.detailValue}>#{listing.loanId}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Interest Rate</span>
                <span className={styles.detailValue}>{listing.interestRate}%</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Loan Amount</span>
                <span className={styles.detailValue}>{listing.loanAmount} USDT</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Duration</span>
                <span className={styles.detailValue}>{listing.duration} months</span>
              </div>
            </div>
          </div>

          {/* Price Section */}
          <div className={styles.priceSection}>
            <div className={styles.priceHeader}>
              <span className={styles.priceLabel}>Total Price</span>
              <div className={styles.priceValue}>
                <span className={styles.amount}>{listing.price}</span>
                <span className={styles.currency}>USDT</span>
              </div>
            </div>
          </div>

          {/* Warning Notice */}
          <div className={styles.warningNotice}>
            <AlertCircle className={styles.warningIcon} />
            <div className={styles.warningText}>
              <p className={styles.warningTitle}>Important Notice</p>
              <p className={styles.warningDescription}>
                You are purchasing a loan NFT that represents ownership rights to this loan. 
                Please ensure you understand the terms and conditions before proceeding.
              </p>
            </div>
          </div>
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
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className={styles.spinner}></div>
                Processing...
              </>
            ) : (
              <>
                <ShoppingCart className={styles.buttonIcon} />
                Confirm Purchase
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyNFTModal;
