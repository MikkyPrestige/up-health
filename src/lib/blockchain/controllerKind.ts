import ERC725 from "@erc725/erc725.js";
import { RPC_URL } from "./luksoClient";

export type ControllerKind =
  | "profile"
  | "vault"
  | "delegate-contract"
  | "contract"
  | "wallet";

// Determines what a controller address actually is, beyond just "contract
// or wallet" (Handbook Step 3.3 covers that basic split). Controllers are
// often themselves Universal Profiles (e.g. a dedicated recovery profile) or
// well-known contract roles like an LSP1 Delegate - recognizing that reuses
// the exact same ERC165 pattern already used to identify the main profile.
export async function getControllerKind(
  address: string,
  hasCode: boolean
): Promise<ControllerKind> {
  if (!hasCode) return "wallet";

  const [isProfile, isVault, isDelegate] = await Promise.all([
    ERC725.supportsInterface("LSP0ERC725Account", {
      address,
      rpcUrl: RPC_URL,
    }),
    ERC725.supportsInterface("LSP9Vault", { address, rpcUrl: RPC_URL }),
    ERC725.supportsInterface("LSP1UniversalReceiverDelegate", {
      address,
      rpcUrl: RPC_URL,
    }),
  ]);

  if (isProfile) return "profile";
  if (isVault) return "vault";
  if (isDelegate) return "delegate-contract";
  return "contract";
}

export function controllerKindLabel(kind: ControllerKind): string {
  switch (kind) {
    case "profile":
      return "Universal Profile";
    case "vault":
      return "Vault";
    case "delegate-contract":
      return "LSP1 Delegate";
    case "contract":
      return "Contract";
    case "wallet":
      return "Wallet";
  }
}
