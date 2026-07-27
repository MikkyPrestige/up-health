import { describe, it, expect } from "vitest";
import { generateSummary } from "./summary";
import type { RiskFlagResult } from "./riskFlags";

function makeFlag(
  id: RiskFlagResult["id"],
  triggered: boolean
): RiskFlagResult {
  return {
    id,
    triggered,
    severity: "warning",
    title: "test title",
    explanation: "test explanation",
  };
}

describe("generateSummary", () => {
  it("never mentions flags to a non-verified-owner, even if some are triggered", () => {
    // Regression test for a real bug caught mid-project: the summary must
    // not say "no flags found" to someone we never checked ownership for,
    // since that would falsely imply we verified a clean profile.
    const triggeredFlags = [makeFlag("no_recovery_path", true)];
    const summary = generateSummary(1, triggeredFlags, false);
    expect(summary).not.toContain("flag");
    expect(summary).not.toContain("No flags found");
    expect(summary).toContain("Connect the wallet");
  });

  it("says 'No flags found' for a verified owner with a clean profile", () => {
    const flags = [
      makeFlag("concentrated_power", false),
      makeFlag("no_recovery_path", false),
      makeFlag("suspicious_delegate", false),
    ];
    const summary = generateSummary(3, flags, true);
    expect(summary).toBe("3 controllers found. No flags found.");
  });

  it("reports exactly one flag correctly for a verified owner", () => {
    const flags = [makeFlag("no_recovery_path", true)];
    const summary = generateSummary(1, flags, true);
    expect(summary).toContain("1 flag:");
    expect(summary).toContain("recovery path");
  });

  it("reports multiple flags with the correct count for a verified owner", () => {
    const flags = [
      makeFlag("concentrated_power", true),
      makeFlag("suspicious_delegate", true),
    ];
    const summary = generateSummary(4, flags, true);
    expect(summary).toContain("2 flags:");
  });

  it("uses singular 'controller' for a count of exactly one", () => {
    const summary = generateSummary(1, [], true);
    expect(summary).toContain("1 controller found");
    expect(summary).not.toContain("1 controllers");
  });

  it("uses plural 'controllers' for any count other than one, including zero", () => {
    expect(generateSummary(0, [], true)).toContain("0 controllers found");
    expect(generateSummary(5, [], true)).toContain("5 controllers found");
  });
});
