import { Outlet } from "react-router-dom";
import styles from "./index.module.css";
import Navbar from "./navbar/Navbar";

import useTheme from "../hooks/useTheme";

function Layout() {
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";
  return (
    <div>
      <Navbar />

      <div className={`${styles.Outlet} ${isDarkMode ? styles.dark : ""}`}>
        <Outlet  />
      </div>
    </div>
  );
}

export default Layout;
