import { X, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import styles from "./index.module.css";
import { bytes32ToString } from "../../utils";
import useTheme from "../../hooks/useTheme";

export const LoanDetailsModal = ({
  open,
  onClose,
  loanDetails,
  loading
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
    <div className={`${styles.modalOverlay} ${isDarkMode ? styles.dark : ""}`} onClick={handleBackdropClick}>
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <div className={styles.iconWrapper}>
              <FileText className={styles.headerIcon} />
            </div>
            <div className={styles.titleSection}>
              <h2 className={styles.modalTitle}>Loan Details</h2>
              <p className={styles.modalSubtitle}>Complete loan information and payment history</p>
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
          {loading ? (
            <div className={styles.loadingSection}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>Loading loan details...</p>
            </div>
          ) : loanDetails ? (
            <>
              {/* Loan Overview Card */}
              <div className={styles.loanOverview}>
                <div className={styles.overviewHeader}>
                  <h3 className={styles.overviewTitle}>Loan Overview</h3>
                  <div className={styles.statusBadge}>
                    <CheckCircle2 className={styles.statusIcon} />
                    Active
                  </div>
                </div>
                <div className={styles.overviewDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Loan ID</span>
                    <span className={styles.detailValue}>{loanDetails.loanId}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Token ID</span>
                    <span className={styles.detailValue}>{loanDetails.tokenId}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Stock</span>
                    <span className={styles.detailValue}>
                      {typeof loanDetails.stockName === 'string' && loanDetails.stockName.startsWith('0x') 
                        ? bytes32ToString(loanDetails.stockName) 
                        : loanDetails.stockName} - {loanDetails.quantity} shares
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div className={styles.financialSection}>
                <h3 className={styles.sectionTitle}>Financial Details</h3>
                <div className={styles.financialGrid}>
                  <div className={styles.financialItem}>
                    <span className={styles.financialLabel}>Interest Rate</span>
                    <span className={styles.financialValue}>{loanDetails.interestRate}%</span>
                  </div>
                  <div className={styles.financialItem}>
                    <span className={styles.financialLabel}>Loan Amount</span>
                    <span className={styles.financialValue}>{loanDetails.loanAmount} USDT</span>
                  </div>
                  <div className={styles.financialItem}>
                    <span className={styles.financialLabel}>Duration</span>
                    <span className={styles.financialValue}>{loanDetails.duration} months</span>
                  </div>
                </div>
              </div>

              {/* Borrower Information */}
              <div className={styles.borrowerSection}>
                <h3 className={styles.sectionTitle}>Borrower Information</h3>
                <div className={styles.borrowerDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Borrower Address</span>
                    <span className={styles.detailValue}>
                      {loanDetails.borrower.slice(0, 6)}...{loanDetails.borrower.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div className={styles.paymentSection}>
                <h3 className={styles.sectionTitle}>Payment History</h3>
                <div className={styles.paymentDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Last Payment</span>
                    <span className={styles.detailValue}>{loanDetails.lastPaymentTime}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Next Payment Due</span>
                    <span className={styles.detailValue}>{loanDetails.nextPaymentDue}</span>
                  </div>
                </div>
              </div>

              {/* Information Notice */}
              <div className={styles.infoNotice}>
                <AlertCircle className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <h4 className={styles.infoTitle}>Important Information</h4>
                  <p className={styles.infoDescription}>
                    This loan NFT represents an active loan agreement. Payment dates and amounts are calculated based on the original loan terms.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.noDataSection}>
              <AlertCircle className={styles.noDataIcon} />
              <p className={styles.noDataText}>No loan details available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button 
            className={styles.closeFooterButton}
            onClick={onClose}
            disabled={loading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
