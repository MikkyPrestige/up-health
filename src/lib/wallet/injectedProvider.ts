import type { EIP1193Provider } from "viem";

declare global {
  interface Window {
    lukso?: EIP1193Provider;
    ethereum?: EIP1193Provider;
  }
}

// The UP Browser Extension injects itself as window.lukso, with window.ethereum
// as an equivalent EIP-1193 fallback (LUKSO's own documented pattern). This is
// the standalone-context connection path only (Handbook Step 3.1) — the
// Grid-embedded path via @lukso/up-provider is separate, built in Phase 4.
export function getInjectedProvider(): EIP1193Provider | null {
  if (typeof window === "undefined") return null;
  return window.lukso ?? window.ethereum ?? null;
}
