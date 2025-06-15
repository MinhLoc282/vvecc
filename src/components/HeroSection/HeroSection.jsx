import React from "react";
import styles from "./index.module.css";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import useTheme from "../../hooks/useTheme";
export const HeroSection = () => {
  const { theme } = useTheme({});

  const isDarkMode = theme === "dark";

  return (
    <div className={styles.heroSection}>
      {isDarkMode ? <div className={styles.gridOverlay} /> : null}
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            Unlock Liquidity From Your Equity Holdings
          </h1>
          <div className={styles.description}>
            VECC is a decentralized platform that enables securities-based
            lending through tokenized collateral and free-market loan auctions.
          </div>
          <div className={styles.buttonContainer}>
            <div size="lg" className={styles.primaryButton}>
              Get Started
              <ArrowRight className={styles.Icon} />
            </div>
            <Link href="/whitepaper">
              <div className={styles.readButton}>Read Whitepaper</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
