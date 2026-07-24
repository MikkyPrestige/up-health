import { luksoClient } from "./luksoClient";

// Basic "is this a contract or a regular wallet" fact for a controller
// address (Handbook Step 3.3). Deliberately simple — true multisig-pattern
// recognition is out of scope for this release (Proposal Section 8).
export async function isContractAddress(address: string): Promise<boolean> {
  const bytecode = await luksoClient.getCode({
    address: address as `0x${string}`,
  });
  return Boolean(bytecode && bytecode !== "0x");
}
