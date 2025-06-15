import styles from "./index.module.css";
import useTheme from "../../hooks/useTheme";

export const HowVeccWorks = () => {
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";

  // Crypto-related SVG icons (monochrome)
  const icons = {
    lock: (
      <svg viewBox="0 0 24 24" fill="none" className={styles.icon}>
        <path d="M12 17C13.1 17 14 16.1 14 15C14 13.9 13.1 13 12 13C10.9 13 10 13.9 10 15C10 16.1 10.9 17 12 17ZM18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 3C13.66 3 15 4.34 15 6V8H9V6C9 4.34 10.34 3 12 3Z" fill="currentColor"/>
      </svg>
    ),
    trending: (
      <svg viewBox="0 0 24 24" fill="none" className={styles.icon}>
        <path d="M16 6L18.29 8.29L13.41 13.17L9.41 9.17L2 16.59L3.41 18L9.41 12L13.41 16L19.71 9.71L22 12V6H16Z" fill="currentColor"/>
      </svg>
    ),
    diamond: (
      <svg viewBox="0 0 24 24" fill="none" className={styles.icon}>
        <path d="M6 2L2 8L12 22L22 8L18 2H6ZM5 8L7.5 4H10.5L8 8H5ZM12 19L7 9H17L12 19ZM16 8L13.5 4H16.5L19 8H16Z" fill="currentColor"/>
      </svg>
    )
  };

  return (
    <div className={`${styles.wrapVECC} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.header}>
        <h2 className={styles.textWork}>How VECC Works</h2>
        <p className={styles.subtitle}>Decentralized lending powered by blockchain technology</p>
      </div>
      
      <div className={styles.wrapWork}>
        <div className={styles.wrapBox}>
          <div className={styles.iconWrapper}>
            {icons.lock}
          </div>
          <h3 className={styles.title}>Collateralize Assets</h3>
          <p className={styles.content}>
            Tokenize and pledge your public or private equity holdings as
            collateral to access liquidity without selling your assets.
          </p>
        </div>

        <div className={styles.wrapBox}>
          <div className={styles.iconWrapper}>
            {icons.trending}
          </div>
          <h3 className={styles.title}>Participate in Auctions</h3>
          <p className={styles.content}>
            Lenders compete in free-market loan auctions to offer the best
            rates, creating a transparent and efficient marketplace.
          </p>
        </div>

        <div className={styles.wrapBox}>
          <div className={styles.iconWrapper}>
            {icons.diamond}
          </div>
          <h3 className={styles.title}>Trade Loan NFTs</h3>
          <p className={styles.content}>
            Loan positions are tokenized as NFTs that can be traded on the
            secondary market, providing additional liquidity options.
          </p>
        </div>
      </div>
    </div>
  );
};
