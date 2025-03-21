import React, { useEffect, useState } from "react";
import { Link, useOutletContext, useLocation } from "react-router-dom";
import Logo from "../../assets/logo.png";
import { useAuth } from "../../hooks/use-auth-client";

import { ModeToggle } from "../../components/ModeToggle/ModeToggle";
import styles from "./index.module.css";
import { Logout } from "../../components/Logout/Logout";

export default function Navbar() {
  const { isAuthenticated, login, isAdmin, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    login();
    logout();
  }, []);

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.navbarContentFirst}>
          <Link to="/" className={styles.logo}>
            <img className={styles.logo} src={Logo} alt="logo" />
          </Link>

          <nav className={styles.navLinks}>
            <Link to="/dashboard" className={`${styles.navItem} ${isActiveLink('/dashboard') ? styles.activeNavItem : ''}`}>
              Dashboard
            </Link>
            <Link to="/loan-marketplace" className={`${styles.navItem} ${isActiveLink('/loan-marketplace') ? styles.activeNavItem : ''}`}>
              Marketplace
            </Link>
            <Link to="/nft-marketplace" className={`${styles.navItem} ${isActiveLink('/nft-marketplace') ? styles.activeNavItem : ''}`}>
              NFT Marketplace
            </Link>
            <Link to="/my-loan" className={`${styles.navItem} ${isActiveLink('/my-loan') ? styles.activeNavItem : ''}`}>
              My Loans
            </Link>
            
          
          </nav>
        </div>

        <div className={styles.navbarContentSecond}>
          <ModeToggle />
          {isAuthenticated ? (
            <Logout />
          ) : (
            <div className={styles.buttonConnect} onClick={login}>
              Connect
            </div>
          )}
        </div>
      </div>
    </div>
  );
}