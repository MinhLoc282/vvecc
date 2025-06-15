import styles from "./TabContainer.module.css";
import useTheme from "../../hooks/useTheme";

export const TabContainer = ({
  tabs,
  activeTab,
  onTabChange,
  children,
  className,
  gridColumns,
}) => {
  // Calculate the number of columns based on the gridColumns prop or the length of tabs
  const columns = gridColumns || tabs.length;

  // Use the custom theme hook to get the current theme
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";

  return (
    <div className={`${styles.wrapTabContainer} ${className || ""}`}>
      <div
        className={`${styles.wrapTab} ${isDarkMode ? styles.dark : ""}`}
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`${styles.tab} ${
              activeTab === tab.id ? styles.active : styles.inactive
            } ${isDarkMode ? styles.dark : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>
      <div className={styles.wrapContent}>{children}</div>
    </div>
  );
};
