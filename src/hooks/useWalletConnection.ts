"use client";

import { useCallback, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

export interface WalletConnectionState {
  connectedAddress: `0x${string}` | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => Promise<void>;
}

// Standalone-context wallet connection, backed by wagmi + RainbowKit.
// Uses RainbowKit's own universalProfilesWallet connector, which per
// LUKSO's official docs is the only supported way to connect the UP
// Mobile app to a dApp - a plain injected window.lukso/window.ethereum
// check (the previous approach here) can never reach it, since mobile
// browsers have no equivalent of a browser extension to inject a
// provider. Desktop extension users still connect through the same flow
// via the injectedWallet connector configured alongside it.
export function useWalletConnection(): WalletConnectionState {
  const { address, isConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    setError(null);
    if (!openConnectModal) {
      // RainbowKit hasn't finished initializing yet - vanishingly rare in
      // practice, but fail with a message rather than silently no-op.
      setError("Wallet connection isn't ready yet - please try again.");
      return;
    }
    openConnectModal();
  }, [openConnectModal]);

  // Clears the connection in our own app and in wagmi's own connector
  // state - this is a real disconnect (not just hiding local UI state),
  // since wagmi's disconnect() actually tears down the active connector
  // session.
  const disconnect = useCallback(async () => {
    try {
      await disconnectAsync();
    } catch {
      // Some connectors can throw on teardown (e.g. already disconnected
      // externally) - our own state below is what actually matters.
    }
    setError(null);
  }, [disconnectAsync]);

  return {
    connectedAddress: isConnected ? (address ?? null) : null,
    isConnecting: Boolean(connectModalOpen),
    error,
    connect,
    disconnect,
  };
}
