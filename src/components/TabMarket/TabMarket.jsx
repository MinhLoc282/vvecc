import React, { useState } from "react";
import styles from "./index.module.css";
import LoanMarketplacePage from "../../pages/loan/LoanMarketplacePage";
import MarketPlace from "../MarketPlace/MarketPlace";
export const TabMarket = () => {
  const tabs = [
    { id: "Active", label: "Active Listings" },
    { id: "Complete", label: "Completed" },
    { id: "Bid", label: "My Bids" },
  ];
  const [activeTab, setActiveTab] = useState("Active");
  return (
    <div className={styles.wrapTabContainer}>
      <div className={styles.wrapTab}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`${styles.tab} ${
              activeTab === tab.id ? styles.active : styles.inactive
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>
      <div className={styles.wrapContent}>
        {activeTab === "Bid" && <MarketPlace />}
        {/* <LoanMarketplacePage /> */}
      </div>
    </div>
  );
};
