import ERC725, { encodeKeyName } from "@erc725/erc725.js";
import { LSP6Schema } from "@erc725/erc725.js/schemas";
import { luksoClient } from "./luksoClient";
import { decodeCallTypes } from "../permissions/callTypes";
import { standardLabel } from "../permissions/knownStandards";

const ANY_ADDRESS = "0xffffffffffffffffffffffffffffffffffffffff";
const ANY_SELECTOR = "0xffffffff";

// Minimal ERC725Y ABI fragment - just enough to read a raw, undecoded data
// value directly, bypassing erc725.js's own fetch+decode combination.
const ERC725Y_GET_DATA_ABI = [
  {
    inputs: [{ name: "dataKey", type: "bytes32" }],
    name: "getData",
    outputs: [{ name: "dataValue", type: "bytes" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface AllowedCallEntry {
  callTypes: string[];
  address: string; // checksummed address, or "Any address"
  standard: string; // friendly name if recognized, "Any type", or raw hex
  function: string; // raw selector hex, or "Any function"
}

export interface ControllerRestrictions {
  allowedCalls: AllowedCallEntry[] | null; // null = not configured at all
  allowedDataKeyCount: number | null; // null = not configured at all
}

function decodeAllowedCallTuple(tuple: string[]): AllowedCallEntry {
  const [callTypesHex, address, standardHex, functionHex] = tuple;
  return {
    callTypes: decodeCallTypes(callTypesHex),
    address: address.toLowerCase() === ANY_ADDRESS ? "Any address" : address,
    standard:
      standardHex.toLowerCase() === ANY_SELECTOR
        ? "Any type"
        : standardLabel(standardHex),
    function:
      functionHex.toLowerCase() === ANY_SELECTOR
        ? "Any function"
        : functionHex,
  };
}

// Reads the raw, undecoded bytes at a dynamic ERC725Y data key directly via
// the contract's own getData(bytes32) function - deliberately bypassing
// erc725.js's higher-level fetch+decode combination. That combination
// throws internally (a known quirk in its decoder for this specific tuple/
// CompactBytesArray value type) whenever a key has nothing set on-chain at
// all, rather than gracefully returning null - reading the raw value
// ourselves first lets us check for emptiness before ever handing it to
// the decoder, so the exception path is never triggered in the first
// place, rather than merely being caught after the fact.
async function readRawDataKey(
  profileAddress: string,
  keyName: string,
  dynamicKeyParts: string
): Promise<`0x${string}`> {
  const dataKey = encodeKeyName(keyName, dynamicKeyParts) as `0x${string}`;
  return luksoClient.readContract({
    address: profileAddress as `0x${string}`,
    abi: ERC725Y_GET_DATA_ABI,
    functionName: "getData",
    args: [dataKey],
  });
}

// Fetches the restriction data that determines whether a controller's
// non-SUPER permissions (CALL, TRANSFERVALUE, SETDATA) actually grant any
// real capability, or are configured with no allowed targets at all - a
// gap this tool didn't previously surface, even though it directly affects
// whether "within allowed limits" means "meaningfully scoped" or
// "functionally does nothing."
export async function getControllerRestrictions(
  profileAddress: string,
  controllerAddress: string
): Promise<ControllerRestrictions> {
  const [allowedCalls, allowedDataKeyCount] = await Promise.all([
    fetchAllowedCalls(profileAddress, controllerAddress),
    fetchAllowedDataKeyCount(profileAddress, controllerAddress),
  ]);

  return { allowedCalls, allowedDataKeyCount };
}

async function fetchAllowedCalls(
  profileAddress: string,
  controllerAddress: string
): Promise<AllowedCallEntry[] | null> {
  try {
    const rawValue = await readRawDataKey(
      profileAddress,
      "AddressPermissions:AllowedCalls:<address>",
      controllerAddress
    );
    if (!rawValue || rawValue === "0x") return null;

    const decoded = ERC725.decodeData(
      [
        {
          keyName: "AddressPermissions:AllowedCalls:<address>",
          dynamicKeyParts: controllerAddress,
          value: rawValue,
        },
      ],
      LSP6Schema,
      false // throwExceptions: false - never throw regardless of shape
    );

    const raw = decoded[0]?.value as string[][] | null;
    if (!raw) return null;
    return raw.length > 0 ? raw.map(decodeAllowedCallTuple) : [];
  } catch {
    return null;
  }
}

async function fetchAllowedDataKeyCount(
  profileAddress: string,
  controllerAddress: string
): Promise<number | null> {
  try {
    const rawValue = await readRawDataKey(
      profileAddress,
      "AddressPermissions:AllowedERC725YDataKeys:<address>",
      controllerAddress
    );
    if (!rawValue || rawValue === "0x") return null;

    const decoded = ERC725.decodeData(
      [
        {
          keyName: "AddressPermissions:AllowedERC725YDataKeys:<address>",
          dynamicKeyParts: controllerAddress,
          value: rawValue,
        },
      ],
      LSP6Schema,
      false
    );

    const raw = decoded[0]?.value as string[] | null;
    return raw ? raw.length : null;
  } catch {
    return null;
  }
}
