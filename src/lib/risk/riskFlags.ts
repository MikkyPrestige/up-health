import type { ControllerBreakdown } from "../blockchain/controllerPermissions";

export interface RiskFlagResult {
  id:
    | "concentrated_power"
    | "no_recovery_path"
    | "suspicious_delegate"
    | "no_controllers"
    | "no_key_manager"
    | "governing_only_controller"
    | "incident_linked_controller";
  triggered: boolean;
  // "critical" is reserved for a fundamentally different category than the
  // others: not "this is risky," but "this has already happened." no_controllers
  // and no_key_manager can't be undone through the profile's own permission
  // system; incident_linked_controller uses it only when the attacker's key
  // itself is present, which is removable but means the compromise occurred.
  severity: "warning" | "critical";
  title: string;
  // Plain-language parts shown in the findings card. `explanation` is "why it
  // matters"; whyKeep and whatCouldStop give the other side of the trade-off,
  // because the chain records what a controller CAN do, not what it's for, so
  // a flag is never proof that something is wrong.
  explanation: string;
  whyKeep?: string;
  nextStep?: string; // "what to do"
  whatCouldStop?: string;
  nextStepUrl?: string;
  nextStepLabel?: string; // defaults to "Open permission manager" in the UI
  affectedControllers?: `0x${string}`[];
}

const PERMISSION_MANAGER_URL = "https://permissioncontrol.app";
// The tool LUKSO named in its incident instructions for removing controllers.
const UP_AUTHORIZE_URL = "https://authorize.universalprofile.cloud/authorize";

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
    title: "Some controllers can add new controllers and send your funds",
    explanation:
      "If the key for one of these is ever stolen, the thief could send " +
      "your funds and also add their own key. Removing the stolen one " +
      "afterwards might not be enough.",
    whyKeep:
      "Devices you use every day, like your phone or browser extension, " +
      "often hold both. So this isn't always a mistake.",
    nextStep:
      "Keep this power on as few controllers as you can. Remove it from " +
      "any you don't recognise or no longer use.",
    whatCouldStop:
      "If you remove a controller, the device or app using it loses " +
      "access to your profile. If you only take away some permissions, " +
      "it can no longer send funds or add devices.",
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
    title: "Only one controller, so no backup",
    explanation:
      "If you lose access to this one controller, nobody can get into " +
      "your profile again.",
    whyKeep:
      "Some people keep a single controller on purpose to keep things " +
      "simple. It works, until something goes wrong with that device.",
    nextStep:
      "Add a second controller as a backup. Keep its key somewhere safe, " +
      "and only give it the permissions a backup needs.",
    whatCouldStop:
      "Adding a backup doesn't change how anything works today. It just " +
      "means you have a way back in.",
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
    title: "The automatic helper on this profile may not be set up right",
    explanation:
      "Your profile has a small program that runs by itself whenever you " +
      "receive assets or messages. The one set here doesn't look like the " +
      "kind that's supposed to do that job.",
    whyKeep:
      "It may be intentional, such as a custom one you or an app set up " +
      "on purpose.",
    nextStep:
      "Check that you recognise this address. If you don't, replace or " +
      "remove it.",
    whatCouldStop:
      "You'll still receive assets and messages. Only that automatic " +
      "reaction stops.",
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
    title: "Nobody can use this profile",
    explanation:
      "This profile has no controllers, so nobody can act on it, " +
      "including its original owner. There's no way to give anyone " +
      "access again.",
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
    title: "This profile isn't protected by the usual permission system",
    explanation:
      "Profiles normally use a 'Key Manager' to enforce who can do what. " +
      "This one doesn't, so the permissions shown here aren't being " +
      "enforced. Whatever owns the profile can act on it directly.",
  };
}

// Flag 6: a controller holds governing power (ADDCONTROLLER/EDITPERMISSIONS)
// without broad execution power. Flag 1 already covers the combination, so
// those controllers are excluded here. Alone this is LUKSO's recovery
// pattern, but the Nov 2026 email-recovery incident showed a lone
// ADDCONTROLLER controller is enough to take a profile: it can add a key
// with any permissions. So it's surfaced as something to recognize, not as
// a fault.
export function checkGoverningOnlyController(
  controllers: ControllerBreakdown[]
): RiskFlagResult {
  const affected = controllers.filter((controller) => {
    const hasGoverningPower = GOVERNING_PERMISSIONS.some(
      (permission) => controller.decodedPermissions[permission]
    );
    const hasBroadPower = BROAD_EXECUTION_OR_TRANSFER_PERMISSIONS.some(
      (permission) => controller.decodedPermissions[permission]
    );
    return hasGoverningPower && !hasBroadPower;
  });

  return {
    id: "governing_only_controller",
    triggered: affected.length > 0,
    severity: "warning",
    title: "A controller can add new controllers",
    explanation:
      "It can't send funds itself, but it can add a new controller with " +
      "any permissions, which comes to the same thing.",
    whyKeep:
      "This is the usual setup for a backup key, so it's often fine. " +
      "It's worth a check, not a fix.",
    nextStep:
      "If you recognise it and trust whoever holds its key, there's " +
      "nothing to do. If you don't recognise it, remove it completely.",
    whatCouldStop:
      "Removing a backup key means you lose that way back in if you lose " +
      "your main device. Make sure you have another way in first.",
    nextStepUrl: PERMISSION_MANAGER_URL,
    affectedControllers: affected.map((controller) => controller.address),
  };
}

export interface IncidentHit {
  address: `0x${string}`;
  label: string;
  role: "attacker_key" | "recovery_profile";
  // True when the address still holds any permission on this profile. False
  // means it's only left over in the controller list (e.g. its permissions
  // were already cleared but the slot was never removed).
  hasPermissions: boolean;
}

// The UP Authorize page defaults to a "Standard Wallet" preset that includes
// super permissions, so the safe action there is easy to get backwards.
const AUTHORIZE_PAGE_WARNING =
  "On that page, use only the red 'Remove Controller Key' button. The " +
  "'Authorize' button gives permissions, which is the opposite of what you want.";

// Flag 7: the profile holds a permission entry (or lists a controller) for
// an address LUKSO named in the Nov 2026 email-recovery incident. Takes
// hits found by reading those addresses' permission keys directly, because
// the post-mortem says the attacker key may not appear in the controller
// list. A hit that still holds permissions is the live risk; a hit with none
// is leftover clutter, and says so rather than claiming it can act.
export function checkIncidentLinkedController(
  hits: IncidentHit[]
): RiskFlagResult {
  const triggered = hits.length > 0;
  const active = hits.filter((hit) => hit.hasPermissions);
  const attackerActive = active.some((hit) => hit.role === "attacker_key");
  const anyActive = active.length > 0;

  const title = attackerActive
    ? "The attacker's key from LUKSO's November 2026 incident is on this profile"
    : anyActive
      ? "A recovery controller from LUKSO's November 2026 incident still has access"
      : "A controller from LUKSO's November 2026 incident is still listed on this profile";

  const explanation = attackerActive
    ? "LUKSO identified this address as the attacker's key, and it still " +
      "has access to your profile. Removing its permissions isn't enough. " +
      "Remove the key completely. Any recovery controller listed below " +
      "should go too."
    : anyActive
      ? "LUKSO's email recovery has been switched off, but this controller " +
        "from it still has permissions on your profile. Controllers like it " +
        "were used to add the attacker's key."
      : "It has no permissions, so it can't do anything right now. But " +
        "importing your profile or adding a device can give its " +
        "permissions back.";

  return {
    id: "incident_linked_controller",
    triggered,
    severity: attackerActive ? "critical" : "warning",
    title,
    explanation,
    whatCouldStop: anyActive
      ? "Removing it won't change how your profile works day to day. The " +
        "email recovery it belonged to has been switched off."
      : "Nothing. It already can't do anything on your profile.",
    nextStep: anyActive
      ? "Remove the listed controller completely, and make a file backup. " +
        "Follow only LUKSO's official channels; LUKSO will never ask for " +
        "your recovery phrase. " +
        AUTHORIZE_PAGE_WARNING
      : "Remove it completely so it can't come back. " +
        AUTHORIZE_PAGE_WARNING,
    nextStepUrl: UP_AUTHORIZE_URL,
    nextStepLabel: "Open UP Authorize",
    affectedControllers: hits.map((hit) => hit.address),
  };
}
