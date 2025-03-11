import React from "react";
import styles from "./index.module.css";
import { ArrowDown, ArrowUp } from "lucide-react";

export const StatsCard = ({ title, value, change, trend, icon }) => {
  return (
    <div className={styles.wrapCard}>
      <div className={styles.card}>
        <div className={styles.wrapFirstContent}>
          <div className={styles.wrapContent}>
            <p className={styles.title}>{title}</p>
            <h3 className={styles.value}>{value}</h3>
          </div>
          {icon && <div className={styles.iconWrapper}>{icon}</div>}
        </div>
        <div className={styles.trend}>
          {trend === "up" ? (
            <ArrowUp className={styles.trendIcon} />
          ) : trend === "down" ? (
            <ArrowDown className={styles.trendIcon} />
          ) : null}
          <span
            className={
              trend === "up"
                ? styles.trendUp
                : trend === "down"
                ? styles.trendDown
                : styles.trendNeutral
            }
          >
            {change}
          </span>
        </div>
      </div>
    </div>
  );
};
