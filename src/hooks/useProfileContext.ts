"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWalletConnection } from "./useWalletConnection";
import { useGridWallet } from "./useGridWallet";
import { isEmbeddedInGrid } from "@/lib/wallet/gridDetection";

export interface ProfileContextState {
  isEmbedded: boolean;
  connectedAddress: `0x${string}` | null;
  // The profile currently being examined - from the Grid context, or from
  // whatever address was last submitted/connected in the standalone context.
  viewedAddress: string | null;
  // The live text in the input box - updates on every keystroke.
  manualAddressInput: string;
  setManualAddressInput: (value: string) => void;
  // Commits the current input text as the address to actually look up.
  submitManualAddress: () => void;
  connectStandaloneWallet: () => void;
  disconnectStandaloneWallet: () => Promise<void>;
  goToMyProfile: () => void;
  isConnecting: boolean;
  connectionError: string | null;
}

export function useProfileContext(): ProfileContextState {
  const isEmbedded = useMemo(() => isEmbeddedInGrid(), []);
  const standalone = useWalletConnection();
  const grid = useGridWallet(isEmbedded);

  const [manualAddressInput, setManualAddressInput] = useState("");
  const [submittedAddress, setSubmittedAddress] = useState<string | null>(
    null
  );

  const connectedAddress = isEmbedded
    ? grid.connectedAddress
    : standalone.connectedAddress;

  // In the Grid, the subject is always whichever Grid the app sits in.
  // Standalone: the last submitted/connected address wins, otherwise fall
  // back to the connected wallet's own address as a convenience.
  const viewedAddress = isEmbedded
    ? grid.gridProfileAddress
    : submittedAddress || connectedAddress;

  const submitManualAddress = useCallback(() => {
    setSubmittedAddress(manualAddressInput.trim());
  }, [manualAddressInput]);

  // Connecting a wallet (or wagmi silently restoring a previous session on
  // reload) is a clear signal of intent ("show me my own profile") - so
  // whenever the connected address changes to a new value, it replaces
  // whatever was typed or previously submitted. Reactive rather than tied
  // to the connect() call directly, since RainbowKit's connection flow
  // completes asynchronously via a modal, not as an awaitable return value.
  const previousConnectedRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      standalone.connectedAddress &&
      standalone.connectedAddress !== previousConnectedRef.current
    ) {
      setManualAddressInput(standalone.connectedAddress);
      setSubmittedAddress(standalone.connectedAddress);
    }
    previousConnectedRef.current = standalone.connectedAddress;
  }, [standalone.connectedAddress]);

  const goToMyProfile = useCallback(() => {
    if (connectedAddress) {
      setManualAddressInput(connectedAddress);
      setSubmittedAddress(connectedAddress);
    }
  }, [connectedAddress]);

  return {
    isEmbedded,
    connectedAddress,
    viewedAddress,
    manualAddressInput,
    setManualAddressInput,
    submitManualAddress,
    connectStandaloneWallet: standalone.connect,
    disconnectStandaloneWallet: standalone.disconnect,
    goToMyProfile,
    isConnecting: standalone.isConnecting,
    connectionError: standalone.error,
  };
}
