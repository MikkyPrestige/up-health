import { describe, it, expect } from "vitest";
import { permissionLabel, PERMISSION_LABELS } from "./permissionLabels";

describe("permissionLabel", () => {
  it("returns the known plain-language phrase for a real permission name", () => {
    expect(permissionLabel("ADDCONTROLLER")).toBe("add new controllers");
    expect(permissionLabel("TRANSFERVALUE")).toBe(
      "transfer LYX or tokens, within allowed limits"
    );
  });

  it("falls back to the raw name for an unrecognized permission", () => {
    expect(permissionLabel("SOME_FUTURE_PERMISSION")).toBe(
      "SOME_FUTURE_PERMISSION"
    );
  });

  it("has an entry for every permission LUKSO's own decodePermissions can return", () => {
    // Cross-checked against LUKSO's official docs during Phase 2 - this
    // guards against silently losing coverage if the file is edited later.
    const expectedPermissions = [
      "CHANGEOWNER",
      "ADDCONTROLLER",
      "EDITPERMISSIONS",
      "ADDEXTENSIONS",
      "CHANGEEXTENSIONS",
      "ADDUNIVERSALRECEIVERDELEGATE",
      "CHANGEUNIVERSALRECEIVERDELEGATE",
      "REENTRANCY",
      "SUPER_TRANSFERVALUE",
      "TRANSFERVALUE",
      "SUPER_CALL",
      "CALL",
      "SUPER_STATICCALL",
      "STATICCALL",
      "SUPER_DELEGATECALL",
      "DELEGATECALL",
      "DEPLOY",
      "SUPER_SETDATA",
      "SETDATA",
      "ENCRYPT",
      "DECRYPT",
      "SIGN",
      "EXECUTE_RELAY_CALL",
    ];
    for (const permission of expectedPermissions) {
      expect(PERMISSION_LABELS[permission]).toBeDefined();
      expect(PERMISSION_LABELS[permission]).not.toBe("");
    }
  });
});
