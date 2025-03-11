import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Header from "./header/Header";

import styles from "./index.module.css";
import Navbar from "./navbar/Navbar";

function Layout() {
  const [openMenu, setOpenMenu] = useState(false);


  return (
    <div>
      {/* <Header /> */}
      <Navbar />

      <div className={styles.Outlet}>
        <Outlet  />
      </div>
    </div>
  );
}

export default Layout;
