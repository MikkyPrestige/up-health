import { describe, it, expect } from "vitest";
import { isVerifiedOwner } from "./identityMatch";

const PROFILE = "0xFBE1cEE27d6C7b4bCe0d72b6c711F647e6E79aa8";
const OTHER = "0xf6c64ae209d2cb58fc8ef8cc813efabd2a1fd098";

describe("isVerifiedOwner", () => {
  it("returns false when no wallet is connected at all", () => {
    expect(isVerifiedOwner(null, PROFILE)).toBe(false);
  });

  it("returns false when the connected wallet is a different address", () => {
    expect(isVerifiedOwner(OTHER, PROFILE)).toBe(false);
  });

  it("returns true when the connected wallet exactly matches the profile", () => {
    expect(isVerifiedOwner(PROFILE, PROFILE)).toBe(true);
  });

  it("returns true when the addresses match but differ only in letter casing", () => {
    expect(isVerifiedOwner(PROFILE.toLowerCase(), PROFILE)).toBe(true);
  });

  it("correctly rejects an invalid checksum rather than assuming it matches", () => {
    // Not a realistic wallet output (real addresses are either all-lowercase
    // or a valid EIP-55 mixed-case checksum, never all-uppercase), but worth
    // confirming isAddress's checksum validation is doing real work here,
    // not just a naive lowercase string comparison.
    const invalidChecksum = PROFILE.toUpperCase().replace("0X", "0x");
    expect(isVerifiedOwner(invalidChecksum, PROFILE)).toBe(false);
  });

  it("returns false for a malformed connected address rather than throwing", () => {
    expect(isVerifiedOwner("0x123", PROFILE)).toBe(false);
    expect(isVerifiedOwner("not-an-address", PROFILE)).toBe(false);
  });

  it("returns false for a malformed profile address rather than throwing", () => {
    expect(isVerifiedOwner(PROFILE, "0x123")).toBe(false);
  });

  it("returns false for an empty string connected address", () => {
    expect(isVerifiedOwner("", PROFILE)).toBe(false);
  });
});
