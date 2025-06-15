import styles from "./index.module.css";
import useTheme from "../../hooks/useTheme";

export const NFTCard = ({
  title,
  subtitle,
  image,
  price,
  currency = "USDT",
  status,
  metadata = [],
  actionText = "View Details",
  secondaryActionText,
  onAction,
  onSecondaryAction,
  loading = false,
  className = "",
  variant = "default" // default, compact, detailed
}) => {
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";

  const handleAction = (e) => {
    e.preventDefault();
    if (onAction && !loading) {
      onAction();
    }
  };

  const handleSecondaryAction = (e) => {
    e.preventDefault();
    if (onSecondaryAction && !loading) {
      onSecondaryAction();
    }
  };

  const getStatusClassName = (status) => {
    if (!status) return "";
    
    const statusLower = status.toLowerCase();
    if (statusLower === "available" || statusLower === "public" || statusLower === "active") {
      return styles.statusAvailable;
    } else if (statusLower === "sold" || statusLower === "private" || statusLower === "completed") {
      return styles.statusSold;
    } else if (statusLower === "pending" || statusLower === "processing") {
      return styles.statusPending;
    }
    return styles.statusDefault;
  };

  return (
    <div className={`${styles.nftCard} ${styles[variant]} ${className} ${isDarkMode ? styles.dark : ""}`}>
      {/* Image Section */}
      {image && (
        <div className={styles.imageContainer}>
          <div className={styles.imageWrapper}>
            <img 
              src={image} 
              alt={title} 
              className={styles.image}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className={styles.imagePlaceholder} style={{ display: 'none' }}>
              <svg className={styles.placeholderIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className={styles.placeholderText}>No Image</span>
            </div>
          </div>
          {status && (
            <div className={`${styles.statusBadge} ${getStatusClassName(status)}`}>
              {status}
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h3 className={styles.title}>{title}</h3>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {!image && status && (
            <div className={`${styles.statusBadge} ${getStatusClassName(status)}`}>
              {status}
            </div>
          )}
        </div>

        {/* Metadata */}
        {metadata && metadata.length > 0 && (
          <div className={styles.metadata}>
            {metadata.map((item, index) => (
              <div key={index} className={styles.metadataItem}>
                <span className={styles.metadataLabel}>{item.label}:</span>
                <span className={styles.metadataValue}>{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Price Section */}
        {price !== undefined && price !== null && (
          <div className={styles.priceSection}>
            <div className={styles.price}>
              <span className={styles.priceValue}>{price}</span>
              <span className={styles.priceCurrency}>{currency}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          {secondaryActionText && (
            <button 
              className={`${styles.button} ${styles.secondaryButton}`}
              onClick={handleSecondaryAction}
              disabled={loading}
            >
              {loading ? (
                <div className={styles.spinner}></div>
              ) : (
                secondaryActionText
              )}
            </button>
          )}
          <button 
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={handleAction}
            disabled={loading}
          >
            {loading ? (
              <div className={styles.spinner}></div>
            ) : (
              actionText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NFTCard;
