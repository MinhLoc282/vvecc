import React from "react";
import styles from "./index.module.css";
export const ShareCard = ({
  title,
  company,
  quantity,
  value,
  interest,
  term,
  status,
}) => {
  return (
    <div className={styles.shareCard}>
      <div className={styles.shareCardHeader}>
        <h3 className={styles.title}>{title}</h3>
        <div
          className={`${status == "Public" ? styles.public : styles.private}`}
        >
          {status}
        </div>
      </div>
      <p className={styles.companyName}>{company}</p>

      <div className={styles.shareInfo}>
        <div className={styles.info}>
          Quantity: <span>{quantity} shares</span>
        </div>
        <div className={styles.info}>
          Value: <span>${value}</span>
        </div>
        <div className={styles.info}>
          Min. Interest<span>{interest}% APR</span>
        </div>
        <div className={styles.info}>
          Loan Term: <span>{term} days</span>
        </div>
      </div>

      <div className={styles.placeBid}>Place Bid</div>
    </div>
  );
};
