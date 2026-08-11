import ERC725 from "@erc725/erc725.js";
import { LSP1Schema } from "@erc725/erc725.js/schemas";
import { RPC_URL, luksoClient } from "./luksoClient";

// Retrieves the LSP1 Universal Receiver Delegate address for a profile, if
// one is set. Returns null if not set - a normal, expected case, not an error.
export async function getUniversalReceiverDelegate(
  address: string
): Promise<string | null> {
  const erc725 = new ERC725(LSP1Schema, address, RPC_URL, {});

  try {
    const result = await erc725.getData("LSP1UniversalReceiverDelegate");
    const value = result.value as string | null;
    if (!value || value === "0x0000000000000000000000000000000000000000") {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

// Checks whether a configured delegate address actually implements the
// LSP1UniversalReceiverDelegate interface (via ERC165 supportsInterface) -
// not just "has some contract code." Since this code runs automatically
// whenever the profile receives assets or notifications, an address that
// merely happens to have code (but doesn't implement the expected
// interface at all) is just as worth flagging as one with no code -
// "has any contract code" was too weak a bar on its own. Deliberately
// checks for contract code first: calling supportsInterface on a plain
// wallet (EOA) address isn't a real ERC165 check and would otherwise throw
// on ABI-decoding an empty eth_call result, rather than the graceful
// "doesn't implement it" answer this should give.
export async function delegateImplementsInterface(
  address: string
): Promise<boolean> {
  const bytecode = await luksoClient.getCode({
    address: address as `0x${string}`,
  });
  if (!bytecode || bytecode === "0x") return false;

  try {
    return await ERC725.supportsInterface("LSP1UniversalReceiverDelegate", {
      address,
      rpcUrl: RPC_URL,
    });
  } catch {
    return false;
  }
}
