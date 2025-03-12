import React, { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import Logo from "../../assets/logo.png";
import { useAuth } from "../../hooks/use-auth-client";

import { ModeToggle } from "../../components/ModeToggle/ModeToggle";
import styles from "./index.module.css";
import { Logout } from "../../components/Logout/Logout";

export default function Navbar() {
  const { isAuthenticated, login, isAdmin, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    login();
    logout();
  }, []);

  return (
    <div className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.navbarContentFirst}>
          <Link to="/" className={styles.logo}>
            <img className={styles.logo} src={Logo} alt="logo" />
          </Link>

          <nav className={styles.navLinks}>
            <Link to="/" className={styles.navItem}>
              Dashboard
            </Link>
            <Link to="/loan-marketplace" className={styles.navItem}>
              Marketplace
            </Link>
            {/* <Link to="/my-collateral" className={styles.navItem}>
              My Collateral
            </Link>
            <Link to="/my-loans" className={styles.navItem}>
              My Loans
            </Link> */}
            <Link to="/my-loan" className={styles.navItem}>
              My Loans
            </Link>
            
            {isAdmin && (
              <Link to={"/admin-dashboard"} className={styles.navItem}>
                Admin Dashboard
              </Link>
            )}

            {/* Admin User Management (Only visible to the owner) */}
            {isAdmin && (
              <Link to={"/admin-user-management"} className={styles.navItem}>
                Admin Management
              </Link>
            )}
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
