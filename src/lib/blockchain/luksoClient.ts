import { createPublicClient, defineChain, http } from "viem";

// LUKSO Mainnet isn't in viem's built-in chain list, so it's defined here directly.
export const RPC_URL =
  process.env.NEXT_PUBLIC_LUKSO_MAINNET_RPC_URL ??
  "https://rpc.mainnet.lukso.network";
const CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_LUKSO_MAINNET_CHAIN_ID ?? "42"
);

export const luksoMainnet = defineChain({
  id: CHAIN_ID,
  name: "LUKSO Mainnet",
  nativeCurrency: { name: "LYX", symbol: "LYX", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
});

export const luksoClient = createPublicClient({
  chain: luksoMainnet,
  transport: http(),
});
