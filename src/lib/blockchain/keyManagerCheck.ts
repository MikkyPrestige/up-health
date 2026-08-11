import ERC725 from "@erc725/erc725.js";
import { luksoClient, RPC_URL } from "./luksoClient";

// Minimal ERC725Account ABI fragment - just enough to read the contract's
// actual owner() directly via viem, rather than assuming it.
const OWNER_ABI = [
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Determines whether a profile's actual owner() is a genuine LSP6 Key
// Manager contract - not just "some contract happens to be the owner."
// Every controller permission this tool (or anyone) reads out of
// AddressPermissions[] is only meaningful if a real Key Manager is the one
// enforcing it. If owner() instead points to a different kind of contract,
// a plain wallet, or the zero address, none of that permission data is
// actually being enforced by anything - whatever currently owns the profile
// can act on it directly, regardless of what the permission data says.
export async function isControlledByKeyManager(
  profileAddress: string
): Promise<boolean> {
  const owner = await luksoClient.readContract({
    address: profileAddress as `0x${string}`,
    abi: OWNER_ABI,
    functionName: "owner",
  });

  if (!owner || owner.toLowerCase() === ZERO_ADDRESS) return false;

  const ownerCode = await luksoClient.getCode({ address: owner });
  if (!ownerCode || ownerCode === "0x") return false;

  return ERC725.supportsInterface("LSP6KeyManager", {
    address: owner,
    rpcUrl: RPC_URL,
  });
}
