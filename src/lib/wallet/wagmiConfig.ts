import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  universalProfilesWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { lukso } from "wagmi/chains";

// Falls back to a placeholder so builds and prerendering succeed even
// before a real key is configured - RainbowKit throws at init time if this
// is empty, not just later when someone actually tries to connect. Without
// a real project ID, the desktop extension connection path still works;
// only WalletConnect/UP Mobile connection needs the real value.
const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "00000000000000000000000000000000";

// The universalProfilesWallet connector is LUKSO's own RainbowKit
// integration and is, per LUKSO's official docs, the only supported way to
// connect the UP Mobile app to a dApp - the injected window.lukso/
// window.ethereum approach used elsewhere in this project cannot reach it
// at all. injectedWallet is included alongside it so desktop users with
// the UP Browser Extension (or any other injected wallet) keep working
// through the same unified connection flow.
const connectors = connectorsForWallets(
  [
    {
      groupName: "Universal Profile",
      wallets: [universalProfilesWallet, injectedWallet],
    },
  ],
  {
    appName: "UP Health",
    projectId: WALLETCONNECT_PROJECT_ID,
  }
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [lukso],
  transports: {
    [lukso.id]: http(),
  },
  ssr: true,
});
