import styles from "./index.module.css";
import useTheme from "../../hooks/useTheme";

export const EmptyState = ({
  icon: CustomIcon,
  title,
  description,
  actionText,
  secondaryActionText,
  onAction,
  onSecondaryAction,
  className = "",
  variant = "default", // default, compact, large
  loading = false
}) => {
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";

  const handleAction = () => {
    if (onAction && !loading) {
      onAction();
    }
  };

  const handleSecondaryAction = () => {
    if (onSecondaryAction && !loading) {
      onSecondaryAction();
    }
  };

  // Default icon if none provided
  const DefaultIcon = () => (
    <svg 
      className={styles.defaultIcon} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M20 7L12 3L4 7V17L12 21L20 17V7Z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 12L20 7" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 12L4 7" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 12V21" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );

  const IconComponent = CustomIcon || DefaultIcon;

  return (
    <div className={`${styles.emptyState} ${styles[variant]} ${className} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.content}>
        {/* Icon Section */}
        <div className={styles.iconContainer}>
          <div className={styles.iconWrapper}>
            <IconComponent className={styles.icon} />
          </div>
          <div className={styles.iconBackground}></div>
        </div>

        {/* Content Section */}
        <div className={styles.textContent}>
          <h3 className={styles.title}>{title}</h3>
          {description && (
            <p className={styles.description}>{description}</p>
          )}
        </div>

        {/* Actions Section */}
        {(actionText || secondaryActionText) && (
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
            {actionText && (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
