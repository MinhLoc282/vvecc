import React from "react";
import styles from "./index.module.css";

// Components
import { HeroSection } from "../../components/HeroSection/HeroSection";
import { StatsCard } from "../../components/StatsCard/StatsCard";
import { TabLoan } from "../../components/TabLoan/TabLoan";

// Hooks
import useTheme from "../../hooks/useTheme";

// Icons
import LockIcon from "../../assets/lock.svg";
import LoanIcon from "../../assets/loan.svg";
import PriceIcon from "../../assets/price.svg";
import MembersIcon from "../../assets/members.svg";

export const DashboardPage = () => {
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";
  
  return (
    <div className={`${styles.container} ${isDarkMode ? styles.dark : ""}`}>
      <HeroSection />
      <div className={styles.wrapStatCard}>
        <StatsCard
          title="Total Value Locked"
          value="$24.8M"
          change="12.5%"
          trend="up"
          icon={<img src={LockIcon} alt="Lock" className={styles.Icon} />}
        />
        <StatsCard
          title="Active Loans"
          value="1,284"
          change="8.3%"
          trend="up"
          icon={<img src={LoanIcon} alt="Loan" className={styles.Icon} />}
        />
        <StatsCard
          title="VECC Price"
          value="$4.28"
          change="5.2%"
          trend="up"
          icon={<img src={PriceIcon} alt="Price" className={styles.Icon} />}
        />
        <StatsCard
          title="DAO Members"
          value="8,742"
          change="3.7%"
          trend="up"
          icon={<img src={MembersIcon} alt="Members" className={styles.Icon} />}
        />
      </div>
      <div className={styles.wrapTab}>
        <TabLoan />
      </div>
    </div>
  );
};
