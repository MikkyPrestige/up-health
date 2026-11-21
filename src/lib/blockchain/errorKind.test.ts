import { describe, it, expect } from "vitest";
import { isNetworkError } from "./errorKind";

describe("isNetworkError", () => {
  it("treats viem HTTP failures as network errors", () => {
    expect(isNetworkError(new Error("HTTP request failed."))).toBe(true);
  });

  it("finds a network cause nested under a generic wrapper", () => {
    const inner = new Error("getaddrinfo ENOTFOUND rpc.mainnet.lukso.network");
    const outer = new Error("Request failed", { cause: inner });
    expect(isNetworkError(outer)).toBe(true);
  });

  it("treats the erc725.js missing-dynamic-key error as a data error", () => {
    const err = new Error(
      "Can't getSchemaElement for dynamic key: AddressPermissions:Permissions:<address> without dynamicKeyParts."
    );
    expect(isNetworkError(err)).toBe(false);
  });

  it("treats non-Error throws as not network", () => {
    expect(isNetworkError("boom")).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
});
