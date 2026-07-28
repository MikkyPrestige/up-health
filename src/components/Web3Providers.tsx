"use client";

import { useState, useSyncExternalStore } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wallet/wagmiConfig";

// Brand accent matching --color-vital, kept in sync manually since
// RainbowKit's theme system takes plain color values, not CSS variables.
const VITAL_ACCENT = "#4fd8b0";

function subscribeToColorScheme(callback: () => void) {
  const query = window.matchMedia("(prefers-color-scheme: light)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getIsLightSnapshot() {
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}

function getIsLightServerSnapshot() {
  // Defaults to dark during SSR - re-synced automatically on the client
  // once useSyncExternalStore can actually read matchMedia.
  return false;
}

export function Web3Providers({ children }: { children: React.ReactNode }) {
  // Created once per app instance, not at module scope, so server-rendered
  // requests never share query cache across different users.
  const [queryClient] = useState(() => new QueryClient());

  // RainbowKit's theme prop is plain JS, not CSS - it doesn't follow the
  // OS preference automatically the way the rest of this app does via
  // prefers-color-scheme, so it's tracked here via useSyncExternalStore
  // (React's dedicated tool for subscribing to external browser APIs,
  // rather than manually syncing state from inside an effect).
  const isLight = useSyncExternalStore(
    subscribeToColorScheme,
    getIsLightSnapshot,
    getIsLightServerSnapshot
  );

  const theme = isLight
    ? lightTheme({ accentColor: VITAL_ACCENT, accentColorForeground: "#0d1210" })
    : darkTheme({ accentColor: VITAL_ACCENT, accentColorForeground: "#0d1210" });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
