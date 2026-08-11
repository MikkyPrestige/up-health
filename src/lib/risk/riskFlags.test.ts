import { describe, it, expect } from "vitest";
import {
  checkConcentratedPower,
  checkNoRecoveryPath,
  checkSuspiciousDelegate,
  checkNoControllers,
  checkNoKeyManager,
} from "./riskFlags";
import type { ControllerBreakdown } from "../blockchain/controllerPermissions";

// Builds a synthetic controller with the given permissions set to true.
// Address defaults to a distinct placeholder per call so tests can tell
// controllers apart without needing real on-chain data.
function makeController(
  address: string,
  permissions: string[]
): ControllerBreakdown {
  const decodedPermissions: Record<string, boolean> = {};
  for (const permission of permissions) {
    decodedPermissions[permission] = true;
  }
  return {
    address: address as `0x${string}`,
    decodedPermissions,
    canStatements: [],
  };
}

const ADDR_A = "0x0000000000000000000000000000000000000A";
const ADDR_B = "0x0000000000000000000000000000000000000B";
const ADDR_C = "0x0000000000000000000000000000000000000C";

describe("checkConcentratedPower", () => {
  it("triggers when one controller holds both governing and broad execution power", () => {
    const controllers = [
      makeController(ADDR_A, ["ADDCONTROLLER", "TRANSFERVALUE"]),
    ];
    const result = checkConcentratedPower(controllers);
    expect(result.triggered).toBe(true);
    expect(result.affectedControllers).toEqual([ADDR_A]);
  });

  it("does not trigger for governing power alone (matches LUKSO's own recovery pattern)", () => {
    const controllers = [makeController(ADDR_A, ["ADDCONTROLLER"])];
    const result = checkConcentratedPower(controllers);
    expect(result.triggered).toBe(false);
    expect(result.affectedControllers).toEqual([]);
  });

  it("does not trigger for broad execution power alone, without governing power", () => {
    const controllers = [
      makeController(ADDR_A, ["TRANSFERVALUE", "CALL", "DEPLOY"]),
    ];
    const result = checkConcentratedPower(controllers);
    expect(result.triggered).toBe(false);
  });

  it("triggers via EDITPERMISSIONS just as it does via ADDCONTROLLER", () => {
    const controllers = [
      makeController(ADDR_A, ["EDITPERMISSIONS", "SUPER_CALL"]),
    ];
    expect(checkConcentratedPower(controllers).triggered).toBe(true);
  });

  it("does not treat DEPLOY or STATICCALL as 'broad execution' for this flag", () => {
    // Deliberately narrow per the Proposal's own wording - only value
    // transfer and calling contracts count, not every powerful permission.
    const controllers = [
      makeController(ADDR_A, ["ADDCONTROLLER", "DEPLOY", "STATICCALL"]),
    ];
    expect(checkConcentratedPower(controllers).triggered).toBe(false);
  });

  it("correctly identifies only the affected controllers among several", () => {
    const controllers = [
      makeController(ADDR_A, ["ADDCONTROLLER"]), // governing only - clean
      makeController(ADDR_B, ["ADDCONTROLLER", "TRANSFERVALUE"]), // affected
      makeController(ADDR_C, ["SIGN", "ENCRYPT"]), // unrelated - clean
    ];
    const result = checkConcentratedPower(controllers);
    expect(result.triggered).toBe(true);
    expect(result.affectedControllers).toEqual([ADDR_B]);
  });

  it("does not exempt any controller, including one that might be the 'main' controller", () => {
    // Explicit regression test for the decision made mid-project: no
    // controller is exempted from this flag, not even a first/main one.
    const controllers = [
      makeController(ADDR_A, ["ADDCONTROLLER", "EDITPERMISSIONS", "CALL"]),
    ];
    expect(checkConcentratedPower(controllers).triggered).toBe(true);
  });

  it("triggers via SUPER_SETDATA just as it does via TRANSFERVALUE/CALL", () => {
    // Gap #3: unrestricted data-writing power is just as governance-
    // relevant as fund transfer or arbitrary calls when combined with
    // governing power - a controller with this combination can bypass
    // AllowedERC725YDataKeys entirely.
    const controllers = [
      makeController(ADDR_A, ["ADDCONTROLLER", "SUPER_SETDATA"]),
    ];
    expect(checkConcentratedPower(controllers).triggered).toBe(true);
  });

  it("does not trigger for SUPER_SETDATA alone, without governing power", () => {
    const controllers = [makeController(ADDR_A, ["SUPER_SETDATA"])];
    expect(checkConcentratedPower(controllers).triggered).toBe(false);
  });

  it("does not trigger for plain SETDATA combined with governing power", () => {
    // Deliberately narrow, same as DEPLOY/STATICCALL: only SUPER_SETDATA
    // (unrestricted) counts, not the scoped SETDATA permission.
    const controllers = [
      makeController(ADDR_A, ["ADDCONTROLLER", "SETDATA"]),
    ];
    expect(checkConcentratedPower(controllers).triggered).toBe(false);
  });

  it("does not trigger and does not throw on an empty controller list", () => {
    const result = checkConcentratedPower([]);
    expect(result.triggered).toBe(false);
    expect(result.affectedControllers).toEqual([]);
  });
});

describe("checkNoRecoveryPath", () => {
  it("triggers when exactly one controller exists", () => {
    const result = checkNoRecoveryPath([makeController(ADDR_A, ["SIGN"])]);
    expect(result.triggered).toBe(true);
    expect(result.affectedControllers).toEqual([ADDR_A]);
  });

  it("does not trigger for two or more controllers", () => {
    const controllers = [
      makeController(ADDR_A, ["SIGN"]),
      makeController(ADDR_B, ["SIGN"]),
    ];
    expect(checkNoRecoveryPath(controllers).triggered).toBe(false);
  });

  it("does not trigger for zero controllers - that case now has its own dedicated flag", () => {
    // "No recovery path" describes a preventable risk (losing the one
    // controller you have); zero controllers describes something that has
    // already happened and can't be undone. See checkNoControllers below,
    // which covers this case with its own critical-severity, honestly-worded
    // flag instead of stretching this one's future-tense wording to fit.
    const result = checkNoRecoveryPath([]);
    expect(result.triggered).toBe(false);
  });
});

describe("checkSuspiciousDelegate", () => {
  it("triggers when a delegate is set but doesn't implement the receiver delegate interface", () => {
    const result = checkSuspiciousDelegate(ADDR_A, false);
    expect(result.triggered).toBe(true);
    expect(result.affectedControllers).toEqual([ADDR_A]);
  });

  it("does not trigger when the delegate implements the interface", () => {
    const result = checkSuspiciousDelegate(ADDR_A, true);
    expect(result.triggered).toBe(false);
  });

  it("does not trigger when no delegate is set at all (null)", () => {
    const result = checkSuspiciousDelegate(null, false);
    expect(result.triggered).toBe(false);
    expect(result.affectedControllers).toBeUndefined();
  });

  it("does not trigger for the zero address, even if 'implements interface' were somehow true", () => {
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const result = checkSuspiciousDelegate(zeroAddress, false);
    expect(result.triggered).toBe(false);
  });
});

describe("checkNoControllers", () => {
  it("triggers for a profile with zero controllers, at critical severity", () => {
    const result = checkNoControllers([]);
    expect(result.triggered).toBe(true);
    expect(result.severity).toBe("critical");
  });

  it("does not trigger for a profile with at least one controller", () => {
    expect(checkNoControllers([makeController(ADDR_A, ["SIGN"])]).triggered).toBe(
      false
    );
  });

  it("suggests no next step, since none is possible through the permission system", () => {
    const result = checkNoControllers([]);
    expect(result.nextStep).toBeUndefined();
  });
});

describe("checkNoKeyManager", () => {
  it("triggers when the profile's owner isn't a genuine Key Manager, at critical severity", () => {
    const result = checkNoKeyManager(false);
    expect(result.triggered).toBe(true);
    expect(result.severity).toBe("critical");
  });

  it("does not trigger when the profile's owner is a genuine Key Manager", () => {
    expect(checkNoKeyManager(true).triggered).toBe(false);
  });

  it("suggests no next step, since none is possible through the permission system", () => {
    const result = checkNoKeyManager(false);
    expect(result.nextStep).toBeUndefined();
  });
});
