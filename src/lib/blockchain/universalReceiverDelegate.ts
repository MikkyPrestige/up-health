import ERC725 from "@erc725/erc725.js";
import { LSP1Schema } from "@erc725/erc725.js/schemas";
import { RPC_URL } from "./luksoClient";

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
