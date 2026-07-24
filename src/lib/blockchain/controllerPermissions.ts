import ERC725 from "@erc725/erc725.js";
import { LSP6Schema } from "@erc725/erc725.js/schemas";
import { RPC_URL } from "./luksoClient";
import { permissionLabel } from "../permissions/permissionLabels";

export interface ControllerBreakdown {
  address: `0x${string}`;
  // Raw named-boolean decode straight from erc725.js (e.g. { CALL: true, ... }).
  decodedPermissions: Record<string, boolean>;
  // Plain-language statements for every permission this controller holds.
  canStatements: string[];
}

// Fetches and decodes the permission bitfield for every controller on a
// profile in a single batched call (Handbook Step 2.1: full enumeration,
// not just one address; Step 2.2: accurate decoding via erc725.js's own
// bitfield logic, not a hand-rolled reimplementation).
export async function getControllerPermissions(
  profileAddress: string,
  controllers: `0x${string}`[]
): Promise<ControllerBreakdown[]> {
  if (controllers.length === 0) return [];

  const erc725 = new ERC725(LSP6Schema, profileAddress, RPC_URL, {});

  const results = await erc725.getData(
    controllers.map((address) => ({
      keyName: "AddressPermissions:Permissions:<address>",
      dynamicKeyParts: address,
    }))
  );

  return results.map((result, index) => {
    const rawValue = (result.value as `0x${string}`) || "0x00";
    const decodedPermissions = ERC725.decodePermissions(rawValue);

    const canStatements = Object.entries(decodedPermissions)
      .filter(([, hasPermission]) => hasPermission)
      .map(([permissionName]) => permissionLabel(permissionName));

    return {
      address: controllers[index],
      decodedPermissions,
      canStatements,
    };
  });
}
