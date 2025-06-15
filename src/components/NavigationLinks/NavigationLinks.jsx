import { Link, useLocation } from "react-router-dom";
import styles from "../../layout/navbar/index.module.css";

export const NavigationLinks = () => {
  const location = useLocation();
  
  const isActiveLink = (path) => location.pathname === path;

  const navigationItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/loan-marketplace", label: "Marketplace" },
    { path: "/nft-marketplace", label: "NFT Marketplace" },
    { path: "/my-loan", label: "My Loans" },
  ];

  return (
    <nav className={styles.navLinks}>
      {navigationItems.map(({ path, label }) => (
        <Link
          key={path}
          to={path}
          className={`${styles.navItem} ${
            isActiveLink(path) ? styles.activeNavItem : ""
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
};
