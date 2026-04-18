/**
 * components/ExtensionGuard.jsx
 *
 * Renders children normally if the extension is installed.
 * If not installed, renders an inline block error with a download CTA.
 *
 * Usage:
 *   <ExtensionGuard>
 *     <button onClick={handleJoinRanked}>Join Ranked Party</button>
 *   </ExtensionGuard>
 */

import React from 'react';
import { useAlgoMindExtension } from '../../hooks/useAlgoMindExtension';
import styles from './ExtensionGuard.module.css';

// Replace this URL with the actual Chrome Web Store URL once published
const EXTENSION_DOWNLOAD_URL =
  'https://chrome.google.com/webstore/detail/algomind-fair-play/PLACEHOLDER_ID';

export default function ExtensionGuard({ children }) {
  const { extensionInstalled, checking } = useAlgoMindExtension();

  if (checking) {
    return (
      <div className={styles.checking}>
        <span className={styles.spinner}></span>
        <span>Checking extension…</span>
      </div>
    );
  }

  if (!extensionInstalled) {
    return (
      <div className={styles.guard}>
        <div className={styles.icon}>🛡️</div>
        <div className={styles.content}>
          <p className={styles.title}>AlgoMind Fair Play Required</p>
          <p className={styles.desc}>
            Ranked Code Party requires the AlgoMind browser extension for fair play enforcement.
          </p>
          <a
            id="algomind-extension-install-btn"
            href={EXTENSION_DOWNLOAD_URL}
            target="_blank"
            rel="noreferrer"
            className={styles.installBtn}
          >
            ⬇️ Install Extension
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
