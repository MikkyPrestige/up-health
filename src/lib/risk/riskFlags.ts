import type { ControllerBreakdown } from "../blockchain/controllerPermissions";

export interface RiskFlagResult {
  id:
    | "concentrated_power"
    | "no_recovery_path"
    | "suspicious_delegate"
    | "no_controllers"
    | "no_key_manager";
  triggered: boolean;
  // "critical" is reserved for a fundamentally different category than the
  // others: not "this is risky," but "this has already happened and can't
  // be undone through the profile's own permission system." no_controllers
  // and no_key_manager use it today.
  severity: "warning" | "critical";
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
// Deliberately limited to capabilities that move funds, execute arbitrary
// calls, or write arbitrary data - per the Proposal's own wording, not
// every powerful permission (e.g. DEPLOY, STATICCALL) is included here.
// SUPER_SETDATA is included alongside the transfer/call permissions because
// unrestricted data-writing power is just as governance-relevant when
// combined with ADDCONTROLLER/EDITPERMISSIONS: a controller that can both
// govern the permission list AND write any ERC725Y data key it wants
// (bypassing AllowedERC725YDataKeys entirely) can affect the profile just
// as broadly as one that can transfer funds or make arbitrary calls.
const BROAD_EXECUTION_OR_TRANSFER_PERMISSIONS = [
  "SUPER_TRANSFERVALUE",
  "TRANSFERVALUE",
  "SUPER_CALL",
  "CALL",
  "SUPER_DELEGATECALL",
  "DELEGATECALL",
  "SUPER_SETDATA",
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
    severity: "warning",
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
    severity: "warning",
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

// Flag 3: a Universal Receiver Delegate is set, but the address it points
// to doesn't actually implement the LSP1UniversalReceiverDelegate
// interface - a simple, intentionally basic check (Proposal Section 6.3),
// not deep contract analysis. Refined from an earlier, weaker version of
// this check that only asked "does this address have any contract code at
// all" - that missed the case of a delegate address with code that simply
// isn't a receiver delegate (e.g. a mistyped address that happens to point
// at some unrelated contract).
export function checkSuspiciousDelegate(
  delegateAddress: string | null,
  delegateImplementsInterface: boolean
): RiskFlagResult {
  const isSet = Boolean(
    delegateAddress &&
      delegateAddress !== "0x0000000000000000000000000000000000000000"
  );
  const triggered = isSet && !delegateImplementsInterface;

  return {
    id: "suspicious_delegate",
    triggered,
    severity: "warning",
    title: "Automatic reaction code doesn't implement the expected interface",
    explanation:
      "This profile has code configured to run automatically whenever it " +
      "receives assets or notifications (this is called a 'Universal " +
      "Receiver Delegate'), but the address it points to doesn't actually " +
      "implement the interface a receiver delegate is expected to. Since " +
      "this code runs automatically, an address here that doesn't " +
      "implement the expected interface is worth a closer look.",
    nextStep:
      "Confirm this address is one you recognize and intended to set. " +
      "If not, consider removing or replacing it.",
    nextStepUrl: PERMISSION_MANAGER_URL,
    affectedControllers:
      triggered && delegateAddress
        ? [delegateAddress as `0x${string}`]
        : undefined,
  };
}

// Flag 4: the profile has zero controllers at all. This is categorically
// different from "no recovery path" (Flag 2) - that flag describes a risk
// that could still be prevented; this describes something that has already
// happened and cannot be undone through the profile's own permission
// system. No controller exists to grant any new permission, ever again, so
// there is deliberately no "next step" suggesting an in-app action - none
// exists. (Whether a 0-controller state is even reachable on-chain is an
// open question; this flag exists so the tool tells the truth if it is.)
export function checkNoControllers(
  controllers: ControllerBreakdown[]
): RiskFlagResult {
  const triggered = controllers.length === 0;

  return {
    id: "no_controllers",
    triggered,
    severity: "critical",
    title: "This profile has no controllers at all",
    explanation:
      "This profile has zero controllers. Nobody, including its original " +
      "owner, can act on this profile anymore - there is no way to grant " +
      "new permissions or regain control through the profile's normal " +
      "permission system.",
  };
}

// Flag 5: the profile's owner() doesn't actually point to a genuine LSP6
// Key Manager contract. This is the most foundational flag of all - every
// other flag, and every plain-language permission this tool explains,
// assumes AddressPermissions[] is what's actually governing the profile.
// If this flag is triggered, that assumption is false: whatever currently
// owns the profile can act on it directly, and none of the permission data
// anyone reads (including this tool) is being enforced by anything. Like
// no_controllers, this describes something already true on-chain rather
// than a risk that could still be prevented, so there's deliberately no
// in-app "next step" - none exists.
export function checkNoKeyManager(hasKeyManager: boolean): RiskFlagResult {
  const triggered = !hasKeyManager;

  return {
    id: "no_key_manager",
    triggered,
    severity: "critical",
    title: "This profile isn't actually controlled by a Key Manager",
    explanation:
      "This profile's owner isn't a genuine LSP6 Key Manager contract. " +
      "That means the controller permissions this tool reads from " +
      "AddressPermissions[] aren't actually being enforced - whatever " +
      "currently owns this profile can act on it directly, regardless of " +
      "what the permission data says.",
  };
}
