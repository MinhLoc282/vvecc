import styles from "./index.module.css";
import UpIcon from "../../assets/up.svg";
import DownIcon from "../../assets/down.svg";

import useTheme from "../../hooks/useTheme";

export const StatsCard = ({ title, value, change, trend, icon }) => {
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";

  return (
    <div className={`${styles.wrapCard} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.card}>
        <div className={styles.wrapFirstContent}>
          <div className={styles.wrapContent}>
            <p className={styles.title}>{title}</p>
            {icon && <div className={styles.iconWrapper}>{icon}</div>}
          </div>
          <h3 className={styles.value}>{value}</h3>
        </div>
        <div className={styles.trend}>
          {trend === "up" ? (
            <img src={UpIcon} alt="Up" className={styles.trendIcon} />
          ) : trend === "down" ? (
            <img src={DownIcon} alt="Down" className={styles.trendIcon} />
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
