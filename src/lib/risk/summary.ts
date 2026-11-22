import type { RiskFlagResult } from "./riskFlags";

const SHORT_LABELS: Record<RiskFlagResult["id"], string> = {
  concentrated_power:
    "some controllers can both add other controllers and send funds",
  no_recovery_path:
    "there's only one controller, so no backup if you lose it",
  suspicious_delegate:
    "the automatic helper on this profile isn't set up the way it should be",
  no_controllers: "this profile has no controllers, so nobody can use it",
  no_key_manager:
    "this profile isn't protected by a Key Manager, so its permissions aren't being enforced",
  governing_only_controller: "a controller can add other controllers",
  incident_linked_controller:
    "a controller from LUKSO's November 2026 incident is still listed",
};

const MAX_LISTED = 2;

// Builds the single summary sentence shown at the top of results (Handbook
// Step 3.7). Purely presentation - it just counts and phrases what Phase 3's
// other functions already computed, in plain words a non-technical reader
// can act on.
//
// isVerifiedOwner must be passed explicitly and honestly: for anyone other
// than the verified owner, this never mentions flags or findings at all -
// not even to say nothing was found - since that would misleadingly imply we
// checked and found the profile clean, when we simply didn't check (Proposal
// Section 4.2). It only tells them what to do to see the findings.
export function generateSummary(
  controllerCount: number,
  flags: RiskFlagResult[],
  isVerifiedOwner: boolean
): string {
  const controllerWord = controllerCount === 1 ? "controller" : "controllers";
  const base = `${controllerCount} ${controllerWord} found`;

  if (!isVerifiedOwner) {
    const listed =
      controllerCount > 0 ? ", listed below with what each can do" : "";
    return `${base}${listed}. To see what needs your attention, connect the wallet that owns this profile.`;
  }

  // Serious items first; Array.prototype.sort is stable, so the original
  // order is kept within each severity.
  const triggeredFlags = flags
    .filter((flag) => flag.triggered)
    .sort((a, b) =>
      a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1
    );

  if (triggeredFlags.length === 0) {
    return `${base}. Nothing stands out in the checks UP Health runs.`;
  }

  // Only the most serious few are spelled out: on a phone a sentence naming
  // every finding runs for lines, and the cards below already hold them all.
  const listed = triggeredFlags.slice(0, MAX_LISTED);
  const list = listed.map((flag) => SHORT_LABELS[flag.id]).join("; ");
  const count =
    triggeredFlags.length === 1
      ? "1 thing needs your attention"
      : `${triggeredFlags.length} things need your attention`;
  const rest =
    triggeredFlags.length > MAX_LISTED
      ? " See the findings below for the rest."
      : "";
  return `${base}. ${count}: ${list}.${rest}`;
}
