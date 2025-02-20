import React, { useEffect, useState } from 'react';

import { useAuth } from '../../hooks/use-auth-client';

import styles from './index.module.css';

function LoggedIn() {
  const {
    account, logout, contracts
  } = useAuth();

  const [showDropdown, setShowDropdown] = useState(false);
  
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const formatAddress = (address) => {
    if (!address) return 'Loading...';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          width: 127,
          height: 42,
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
          alignSelf: 'center',
          cursor: 'pointer',
        }}
        aria-hidden="true"
        onClick={toggleDropdown}
        className={`button ${showDropdown ? 'show' : ''}`}
      >
        <div style={{
          color: '#FFFFFF',
          fontSize: 15,
          fontFamily: 'Inter',
          fontWeight: '600',
          lineHeight: 20,
          wordWrap: 'break-word',
        }}
        >
          {formatAddress(account)}
        </div>
        <div style={{
          width: 94,
          height: 44,
          left: 0,
          top: 13,
          position: 'absolute',
          background: 'rgba(126.44, 135.01, 255, 0.80)',
          boxShadow: '50px 50px 50px ',
          borderRadius: 9999,
          filter: 'blur(50px)',
        }}
        />
      </div>

      <div className={`${styles.Dropdown} ${showDropdown ? styles.Show : ''}`}>
        <div className={styles.TextConainer}>
          <strong>Address:</strong>
          <span className={styles.AccountID}>{account}</span>
        </div>

        <div className={styles.TextConainer}>
          <strong>Network:</strong>
          <span>{contracts?.swapActor?._network?.name || 'Unknown'}</span>
        </div>
        
        <button type="button" id="logout" onClick={logout}>
          Disconnect
        </button>
      </div>
    </div>
  );
}

export default LoggedIn;
