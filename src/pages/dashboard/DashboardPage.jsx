import React from "react";
import styles from "./index.module.css";
import { HeroSection } from "../../components/HeroSection/HeroSection";
import { StatsCard } from "../../components/StatsCard/StatsCard";
import { BarChart3, Briefcase, TrendingUp, Users } from "lucide-react";
import { TabLoan } from "../../components/TabLoan/TabLoan";

export const DashboardPage = () => {
  return (
    <div className={styles.container}>
      <HeroSection />
      <div className={styles.wrapStatCard}>
        <StatsCard
          title="Total Value Locked"
          value="$24.8M"
          change="+12.5%"
          trend="up"
          icon={<BarChart3 className={styles.Icon} />}
        />
        <StatsCard
          title="Active Loans"
          value="1,284"
          change="+8.3%"
          trend="up"
          icon={<Briefcase className={styles.Icon} />}
        />
        <StatsCard
          title="VECC Price"
          value="$4.28"
          change="+5.2%"
          trend="up"
          icon={<TrendingUp className={styles.Icon} />}
        />
        <StatsCard
          title="DAO Members"
          value="8,742"
          change="+3.7%"
          trend="up"
          icon={<Users className={styles.Icon} />}
        />
      </div>
      <div className={styles.wrapTab}>
        <TabLoan />
      </div>
    </div>
  );
};
