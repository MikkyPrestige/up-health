import type { ControllerKind } from "../blockchain/controllerKind";
import type { ControllerRestrictions } from "../blockchain/controllerRestrictions";

export interface ControllerRole {
  // One plain sentence about what this controller can do. Capability, never
  // purpose: the chain records what a controller is allowed to do, not what
  // it's for, so this never claims to know that.
  headline: string;
  // Optional second sentence, shown in the detail view only.
  note?: string;
}

const has = (perms: Record<string, boolean>, ...names: string[]) =>
  names.some((name) => perms[name]);

// A non-SUPER permission (CALL, TRANSFERVALUE, SETDATA...) only does
// something when a matching allow-list entry exists; with none configured
// it's inert. Mirrors the restriction logic already shown in the detail view.
function limitedCallAllowed(
  restrictions: ControllerRestrictions,
  ...callTypes: string[]
): boolean {
  return (restrictions.allowedCalls ?? []).some((entry) =>
    entry.callTypes.some((type) => callTypes.includes(type))
  );
}

export function describeControllerRole(
  perms: Record<string, boolean>,
  kind: ControllerKind,
  restrictions: ControllerRestrictions
): ControllerRole {
  const holdsAnything = Object.values(perms).some(Boolean);
  if (!holdsAnything) {
    return {
      headline: "Listed, but it can't do anything on this profile.",
    };
  }

  const governs = has(perms, "ADDCONTROLLER", "EDITPERMISSIONS");
  const spendAny = has(perms, "SUPER_TRANSFERVALUE");
  const spendSome =
    has(perms, "TRANSFERVALUE") &&
    limitedCallAllowed(restrictions, "transfer value");
  const callAny = has(perms, "SUPER_CALL", "SUPER_DELEGATECALL");
  const callSome =
    has(perms, "CALL", "DELEGATECALL") &&
    limitedCallAllowed(restrictions, "call", "delegate call");
  const editAny = has(perms, "SUPER_SETDATA");
  const editSome =
    has(perms, "SETDATA") && (restrictions.allowedDataKeyCount ?? 0) > 0;
  const signs = has(perms, "SIGN", "ENCRYPT", "DECRYPT");
  const reads = has(perms, "SUPER_STATICCALL", "STATICCALL");
  const hasPower = governs || spendAny || spendSome || callAny || callSome;

  // A receiver delegate is code the profile runs on its own, not a person's
  // key, so describe that first. Flag it if it also holds real power.
  if (kind === "delegate-contract") {
    return {
      headline:
        "An automatic helper. It runs by itself when your profile receives assets or messages.",
      note: hasPower
        ? "It also holds powerful permissions, which most automatic helpers don't need. Check that you set that up."
        : undefined,
    };
  }

  if (has(perms, "CHANGEOWNER")) {
    return {
      headline: "Can hand this profile over to someone else completely.",
    };
  }

  if (governs && spendAny) {
    return {
      headline:
        "Can do almost everything. It can add other controllers and send funds.",
    };
  }

  if (governs && (callAny || spendSome || callSome)) {
    return {
      headline:
        "Can add other controllers and act for this profile, so it could give itself more power.",
    };
  }

  if (governs) {
    return {
      headline:
        "Can add or change other controllers. It can't send funds itself, but it can give itself or others that power.",
      note: "This is how a recovery key is usually set up. Worth checking that you recognise it.",
    };
  }

  if (spendAny && callAny) {
    return {
      headline:
        "Can send funds and use this profile with any app. It can't add other controllers.",
    };
  }

  if (spendAny) {
    return {
      headline: "Can send funds from this profile. It can't add other controllers.",
    };
  }

  if (spendSome) {
    return {
      headline: "Can send funds, but only to the addresses it has been allowed.",
    };
  }

  if (callAny) {
    return {
      headline:
        "Can use this profile with any app. It can't send funds or add controllers.",
    };
  }

  if (callSome) {
    return { headline: "Can use this profile with specific apps only." };
  }

  if (editAny) {
    return {
      headline:
        "Can change this profile's information, like its name or picture. It can't send funds.",
    };
  }

  if (editSome) {
    return { headline: "Can change some parts of this profile's data only." };
  }

  if (signs && !reads) {
    return { headline: "Can sign and encrypt as this profile. Nothing else." };
  }

  if (reads && !signs) {
    return { headline: "Can only read information from other apps." };
  }

  // Remaining cases: only permissions that currently do nothing (nothing is
  // allowed for them), or a mix of minor ones such as extensions or relay.
  const onlyInert =
    (has(perms, "TRANSFERVALUE", "CALL", "DELEGATECALL", "SETDATA") &&
      !signs &&
      !reads &&
      !has(
        perms,
        "DEPLOY",
        "ADDEXTENSIONS",
        "CHANGEEXTENSIONS",
        "ADDUNIVERSALRECEIVERDELEGATE",
        "CHANGEUNIVERSALRECEIVERDELEGATE",
        "EXECUTE_RELAY_CALL",
        "REENTRANCY"
      ));
  if (onlyInert) {
    return {
      headline:
        "Holds permissions that currently do nothing, because nothing has been allowed for them.",
    };
  }

  return {
    headline: "Has a limited set of permissions. Open the details to see them.",
  };
}
