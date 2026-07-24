"use client";

import { useEffect, useState } from "react";
import { createClientUPProvider } from "@lukso/up-provider";

export interface GridWalletState {
  // The visitor who one-click-connected via the parent Grid page.
  connectedAddress: `0x${string}` | null;
  // The profile whose Grid this Mini-App is embedded in.
  gridProfileAddress: `0x${string}` | null;
}

// Grid-embedded connection path only (Handbook Step 4.3). A Mini-App can't
// call eth_requestAccounts directly - the parent page brokers the connection,
// so this just listens for the events up-provider emits once it's connected.
export function useGridWallet(enabled: boolean): GridWalletState {
  const [connectedAddress, setConnectedAddress] =
    useState<`0x${string}` | null>(null);
  const [gridProfileAddress, setGridProfileAddress] =
    useState<`0x${string}` | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let provider: ReturnType<typeof createClientUPProvider>;
    try {
      provider = createClientUPProvider();
    } catch (err) {
      // If the Grid-connection provider can't initialize (e.g. unusual
      // iframe sandboxing), fail quietly rather than crashing the app -
      // the person just won't get an auto-detected profile or one-click
      // connect, which is recoverable, unlike a full page crash.
      console.error("Grid provider failed to initialize:", err);
      return;
    }

    const updateAccounts = (accounts: `0x${string}`[]) => {
      setConnectedAddress(accounts[0] ?? null);
    };
    const updateContextAccounts = (accounts: `0x${string}`[]) => {
      setGridProfileAddress(accounts[0] ?? null);
    };

    updateAccounts(provider.accounts as `0x${string}`[]);
    updateContextAccounts(provider.contextAccounts as `0x${string}`[]);

    provider.on("accountsChanged", updateAccounts);
    provider.on("contextAccountsChanged", updateContextAccounts);

    return () => {
      provider.removeListener("accountsChanged", updateAccounts);
      provider.removeListener(
        "contextAccountsChanged",
        updateContextAccounts
      );
    };
  }, [enabled]);

  return { connectedAddress, gridProfileAddress };
}
