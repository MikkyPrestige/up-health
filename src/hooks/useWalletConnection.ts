"use client";

import { useCallback, useEffect, useState } from "react";
import { getInjectedProvider } from "@/lib/wallet/injectedProvider";

export interface WalletConnectionState {
  connectedAddress: `0x${string}` | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<`0x${string}` | null>;
  disconnect: () => Promise<void>;
}

// Standalone-context wallet connection only (Handbook Step 3.1). This is
// deliberately minimal: knowing the connected address is all this phase
// needs — the Grid-embedded path and unifying both paths is Phase 4's job.
export function useWalletConnection(): WalletConnectionState {
  const [connectedAddress, setConnectedAddress] =
    useState<`0x${string}` | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount, check for an already-authorized connection without prompting.
  useEffect(() => {
    const provider = getInjectedProvider();
    if (!provider) return;

    provider
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        const [first] = accounts as string[];
        if (first) setConnectedAddress(first as `0x${string}`);
      })
      .catch(() => {
        // No prior authorization, or provider doesn't support this method —
        // this is a normal "not connected yet" state, not an error to surface.
      });

    const handleAccountsChanged = (accounts: unknown) => {
      const [first] = accounts as string[];
      setConnectedAddress((first as `0x${string}`) ?? null);
    };

    provider.on?.("accountsChanged", handleAccountsChanged);
    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    const provider = getInjectedProvider();
    if (!provider) {
      setError(
        "No Universal Profile Browser Extension (or compatible wallet) was found."
      );
      return null;
    }

    setIsConnecting(true);
    setError(null);
    try {
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });
      const [first] = accounts as string[];
      const address = (first as `0x${string}`) ?? null;
      setConnectedAddress(address);
      return address;
    } catch {
      setError("Connection request was rejected or could not be completed.");
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Clears the connection in our own app immediately - the part we fully
  // control. Also attempts the standard wallet_revokePermissions method
  // (EIP-2255) as best-effort progressive enhancement, since not every
  // wallet extension supports it yet; either way, this app stops treating
  // the wallet as connected the moment this runs.
  const disconnect = useCallback(async () => {
    const provider = getInjectedProvider();
    if (provider) {
      try {
        await provider.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch {
        // Not supported by this wallet, or the user's already revoked it -
        // either way, our own app-level disconnect below still applies.
      }
    }
    setConnectedAddress(null);
    setError(null);
  }, []);

  return { connectedAddress, isConnecting, error, connect, disconnect };
}
