"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

export default function AppWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // DYNAMIC NETWORK SELECTION
  // Default to Mainnet-beta unless explicitly set to devnet
  const networkEnv = process.env.NEXT_PUBLIC_SOLANA_NETWORK || process.env.NEXT_PUBLIC_NETWORK || 'mainnet-beta';
  const network = (networkEnv === 'devnet') 
    ? WalletAdapterNetwork.Devnet 
    : WalletAdapterNetwork.Mainnet;

  const endpoint = useMemo(() => {
    // 1. Priority: Custom RPC from Env (e.g. Helius)
    const customRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
    if (customRpc) {
        return customRpc;
    }
    
    // 2. Fallback: Public Cluster API (Not recommended for Mainnet production)
    return clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(
    () => [
      // Standard wallets are auto-detected by the adapter
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}