import type { ControllerBreakdown } from "../blockchain/controllerPermissions";

export interface RiskFlagResult {
  id: "concentrated_power" | "no_recovery_path" | "suspicious_delegate";
  triggered: boolean;
  title: string;
  explanation: string;
  nextStep?: string;
  nextStepUrl?: string;
  affectedControllers?: `0x${string}`[];
}

const PERMISSION_MANAGER_URL = "https://permissioncontrol.app";

// Permissions that grant governing power over the profile's own access list.
const GOVERNING_PERMISSIONS = ["ADDCONTROLLER", "EDITPERMISSIONS"];

// Permissions treated as "broad execution or value-transfer" for this flag.
// Deliberately limited to capabilities that move funds or execute arbitrary
// calls, per the Proposal's own wording - not every powerful permission
// (e.g. DEPLOY, STATICCALL) is included here.
const BROAD_EXECUTION_OR_TRANSFER_PERMISSIONS = [
  "SUPER_TRANSFERVALUE",
  "TRANSFERVALUE",
  "SUPER_CALL",
  "CALL",
  "SUPER_DELEGATECALL",
  "DELEGATECALL",
];

// Flag 1: a controller holds governing power (can add controllers or edit
// permissions) AND broad execution/value-transfer power at the same time.
// No controller is exempted from this check (including a profile's original
// controller) - the risky part is the combination itself, which matters
// regardless of which controller holds it.
export function checkConcentratedPower(
  controllers: ControllerBreakdown[]
): RiskFlagResult {
  const affected = controllers.filter((controller) => {
    const hasGoverningPower = GOVERNING_PERMISSIONS.some(
      (permission) => controller.decodedPermissions[permission]
    );
    const hasBroadPower = BROAD_EXECUTION_OR_TRANSFER_PERMISSIONS.some(
      (permission) => controller.decodedPermissions[permission]
    );
    return hasGoverningPower && hasBroadPower;
  });

  return {
    id: "concentrated_power",
    triggered: affected.length > 0,
    title: "One controller holds both governing and broad execution power",
    explanation:
      "This controller can add new controllers or edit permissions, and can " +
      "also transfer funds or call external contracts. If it's compromised, " +
      "it could both act on the profile and grant itself or others further access.",
    nextStep:
      "Consider narrowing this controller's permissions, or moving governing " +
      "power (adding/editing controllers) to a separate, more narrowly-scoped controller.",
    nextStepUrl: PERMISSION_MANAGER_URL,
    affectedControllers: affected.map((controller) => controller.address),
  };
}

// Flag 2: the profile has exactly one controller, with no separate recovery
// path at all - a single point of failure, contrary to LUKSO's own
// recommended architecture (Proposal Section 7.1).
export function checkNoRecoveryPath(
  controllers: ControllerBreakdown[]
): RiskFlagResult {
  const triggered = controllers.length === 1;

  return {
    id: "no_recovery_path",
    triggered,
    title: "No recovery path if this controller is lost",
    explanation:
      "Only one controller exists on this profile, with no separate recovery " +
      "path. If access to it is ever lost, there's no other way to regain " +
      "control of the profile.",
    nextStep:
      "Consider adding a dedicated recovery controller with only the permission " +
      "to add new controllers, following LUKSO's recommended recovery pattern.",
    nextStepUrl: PERMISSION_MANAGER_URL,
    affectedControllers: triggered
      ? controllers.map((controller) => controller.address)
      : undefined,
  };
}

// Flag 3: a Universal Receiver Delegate is set, but points to an address with
// no verifiable contract code - a simple, intentionally basic check (Proposal
// Section 6.3), not deep contract analysis.
export function checkSuspiciousDelegate(
  delegateAddress: string | null,
  delegateHasCode: boolean
): RiskFlagResult {
  const isSet = Boolean(
    delegateAddress &&
      delegateAddress !== "0x0000000000000000000000000000000000000000"
  );
  const triggered = isSet && !delegateHasCode;

  return {
    id: "suspicious_delegate",
    triggered,
    title: "Universal Receiver Delegate points to an unverifiable address",
    explanation:
      "A Universal Receiver Delegate is configured, but the address it points " +
      "to has no verifiable contract code. This delegate runs automatically " +
      "whenever the profile receives assets, so an unusual or unverifiable " +
      "delegate is worth a closer look.",
    nextStep:
      "Confirm this delegate address is one you recognize and intended to set. " +
      "If not, consider removing or replacing it.",
    nextStepUrl: PERMISSION_MANAGER_URL,
    affectedControllers:
      triggered && delegateAddress
        ? [delegateAddress as `0x${string}`]
        : undefined,
  };
}
