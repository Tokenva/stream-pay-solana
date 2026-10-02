"use client";

import { useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

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
        className="rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white opacity-80"
      >
        Select Wallet
      </button>
    );
  }

  return <WalletMultiButton />;
}