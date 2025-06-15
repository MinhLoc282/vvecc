import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Modal from "react-modal";
import { BarChart2, Briefcase, CreditCard, Menu, Wallet } from "lucide-react";
import { useAuth } from "../../hooks/use-auth-client";
import useClickOutSide from "../../hooks/useClickOutSide";
import useTheme from "../../hooks/useTheme";
import styles from "./index.module.css";
import Loading from "../Loading/Loading";

import WalletLight from "../../assets/wallet-light.svg";
import WalletDark from "../../assets/wallet-dark.svg";

export const Logout = () => {
  const { account, logout, contracts, isAdmin, completeLogout, isDisconnecting } = useAuth();
  const { show, setShow, nodeRef } = useClickOutSide();
  const [modalIsOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";

  const customStyles = {
    content: {
      position: "fixed",
      top: "0px",
      right: "0px",
      zIndex: "1000000000",
      width: "75%",
      height: "100%",
      backgroundColor: "hsl(var(--background))",
    },
    overlay: {
      position: "fixed",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 1000,
    },
  };

  const formatAddress = (address) => {
    if (!address) return "Loading...";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const isActiveLink = (path) => location.pathname === path;

  const menuItems = [
    { icon: Briefcase, label: "Portfolio" },
    { icon: BarChart2, label: "Analytics" },
    { icon: CreditCard, label: "Transactions" },
  ];

  const adminLinks = [
    { to: "/admin-dashboard", label: "Admin Dashboard" },
    { to: "/admin-user-management", label: "Admin Management" },
  ];

  const navLinks = [
    { to: "/", label: "Dashboard" },
    { to: "/marketplace", label: "Marketplace" },
    { to: "/my-loan", label: "My Loans" },
  ];
  return (
    <div className={`${styles.wrapContainer} ${isDarkMode ? styles.dark : ""}`} ref={nodeRef}>
      <div className={styles.Container}>
        {/* Main wallet button */}
        <button className={`${styles.buttonToggle} ${isDarkMode ? styles.dark : ""}`} onClick={() => setShow(!show)}>
          <img
            src={isDarkMode ? WalletDark : WalletLight}
            alt="Wallet"
            className={styles.IconWallet}
          />
          <p className={styles.Address}>{formatAddress(account)}</p>
        </button>

        {/* Dropdown menu */}
        {show && (
          <div className={styles.dropdown}>          
            {/* Menu items */}
            {menuItems.map(({ icon: Icon, label }) => (
              <button key={label} className={styles.buttonToggleIcon}>
                <Icon className={styles.IconDropdown} />
                {label}
              </button>
            ))}

            {/* Admin links */}
            {isAdmin && adminLinks.map(({ to, label }) => (
              <button key={to} className={styles.buttonToggleIcon}>
                <Link
                  to={to}
                  className={`${styles.navItem} ${
                    isActiveLink(to) ? styles.activeNavItem : ""
                  }`}
                >
                  {label}
                </Link>
              </button>
            ))}

            {/* Action buttons */}
            <button className={styles.buttonToggleIcon} onClick={() => {
              logout()
              setShow(false);
            }}>
              Disconnect
            </button>
            <button
              className={styles.buttonToggleIcon}
              onClick={completeLogout}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Mobile menu button */}
      <button className={styles.buttonMenu} onClick={openModal}>
        <Menu className={styles.IconWallet} />
      </button>

      {/* Mobile modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Navigation Modal"
        className={styles.Modal}
      >
        <div className={styles.ModalForm}>
          <div className={styles.buttonClose} onClick={closeModal}>
            ×
          </div>
          <nav className={styles.navLinks}>
            {/* Regular nav links */}
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} className={styles.navItem}>
                {label}
              </Link>
            ))}

            {/* Admin nav links */}
            {isAdmin && adminLinks.map(({ to, label }) => (
              <Link key={to} to={to} className={styles.navItem}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </Modal>

      {/* Loading indicator */}
      {isDisconnecting && (
        <div className={styles.loadingOverlay}>
          <Loading />
        </div>
      )}
    </div>
  );
};
