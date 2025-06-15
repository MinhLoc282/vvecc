import React from "react";
import { Link } from "react-router-dom";
import { ModeToggle } from "../ModeToggle/ModeToggle";
import { Logout } from "../Logout/Logout";
import styles from "../../layout/navbar/index.module.css";

export const AuthSection = ({ isLogin }) => {
  return (
    <div className={styles.navbarContentSecond}>
      <ModeToggle />
      {isLogin ? (
        <Logout />
      ) : (
        <div className={styles.buttonConnect}>
          <Link to="/login">Log In</Link>
        </div>
      )}
    </div>
  );
};
