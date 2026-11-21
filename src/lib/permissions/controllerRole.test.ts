import { describe, it, expect } from "vitest";
import { describeControllerRole } from "./controllerRole";
import type { ControllerRestrictions } from "../blockchain/controllerRestrictions";

const NONE: ControllerRestrictions = {
  allowedCalls: null,
  allowedDataKeyCount: null,
};

function perms(...names: string[]): Record<string, boolean> {
  return Object.fromEntries(names.map((n) => [n, true]));
}

const role = (
  names: string[],
  kind: Parameters<typeof describeControllerRole>[1] = "wallet",
  restrictions: ControllerRestrictions = NONE
) => describeControllerRole(perms(...names), kind, restrictions);

describe("describeControllerRole", () => {
  it("says a controller with no permissions can't do anything", () => {
    expect(role([]).headline).toContain("can't do anything");
    expect(
      describeControllerRole({ CALL: false }, "wallet", NONE).headline
    ).toContain("can't do anything");
  });

  it("calls a controller that governs and spends 'almost everything'", () => {
    const r = role(["ADDCONTROLLER", "SUPER_TRANSFERVALUE", "SUPER_CALL"]);
    expect(r.headline).toContain("almost everything");
  });

  it("describes a governing-only controller as unable to send funds itself, with a recognise-it note", () => {
    const r = role(["ADDCONTROLLER"]);
    expect(r.headline).toContain("can't send funds itself");
    expect(r.note).toContain("recognise");
  });

  it("treats EDITPERMISSIONS like ADDCONTROLLER", () => {
    expect(role(["EDITPERMISSIONS"]).headline).toContain(
      "add or change other controllers"
    );
  });

  it("says a spender without governing power can't add controllers", () => {
    const r = role(["SUPER_TRANSFERVALUE"]);
    expect(r.headline).toContain("send funds");
    expect(r.headline).toContain("can't add other controllers");
  });

  it("limits a non-SUPER transfer permission to what's been allowed", () => {
    const allowed: ControllerRestrictions = {
      allowedCalls: [
        {
          callTypes: ["transfer value"],
          address: "0x1",
          standard: "Any type",
          function: "Any function",
        },
      ],
      allowedDataKeyCount: null,
    };
    expect(role(["TRANSFERVALUE"], "wallet", allowed).headline).toContain(
      "only to the addresses it has been allowed"
    );
  });

  it("says a non-SUPER permission with nothing allowed does nothing", () => {
    expect(role(["TRANSFERVALUE"]).headline).toContain("currently do nothing");
    expect(role(["CALL"]).headline).toContain("currently do nothing");
  });

  it("does not let an inert permission count as real power next to ADDCONTROLLER", () => {
    const r = role(["ADDCONTROLLER", "TRANSFERVALUE"]);
    expect(r.headline).toContain("can't send funds itself");
  });

  it("describes a receiver delegate as an automatic helper", () => {
    const r = role(["SUPER_SETDATA"], "delegate-contract");
    expect(r.headline).toContain("automatic helper");
    expect(r.note).toBeUndefined();
  });

  it("adds a caution when a receiver delegate holds real power", () => {
    const r = role(["SUPER_TRANSFERVALUE"], "delegate-contract");
    expect(r.headline).toContain("automatic helper");
    expect(r.note).toContain("powerful permissions");
  });

  it("describes sign-only, read-only and data-edit controllers plainly", () => {
    expect(role(["SIGN"]).headline).toContain("sign and encrypt");
    expect(role(["SUPER_STATICCALL"]).headline).toContain("only read");
    expect(role(["SUPER_SETDATA"]).headline).toContain("change this profile's information");
  });

  it("never claims to know what a controller is for", () => {
    const samples = [
      role(["ADDCONTROLLER"]),
      role(["SUPER_TRANSFERVALUE"]),
      role(["SIGN"]),
      role([]),
    ];
    for (const r of samples) {
      expect(r.headline.toLowerCase()).not.toMatch(/\b(your phone|your wallet|is for)\b/);
    }
  });
});
