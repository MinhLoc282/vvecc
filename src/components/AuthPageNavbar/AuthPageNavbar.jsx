import { Link } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { ModeToggle } from "../ModeToggle/ModeToggle";
import LogoLight from "../../assets/logo-light.svg";
import LogoDark from "../../assets/logo-dark.svg";
import useTheme from "../../hooks/useTheme";
import styles from "../../layout/navbar/index.module.css";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export const AuthPageNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";

  // Determine which logo to use based on theme
  const logoSrc = isDarkMode ? LogoDark : LogoLight;

  // Check if current page is login page
  const isLoginPage = location.pathname === "/login";

  return (
    <div className={`${styles.navbar} ${isDarkMode ? styles.dark : ""}`}>
      <div className={`${styles.container}`}>
        {!isLoginPage ? (
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            <ArrowBackIcon />
          </button>
        ) : (
          <div />
        )}
        {/* logo with dark mode support */}
        <Link to="/" className={styles.logo}>
          <img className={styles.logoImage} src={logoSrc} alt="logo" />
        </Link>
        <div className="w-full flex justify-end">
          <ModeToggle />
        </div>
      </div>
    </div>
  );
};
