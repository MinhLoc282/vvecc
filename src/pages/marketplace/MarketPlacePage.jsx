import React, { useState } from "react";
import styles from "./index.module.css";
import { ArrowUpDown, Check, ChevronDown, Filter, Search } from "lucide-react";
import useClickOutSide from "../../hooks/useClickOutSide";
import { TabLoan } from "../../components/TabLoan/TabLoan";
import { TabMarket } from "../../components/TabMarket/TabMarket";
import useTheme from "../../hooks/useTheme";

const options = [
  "All Assets",
  "Public Equity",
  "Private Equity",
  "Crypto Assets",
];

export const CustomSelect = () => {
  const { show, setShow, nodeRef } = useClickOutSide();
  const [selected, setSelected] = useState(options[0]);
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";

  const handleSelect = (option) => {
    setSelected(option);
    setShow(false);
  };

  return (
    <div className={styles.selectWrapper} ref={nodeRef}>
      <button className={styles.selectButton} onClick={() => setShow(!show)}>
        {selected}
        <ChevronDown className={styles.iconChevron} />
      </button>

      {show && (
        <div className={styles.dropdown}>
          {options.map((option) => (
            <div
              key={option}
              className={`${styles.option} ${
                selected === option ? styles.selected : ""
              }`}
              onClick={() => handleSelect(option)}
            >
              {selected === option && <Check className={styles.iconCheck} />}
              <p className={styles.option}>{option}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export const MarketPlacePage = () => {
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";

  return (
    <div className={`${styles.wrapContainer} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.container}>
        <div className={styles.wrapFirstContent}>
          <div className={styles.content}>
            <h1 className={styles.title}>Loan Marketplace</h1>
            <p className={styles.subtitle}>
              Browse and bid on collateralized loan opportunities
            </p>
          </div>
          {/* <div className={styles.primaryButton}>Create Loan Listing</div> */}
        </div>

        <div className={styles.wrapSecondContent}>
          <div className={styles.containerBox}>
            <div className={styles.box}>
              <div className={styles.wrapInput}>
                <Search className={styles.iconSearch} />
                <input
                  type="text"
                  placeholder="Search by stock name"
                  className={styles.input}
                />
              </div>
              <div className={styles.wrapButton}>
                <CustomSelect />
                <div className={styles.buttonFilter}>
                  <Filter className={styles.iconFilter} />
                  Filter
                </div>
                <div className={styles.buttonFilter}>
                  <ArrowUpDown className={styles.iconFilter} />
                  Soft
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.wrapThirdContent}>
          <TabMarket />
        </div>
      </div>
    </div>
  );
};
