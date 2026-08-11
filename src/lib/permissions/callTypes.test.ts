import { describe, it, expect } from "vitest";
import { decodeCallTypes } from "./callTypes";

describe("decodeCallTypes", () => {
  // These three exact values are erc725.js's own documented example for
  // decoding an AllowedCalls entry - using them as fixtures here means the
  // test is checked against a real, authoritative source, not just our own
  // assumptions about the encoding.
  it("decodes 0x00000003 as CALL and transfer value", () => {
    expect(decodeCallTypes("0x00000003")).toEqual(
      expect.arrayContaining(["call", "transfer value"])
    );
    expect(decodeCallTypes("0x00000003")).toHaveLength(2);
  });

  it("decodes 0x00000002 as CALL only", () => {
    expect(decodeCallTypes("0x00000002")).toEqual(["call"]);
  });

  it("decodes 0x00000001 as transfer value only", () => {
    expect(decodeCallTypes("0x00000001")).toEqual(["transfer value"]);
  });

  it("decodes all four flags when every bit is set", () => {
    const result = decodeCallTypes("0x0000000f");
    expect(result).toHaveLength(4);
    expect(result).toEqual(
      expect.arrayContaining([
        "transfer value",
        "call",
        "static call",
        "delegate call",
      ])
    );
  });

  it("returns an empty array for no bits set", () => {
    expect(decodeCallTypes("0x00000000")).toEqual([]);
  });
});
