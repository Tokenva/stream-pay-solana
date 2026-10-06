"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";

export default function WalletButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className="tokenva-wallet-button tokenva-wallet-button-disabled"
      >
        <span className="tokenva-wallet-dot" />
        Select Wallet
      </button>
    );
  }

  return (
    <div className="tokenva-wallet-button-wrapper">
      <WalletMultiButton className="tokenva-wallet-button" />
    </div>
  );
}