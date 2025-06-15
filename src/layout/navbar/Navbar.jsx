import { useLocation } from "react-router-dom";
import Loading from "../../components/Loading/Loading";
import styles from "./index.module.css";
import {
  WalletConnectionModal,
  NavigationLinks,
  AuthSection,
  NavbarLogo,
  AuthPageNavbar,
} from "../../components";
import useTheme from "../../hooks/useTheme";
import { useWalletConnection } from "../../hooks/navbar/useWalletConnection";

export default function Navbar() {
  const location = useLocation();
  const { theme } = useTheme({});

  const isDarkMode = theme === "dark";

  const {
    showWalletModal,
    isConnecting,
    registeredWallet,
    isProcessingConnection,
    isLoadingWalletInfo,
    isLogin,
    handleConnectWallet,
  } = useWalletConnection();

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/kyc";

  // Show loading when checking wallet info
  if (isLoadingWalletInfo && isLogin && !isAuthPage) {
    return <Loading />;
  }

  if (isAuthPage) {
    return <AuthPageNavbar />;
  }

  return (
    <div className={`${styles.navbar} ${isDarkMode ? styles.dark : ""}`}>
      <div className={styles.container}>
        <NavbarLogo />
        <NavigationLinks />
        <AuthSection isLogin={isLogin} />
      </div>

      <WalletConnectionModal
        showWalletModal={showWalletModal}
        isLogin={isLogin}
        isAuthPage={isAuthPage}
        registeredWallet={registeredWallet}
        isProcessingConnection={isProcessingConnection}
        isConnecting={isConnecting}
        handleConnectWallet={handleConnectWallet}
      />
    </div>
  );
}
