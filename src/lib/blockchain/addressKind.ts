import ERC725 from "@erc725/erc725.js";
import { RPC_URL } from "./luksoClient";

export type AddressKind = "profile" | "vault" | "unknown";

// Determines whether an address is a Universal Profile (LSP0) or an LSP9
// Vault via standard ERC165 interface detection (Handbook Step 2.4) — no
// separate decoding logic needed, since Steps 2.1-2.3's permission-reading
// applies identically to both once we just need a label for display.
export async function getAddressKind(address: string): Promise<AddressKind> {
  const isProfile = await ERC725.supportsInterface("LSP0ERC725Account", {
    address,
    rpcUrl: RPC_URL,
  });
  if (isProfile) return "profile";

  const isVault = await ERC725.supportsInterface("LSP9Vault", {
    address,
    rpcUrl: RPC_URL,
  });
  if (isVault) return "vault";

  return "unknown";
}
