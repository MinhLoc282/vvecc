import React from "react";
import useClickOutSide from "../../hooks/useClickOutSide";
import styles from "./index.module.css";
import useTheme from "../../hooks/useTheme";
import { Moon, Sun } from "lucide-react";

export const ModeToggle = () => {
  const { theme, selectDark, selectLight, selectSystem } = useTheme({});
  const { show, setShow, nodeRef } = useClickOutSide();
  return (
    <div
      className={`${styles.container} ${theme === "dark" ? "dark" : ""}`}
      ref={nodeRef}
    >
      <button className={styles.buttonToggle} onClick={() => setShow(!show)}>
        <Sun className={`${styles.icon} ${styles.sun}`} />
        <Moon className={`${styles.icon} ${styles.moon}`} />
      </button>
      {show && (
        <div className={styles.dropdown}>
          <button
            className={styles.buttonToggleIcon}
            onClick={selectLight}
            aria-label="Select Light Mode"
          >
            Light
          </button>
          <button
            className={styles.buttonToggleIcon}
            onClick={selectDark}
            aria-label="Select Dark Mode"
          >
            Dark
          </button>
          <button
            className={styles.buttonToggleIcon}
            onClick={selectSystem}
            aria-label="Select System Mode"
          >
            System
          </button>
        </div>
      )}
    </div>
  );
};
