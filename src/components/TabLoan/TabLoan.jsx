import React, { useState } from "react";
import styles from "./index.module.css";
import { ArrowRight, ArrowUpRight, Briefcase, LineChart, Share } from "lucide-react";
import { ShareCard } from "../ShareCard/ShareCard";
export const TabLoan = () => {
  const tabs = [
    { id: "marketplace", label: "Loan Marketplace" },
    { id: "collateral", label: "My Collateral" },
    { id: "loans", label: "My Loans" },
  ];
  const listings = [
    {
      title: "AAPL Shares",
      company: "Apple Inc.",
      quantity: 500,
      value: 92500,
      interest: 5.2,
      term: 90,
      status: "Public",
    },
    {
      title: "TSLA Shares",
      company: "Tesla Inc.",
      quantity: 200,
      value: 43600,
      interest: 6.8,
      term: 60,
      status: "Public",
    },
    {
      title: "Acme Startup",
      company: "Series B Shares",
      quantity: 50000,
      value: 250000,
      interest: 8.5,
      term: 180,
      status: "Private",
    },
  ];
  const [activeTab, setActiveTab] = useState("marketplace");
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
        {activeTab === "marketplace" && (
          <div className={styles.tab}>
            <div className={styles.wrapShare}>
              {listings.map((item, index) => (
                <ShareCard key={index} {...item} />
              ))}
            </div>
            <div className={styles.viewAll}>
              <p className={styles.viewButton}>
                View All Listings
                <ArrowUpRight className={styles.arrowIcon} />
              </p>
            </div>
          </div>
        )}
        {activeTab === "collateral" && (
          <div className={styles.wrapCol}>
            <div className={styles.wrapIcon}>
              <Briefcase className={styles.IconBrief} />
            </div>
            <h3 className={styles.titleCol}>No Collateral Added Yet</h3>
            <p className={styles.contentCol}>
              Add your public or private equity holdings as collateral to start
              borrowing against your assets.
            </p>
            <div className={styles.primaryButton}>Add Collateral</div>
          </div>
        )}
        {activeTab === "loans" && (
          <div className={styles.wrapCol}>
            <div className={styles.wrapIcon}>
              <LineChart className={styles.IconBrief} />
            </div>
            <h3 className={styles.titleCol}>No Active Loans</h3>
            <p className={styles.contentCol}>
              You don't have any active loans. Browse the marketplace to find
              borrowers or add collateral to start borrowing.
            </p>
            <div className={styles.wrapButton}>
              <div className={styles.browButton}>Browse Marketplace</div>
              <div className={styles.primaryButton}>Add Collateral</div>
            </div>
          </div>
        )}
      </div>
      <div className={styles.wrapVECC}>
        <h2 className={styles.textWork}>How VECC Works</h2>
        <div className={styles.wrapWork}>
          <div className={styles.wrapBox}>
            <h3 className={styles.title}>Collateralize Assets</h3>
            <p className={styles.content}>
              Tokenize and pledge your public or private equity holdings as
              collateral to access liquidity without selling your assets.
            </p>
          </div>

          <div className={styles.wrapBox}>
            <h3 className={styles.title}>Participate in Auctions</h3>
            <p className={styles.content}>
              Lenders compete in free-market loan auctions to offer the best
              rates, creating a transparent and efficient marketplace.
            </p>
          </div>

          <div className={styles.wrapBox}>
            <h3 className={styles.title}>Trade Loan NFTs</h3>
            <p className={styles.content}>
              Loan positions are tokenized as NFTs that can be traded on the
              secondary market, providing additional liquidity options.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
