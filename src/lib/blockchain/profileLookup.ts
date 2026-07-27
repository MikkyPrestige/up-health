import { isAddress } from "viem";
import ERC725 from "@erc725/erc725.js";
import { LSP6Schema } from "@erc725/erc725.js/schemas";
import { luksoClient, RPC_URL } from "./luksoClient";

export type ProfileLookupResult =
  | { status: "invalid_format" }
  | { status: "not_found"; reason: "no_code" | "unrecognized_contract" }
  | { status: "network_error"; message: string }
  | { status: "found"; controllers: `0x${string}`[] };

// Looks up the raw AddressPermissions[] controller list for a given address.
// Three distinct "nothing to show" outcomes are kept separate on purpose
// (Handbook Step 1.4): a malformed address, a well-formed address with no
// LUKSO profile data, and a genuine RPC/network failure each need their own
// message rather than collapsing into one generic error.
export async function getRawControllerAddresses(
  address: string
): Promise<ProfileLookupResult> {
  if (!isAddress(address)) {
    return { status: "invalid_format" };
  }

  let hasCode: boolean;
  try {
    const bytecode = await luksoClient.getCode({ address });
    hasCode = Boolean(bytecode && bytecode !== "0x");
  } catch (err) {
    // Failing here means the RPC endpoint itself couldn't be reached —
    // distinct from a successful read that simply finds no profile.
    return { status: "network_error", message: toErrorMessage(err) };
  }

  if (!hasCode) {
    // No contract code at all almost always means this is a plain wallet
    // (EOA) — a very common mix-up is pasting a controller/wallet address
    // instead of the Universal Profile it controls, so this gets its own
    // specific, more helpful message rather than the generic one below.
    return { status: "not_found", reason: "no_code" };
  }

  const erc725 = new ERC725(LSP6Schema, address, RPC_URL, {});

  try {
    const result = await erc725.getData("AddressPermissions[]");
    const controllers = Array.isArray(result.value)
      ? (result.value as `0x${string}`[])
      : [];
    return { status: "found", controllers };
  } catch {
    // Has contract code, but isn't a readable ERC725Y/LSP6 profile —
    // treated as "no Universal Profile or Vault found here," not a failure.
    return { status: "not_found", reason: "unrecognized_contract" };
  }
}

function toErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown network error";
}
