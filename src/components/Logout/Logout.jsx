import React, { useState } from "react";
import { useAuth } from "../../hooks/use-auth-client";
import Modal from "react-modal";
import styles from "./index.module.css";
import useClickOutSide from "../../hooks/useClickOutSide";
import { BarChart2, Briefcase, CreditCard, Menu, Wallet } from "lucide-react";
import zIndex from "@mui/material/styles/zIndex";
import { Link } from "react-router-dom";
export const Logout = () => {
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
  const { account, logout, contracts, isAdmin } = useAuth();

  const { show, setShow, nodeRef } = useClickOutSide();

  const [modalIsOpen, setIsOpen] = useState(false);

  const formatAddress = (address) => {
    if (!address) return "Loading...";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }
  return (
    <div className={styles.wrapContainer} ref={nodeRef}>
      <div className={styles.Container}>
        <button className={styles.buttonToggle} onClick={() => setShow(!show)}>
          <Wallet className={styles.IconWallet} />
          <p className={styles.Address}>{formatAddress(account)}</p>
        </button>
        {show && (
          <div className={styles.dropdown}>
            <button
              className={styles.buttonToggleMyAccount}
              onClick={logout}
              aria-label="Logout"
            >
              My Account
            </button>
            <button className={styles.buttonToggleIcon}>
              <Briefcase className={styles.IconDropdown} />
              Portfolio
            </button>
            <button className={styles.buttonToggleIcon}>
              <BarChart2 className={styles.IconDropdown} />
              Analytics
            </button>
            <button className={styles.buttonToggleIcon}>
              <CreditCard className={styles.IconDropdown} />
              Transactions
            </button>
            <button className={styles.buttonToggleIcon} onClick={logout}>
              Disconnect
            </button>
          </div>
        )}
      </div>
      <button className={styles.buttonMenu} onClick={openModal}>
        <Menu className={styles.IconWallet} />
      </button>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Example Modal"
        className={styles.Modal}
      >
        <div className={styles.ModalForm}>
          <div className={styles.buttonClose} onClick={closeModal}>
            x
          </div>
          <div>
            <nav className={styles.navLinks}>
              <Link to="/" className={styles.navItem}>
                Dashboard
              </Link>
              <Link to="/marketplace" className={styles.navItem}>
                Marketplace
              </Link>
              <Link to="/my-collateral" className={styles.navItem}>
                My Collateral
              </Link>
              <Link to="/my-loans" className={styles.navItem}>
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
        </div>
      </Modal>
    </div>
  );
};
