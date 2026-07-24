import type { RiskFlagResult } from "./riskFlags";

const SHORT_LABELS: Record<RiskFlagResult["id"], string> = {
  concentrated_power:
    "a controller can both govern permissions and move funds or make calls",
  no_recovery_path: "only one controller exists, with no recovery path",
  suspicious_delegate:
    "the Universal Receiver Delegate points to an unverifiable address",
};

// Builds the single summary sentence shown at the top of results (Handbook
// Step 3.7). Purely presentation - it just counts and phrases what Phase 3's
// other functions already computed.
//
// isVerifiedOwner must be passed explicitly and honestly: for anyone other
// than the verified owner, this never mentions flags at all - not even to
// say "no flags found" - since that would misleadingly imply we checked and
// found the profile clean, when we simply didn't check (Proposal Section 4.2).
export function generateSummary(
  controllerCount: number,
  flags: RiskFlagResult[],
  isVerifiedOwner: boolean
): string {
  const controllerWord = controllerCount === 1 ? "controller" : "controllers";
  const base = `${controllerCount} ${controllerWord} found.`;

  if (!isVerifiedOwner) {
    return `${base} Connect the wallet that owns this profile to see its full risk breakdown.`;
  }

  const triggeredFlags = flags.filter((flag) => flag.triggered);

  if (triggeredFlags.length === 0) {
    return `${base} No flags found.`;
  }

  if (triggeredFlags.length === 1) {
    return `${base} 1 flag: ${SHORT_LABELS[triggeredFlags[0].id]}.`;
  }

  const list = triggeredFlags
    .map((flag) => SHORT_LABELS[flag.id])
    .join("; ");
  return `${base} ${triggeredFlags.length} flags: ${list}.`;
}
