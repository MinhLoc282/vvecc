import { Sun } from "lucide-react";
import useClickOutSide from "../../hooks/useClickOutSide";
import useTheme from "../../hooks/useTheme";
import styles from "./index.module.css";

export const ModeToggle = () => {
  const { theme, selectDark, selectLight, selectSystem } = useTheme({});
  const isDarkMode = theme === "dark";
  const { show, setShow, nodeRef } = useClickOutSide();

  const themeOptions = [
    { label: "Light", onClick: selectLight, ariaLabel: "Select Light Mode" },
    { label: "Dark", onClick: selectDark, ariaLabel: "Select Dark Mode" },
  ];

  return (
    <div
      className={`${styles.container} ${isDarkMode ? styles.dark : ""}`}
      ref={nodeRef}
    >
      <button 
        className={styles.buttonToggle} 
        onClick={() => setShow(!show)}
        aria-label="Toggle theme"
      >
        <Sun className={`${styles.icon} ${styles.sun}`} />
      </button>
      
      {show && (
        <div className={styles.dropdown}>
          {themeOptions.map(({ label, onClick, ariaLabel }) => (
            <button
              key={label}
              className={styles.buttonToggleIcon}
              onClick={onClick}
              aria-label={ariaLabel}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
