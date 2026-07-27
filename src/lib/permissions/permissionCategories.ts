export interface PermissionCategory {
  id: string;
  label: string;
  description: string;
  permissions: string[];
}

// Every one of LUKSO's 22 LSP6 permissions maps to exactly one category
// here - a clean partition, cross-checked against permissionLabels.ts's own
// completeness test. Categories exist so a controller's capabilities can be
// read at a glance (a handful of short labels) rather than as a wall of
// full-sentence sub-permissions - the detailed statements still live in the
// full-detail view, grouped under their category.
//
// Labels and descriptions are deliberately written in plain language, not
// LSP6/web3 terminology - this tool's whole reason for existing is that
// most Universal Profile holders can't parse permission jargon; someone who
// already can has no need for this tool and would just read the chain
// directly.
export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: "ownership",
    label: "Transfer profile ownership",
    description:
      "Can hand over full ownership of this profile to a different address entirely.",
    permissions: ["CHANGEOWNER"],
  },
  {
    id: "governance",
    label: "Add or remove controllers",
    description:
      "Can add new controllers to this profile, or change what existing controllers are allowed to do.",
    permissions: ["ADDCONTROLLER", "EDITPERMISSIONS"],
  },
  {
    id: "move_funds",
    label: "Send funds from this profile",
    description: "Can send LYX or tokens out of this profile.",
    permissions: ["SUPER_TRANSFERVALUE", "TRANSFERVALUE"],
  },
  {
    id: "call_contracts",
    label: "Interact with other apps",
    description:
      "Can use this profile to interact with other apps and services on LUKSO.",
    permissions: [
      "SUPER_CALL",
      "CALL",
      "SUPER_DELEGATECALL",
      "DELEGATECALL",
    ],
  },
  {
    id: "read_only",
    label: "View data from other apps",
    description:
      "Can look up information from other apps without changing anything.",
    permissions: ["SUPER_STATICCALL", "STATICCALL"],
  },
  {
    id: "deploy",
    label: "Create new smart contracts",
    description: "Can deploy new smart contracts from this profile.",
    permissions: ["DEPLOY"],
  },
  {
    id: "edit_data",
    label: "Edit this profile's data",
    description:
      "Can change information stored on this profile, like its name or picture.",
    permissions: ["SUPER_SETDATA", "SETDATA"],
  },
  {
    id: "sign_encrypt",
    label: "Sign & encrypt on your behalf",
    description:
      "Can sign messages, or encrypt and decrypt data, as this profile.",
    permissions: ["SIGN", "ENCRYPT", "DECRYPT"],
  },
  {
    id: "gasless",
    label: "Send fee-free transactions",
    description:
      "Can send transactions on this profile's behalf without directly paying network fees.",
    permissions: ["EXECUTE_RELAY_CALL"],
  },
  {
    id: "delegates",
    label: "Control automatic reactions",
    description:
      "Can set up code that runs automatically whenever this profile receives assets or notifications.",
    permissions: [
      "ADDUNIVERSALRECEIVERDELEGATE",
      "CHANGEUNIVERSALRECEIVERDELEGATE",
    ],
  },
  {
    id: "extensions",
    label: "Add new profile features",
    description:
      "Can add or change extra capabilities this profile supports.",
    permissions: ["ADDEXTENSIONS", "CHANGEEXTENSIONS"],
  },
  {
    id: "reentrancy",
    label: "Perform nested profile actions",
    description:
      "Can call back into this profile in the middle of another action already in progress.",
    permissions: ["REENTRANCY"],
  },
];

export interface ActiveCategory extends PermissionCategory {
  // The subset of this category's permissions the controller actually has -
  // used to show the specific statements grouped under the category header
  // in the full-detail view.
  activePermissions: string[];
}

// Returns only the categories a controller actually has any permission in,
// each carrying just the subset of permissions that applied - order follows
// PERMISSION_CATEGORIES's own severity-conscious ordering (ownership and
// governance first, since those matter most).
export function getActiveCategories(
  decodedPermissions: Record<string, boolean>
): ActiveCategory[] {
  const active: ActiveCategory[] = [];

  for (const category of PERMISSION_CATEGORIES) {
    const activePermissions = category.permissions.filter(
      (permission) => decodedPermissions[permission]
    );
    if (activePermissions.length > 0) {
      active.push({ ...category, activePermissions });
    }
  }

  return active;
}
