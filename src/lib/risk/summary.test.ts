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
  it("never mentions flags or findings to a non-verified-owner, even if some are triggered", () => {
    // Regression test for a real bug caught mid-project: the summary must
    // not say nothing was found to someone we never checked ownership for,
    // since that would falsely imply we verified a clean profile.
    const triggeredFlags = [makeFlag("no_recovery_path", true)];
    const summary = generateSummary(1, triggeredFlags, false);
    expect(summary).not.toContain("flag");
    expect(summary).not.toContain("Nothing stands out");
    expect(summary).not.toContain("worth a look");
    expect(summary).not.toContain("backup");
    expect(summary).toContain("connect the wallet that owns this profile");
  });

  it("tells a non-owner what to do next and that the list is below", () => {
    expect(generateSummary(14, [], false)).toBe(
      "14 controllers found, listed below with what each can do. To see what needs your attention, connect the wallet that owns this profile."
    );
  });

  it("doesn't claim a list below when there are no controllers", () => {
    const summary = generateSummary(0, [], false);
    expect(summary).toContain("0 controllers found.");
    expect(summary).not.toContain("listed below");
  });

  it("says nothing stands out for a verified owner with a clean profile, without saying 'safe'", () => {
    const flags = [
      makeFlag("concentrated_power", false),
      makeFlag("no_recovery_path", false),
      makeFlag("suspicious_delegate", false),
    ];
    const summary = generateSummary(3, flags, true);
    expect(summary).toBe(
      "3 controllers found. Nothing stands out in the checks UP Health runs."
    );
    expect(summary.toLowerCase()).not.toContain("safe");
  });

  it("reports exactly one finding in the singular", () => {
    const flags = [makeFlag("no_recovery_path", true)];
    const summary = generateSummary(1, flags, true);
    expect(summary).toBe(
      "1 controller found. 1 thing worth a look: there's only one controller, so no backup if you lose it."
    );
  });

  it("reports multiple findings with the correct count for a verified owner", () => {
    const flags = [
      makeFlag("concentrated_power", true),
      makeFlag("suspicious_delegate", true),
    ];
    const summary = generateSummary(4, flags, true);
    expect(summary).toContain("2 things worth a look:");
  });

  it("lists critical findings before warnings", () => {
    const flags = [
      makeFlag("concentrated_power", true),
      { ...makeFlag("no_key_manager", true), severity: "critical" as const },
    ];
    const summary = generateSummary(2, flags, true);
    expect(summary.indexOf("Key Manager")).toBeLessThan(
      summary.indexOf("add other controllers and send funds")
    );
  });

  it("uses no web3 jargon in any finding phrase", () => {
    const ids: RiskFlagResult["id"][] = [
      "concentrated_power",
      "no_recovery_path",
      "suspicious_delegate",
      "no_controllers",
      "no_key_manager",
      "governing_only_controller",
      "incident_linked_controller",
    ];
    for (const id of ids) {
      const summary = generateSummary(2, [makeFlag(id, true)], true);
      expect(summary).not.toMatch(/govern|flag|interface|bitfield/i);
    }
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
