import { describe, it, expect } from "vitest";
import { standardLabel } from "./knownStandards";

describe("standardLabel", () => {
  it("recognizes the current LSP0 (Universal Profile) interface ID", () => {
    expect(standardLabel("0x24871b3d")).toBe("Universal Profile");
  });

  it("recognizes the older LSP0 interface ID from erc725.js's own docs example", () => {
    expect(standardLabel("0x3e89ad98")).toBe(
      "Universal Profile (older version)"
    );
  });

  it("recognizes current and older LSP7/LSP8 interface IDs", () => {
    expect(standardLabel("0xc52d6008")).toBe("LSP7 Token");
    expect(standardLabel("0xb3c4928f")).toContain("LSP7");
    expect(standardLabel("0x3a271706")).toBe("LSP8 NFT");
    expect(standardLabel("0x30dc5278")).toContain("LSP8");
  });

  it("is case-insensitive", () => {
    expect(standardLabel("0xC52D6008")).toBe("LSP7 Token");
  });

  it("falls back to the raw hex for an unrecognized interface ID", () => {
    expect(standardLabel("0xdeadbeef")).toBe("0xdeadbeef");
  });
});
