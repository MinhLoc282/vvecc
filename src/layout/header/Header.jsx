import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth-client';
import LoggedIn from '../../components/LoggedStatus/LoggedIn';
import LoggedOut from '../../components/LoggedStatus/LoogedOut';
import NavigationContainer from '../../components/NavigationSection/NavigationSection';
import Logo from '../../assets/logo.png';
import styles from './index.module.css';

function LoginButton() {
  return (
    <div
      className={styles.LoginButton}
      style={{
        width: 30,
        height: 28,
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 7,
        paddingBottom: 7,
        background: '#236CB2',
        borderRadius: 6,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        display: 'inline-flex',
        position: 'relative',
      }}
    >
      <div style={{ width: 16, height: 16, position: 'relative' }}>
        <svg className={styles.LoginIcon} width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.99998 8.66665C8.36817 8.66665 8.66665 8.36817 8.66665 7.99998C8.66665 7.63179 8.36817 7.33331 7.99998 7.33331C7.63179 7.33331 7.33331 7.63179 7.33331 7.99998C7.33331 8.36817 7.63179 8.66665 7.99998 8.66665Z" stroke="#9C9EAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12.6667 8.66665C13.0349 8.66665 13.3333 8.36817 13.3333 7.99998C13.3333 7.63179 13.0349 7.33331 12.6667 7.33331C12.2985 7.33331 12 7.63179 12 7.99998C12 8.36817 12.2985 8.66665 12.6667 8.66665Z" stroke="#9C9EAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3.33335 8.66665C3.70154 8.66665 4.00002 8.36817 4.00002 7.99998C4.00002 7.63179 3.70154 7.33331 3.33335 7.33331C2.96516 7.33331 2.66669 7.63179 2.66669 7.99998C2.66669 8.36817 2.96516 8.66665 3.33335 8.66665Z" stroke="#9C9EAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{
        width: 94, height: 44, left: 0, top: 13, position: 'absolute', background: 'rgba(126.44, 135.01, 255, 0.80)', boxShadow: '50px 50px 50px ', borderRadius: 9999, filter: 'blur(50px)',
      }}
      />
    </div>
  );
}

function Header() {
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Không cần useEffect để auto-login, để user tự click

  return (
    <div className={styles.AuthSection}>
      <div className={styles.LeftContainer}>
        <img height={36} src={Logo} alt="logo" />
        <div className={styles.DesktopNav}>
          <NavigationContainer />
          <div className={styles.DesktopAuthButtons}>
            {isAuthenticated ? <LoggedIn /> : <LoggedOut />}
            {/* <LoginButton /> */}
          </div>
        </div>
      </div>

      <button
        type="button"
        className={styles.HamburgerButton}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`${styles.MobileMenu} ${isMenuOpen ? styles.MenuOpen : ''}`}>
        <NavigationContainer isMenuOpen={isMenuOpen} />
        <div className={styles.MobileAuthButtons}>
          {isAuthenticated ? <LoggedIn /> : <LoggedOut />}
          <LoginButton />
        </div>
      </div>
    </div>
  );
}

export default Header;
