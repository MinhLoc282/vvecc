import { Link } from "react-router-dom";
import LogoLight from "../../assets/logo-light.svg";
import LogoDark from "../../assets/logo-dark.svg";
import useTheme from "../../hooks/useTheme";
import styles from "../../layout/navbar/index.module.css";

export const NavbarLogo = () => {
  const { theme } = useTheme({});
  const Logo = theme === "dark" ? LogoDark : LogoLight;

  return (
    <Link to="/" className={styles.logo}>
      <img className={styles.logo} src={Logo} alt="logo" />
    </Link>
  );
};
