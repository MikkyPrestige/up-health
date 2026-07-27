import { describe, it, expect } from "vitest";
import {
  PERMISSION_CATEGORIES,
  getActiveCategories,
} from "./permissionCategories";
import { PERMISSION_LABELS } from "./permissionLabels";

describe("PERMISSION_CATEGORIES", () => {
  it("covers every real LSP6 permission exactly once - no gaps, no duplicates", () => {
    const allCategorized = PERMISSION_CATEGORIES.flatMap(
      (category) => category.permissions
    );
    const allRealPermissions = Object.keys(PERMISSION_LABELS);

    // Every real permission appears in some category...
    for (const permission of allRealPermissions) {
      expect(allCategorized).toContain(permission);
    }
    // ...and no permission appears in more than one category.
    const uniqueCount = new Set(allCategorized).size;
    expect(allCategorized.length).toBe(uniqueCount);
  });
});

describe("getActiveCategories", () => {
  it("returns only categories the controller actually has permissions in", () => {
    const active = getActiveCategories({
      ADDCONTROLLER: true,
      SIGN: true,
    });
    const ids = active.map((c) => c.id);
    expect(ids).toContain("governance");
    expect(ids).toContain("sign_encrypt");
    expect(ids).not.toContain("move_funds");
    expect(ids).not.toContain("deploy");
  });

  it("only includes the specific active permissions within a category, not the whole category definition", () => {
    // SIGN is active but ENCRYPT/DECRYPT are not - the category should
    // reflect that, not claim the controller has all three.
    const active = getActiveCategories({ SIGN: true });
    const signCategory = active.find((c) => c.id === "sign_encrypt");
    expect(signCategory?.activePermissions).toEqual(["SIGN"]);
  });

  it("returns an empty list for a controller with no permissions at all", () => {
    expect(getActiveCategories({})).toEqual([]);
  });

  it("combines SUPER_ and non-SUPER_ variants into the same category", () => {
    const active = getActiveCategories({
      SUPER_CALL: true,
      CALL: true,
    });
    const callCategory = active.find((c) => c.id === "call_contracts");
    expect(callCategory?.activePermissions).toEqual(["SUPER_CALL", "CALL"]);
  });
});
