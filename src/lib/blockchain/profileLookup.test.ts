import { describe, it, expect, vi, beforeEach } from "vitest";

const getCode = vi.fn();
const getData = vi.fn();

vi.mock("./luksoClient", () => ({
  luksoClient: { getCode: (...args: unknown[]) => getCode(...args) },
  RPC_URL: "http://localhost:0",
}));
vi.mock("@erc725/erc725.js", () => ({
  default: class {
    getData(...args: unknown[]) {
      return getData(...args);
    }
  },
}));
vi.mock("@erc725/erc725.js/schemas", () => ({ LSP6Schema: [] }));

import { getRawControllerAddresses } from "./profileLookup";

const PROFILE = "0xFBE1cEE27d6C7b4bCe0d72b6c711F647e6E79aa8";
const GOOD = "0xd6ebb3c5c1836f5377d134c303f4ebb053562f6f";

describe("getRawControllerAddresses", () => {
  beforeEach(() => {
    getCode.mockResolvedValue("0x6080");
  });

  it("drops blank, undefined and malformed entries from the controller list", async () => {
    getData.mockResolvedValue({
      value: [GOOD, "", undefined, null, "0x123", "not-an-address"],
    });
    const result = await getRawControllerAddresses(PROFILE);
    expect(result).toEqual({ status: "found", controllers: [GOOD] });
  });

  it("returns an empty list when the value isn't an array", async () => {
    getData.mockResolvedValue({ value: null });
    const result = await getRawControllerAddresses(PROFILE);
    expect(result).toEqual({ status: "found", controllers: [] });
  });
});
