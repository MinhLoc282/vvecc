import React from "react";
import { Link, useLocation } from "react-router-dom";

import styles from "./index.module.css";
import { useAuth } from "../../hooks/use-auth-client";

function NavigationContainer({ isMenuOpen }) {
  const location = useLocation();
  const { isAdmin } = useAuth();

  return (
    <section
      className={`${styles.NavigationSection} ${
        isMenuOpen ? styles.MenuOpen : ""
      }`}
    >
      <section className={styles.NavigationInnerContainer}>
        {/* My Collateral */}
        <Link
          to={"/my-collateral"}
          className={
            location.pathname === "/my-collateral" ? styles.Active : ""
          }
        >
          My Collateral
        </Link>

        {/* Loan Marketplace */}
        <Link
          to={"/loan-marketplace"}
          className={
            location.pathname === "/loan-marketplace" ? styles.Active : ""
          }
        >
          Marketplace
        </Link>

        {/* My Loans */}
        <Link
          to={"/my-loans"}
          className={location.pathname === "/my-loans" ? styles.Active : ""}
        >
          My Loans
        </Link>

       

        {/* Admin Dashboard (Only visible to admins) */}
        {isAdmin && (
          <Link
            to={"/admin-dashboard"}
            className={
              location.pathname === "/admin-dashboard" ? styles.Active : ""
            }
          >
            Admin Dashboard
          </Link>
        )}

        {/* Admin User Management (Only visible to the owner) */}
        {isAdmin && (
          <Link
            to={"/admin-user-management"}
            className={
              location.pathname === "/admin-user-management"
                ? styles.Active
                : ""
            }
          >
            Admin Management
          </Link>
        )}
      </section>
    </section>
  );
}

export default NavigationContainer;
