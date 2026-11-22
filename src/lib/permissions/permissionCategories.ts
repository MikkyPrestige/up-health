export interface PermissionCategory {
  id: string;
  label: string;
  description: string;
  // What generally stops working if this category is taken away. Deliberately
  // general: the chain records what a controller can do, not which apps rely
  // on it, so these never claim a specific app will break.
  ifRemoved: string;
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
    ifRemoved:
      "Nothing changes day to day. This controller just can't hand your profile to someone else.",
    permissions: ["CHANGEOWNER"],
  },
  {
    id: "governance",
    label: "Add or remove controllers",
    description:
      "Can add new controllers to this profile, or change what existing controllers are allowed to do.",
    ifRemoved:
      "It can no longer add devices or change who can do what. If this is your backup key, you lose that way back in.",
    permissions: ["ADDCONTROLLER", "EDITPERMISSIONS"],
  },
  {
    id: "move_funds",
    label: "Send funds from this profile",
    description: "Can send LYX or tokens out of this profile.",
    ifRemoved:
      "It can no longer send LYX or tokens. Anything that sends for you, like an app or a device, will fail when it tries.",
    permissions: ["SUPER_TRANSFERVALUE", "TRANSFERVALUE"],
  },
  {
    id: "call_contracts",
    label: "Interact with other apps",
    description:
      "Can use this profile to interact with other apps and services on LUKSO.",
    ifRemoved:
      "Apps that act through your profile, like swaps, marketplaces and games, will stop working with this controller.",
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
    ifRemoved:
      "It can no longer look things up from other apps. Some apps may show blank or out-of-date information.",
    permissions: ["SUPER_STATICCALL", "STATICCALL"],
  },
  {
    id: "deploy",
    label: "Create new smart contracts",
    description: "Can deploy new smart contracts from this profile.",
    ifRemoved:
      "It can no longer create new contracts. Only matters if you build or launch things from this profile.",
    permissions: ["DEPLOY"],
  },
  {
    id: "edit_data",
    label: "Edit this profile's data",
    description:
      "Can change information stored on this profile, like its name or picture.",
    ifRemoved:
      "It can no longer change your name, picture or other profile info. Apps that save settings to your profile may fail to save them.",
    permissions: ["SUPER_SETDATA", "SETDATA"],
  },
  {
    id: "sign_encrypt",
    label: "Sign & encrypt on your behalf",
    description:
      "Can sign messages, or encrypt and decrypt data, as this profile.",
    ifRemoved:
      "It can no longer sign messages as you or read encrypted data. Signing in to some apps may stop working.",
    permissions: ["SIGN", "ENCRYPT", "DECRYPT"],
  },
  {
    id: "gasless",
    label: "Send fee-free transactions",
    description:
      "Can send transactions on this profile's behalf without directly paying network fees.",
    ifRemoved:
      "It can no longer send transactions where someone else pays the fee. Apps that offer fee-free actions may stop working.",
    permissions: ["EXECUTE_RELAY_CALL"],
  },
  {
    id: "delegates",
    label: "Control automatic reactions",
    description:
      "Can set up code that runs automatically whenever this profile receives assets or notifications.",
    ifRemoved:
      "It can no longer change how your profile reacts to receiving assets or messages. What's already set up keeps running.",
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
    ifRemoved:
      "It can no longer add or change extra features. Features already added keep working.",
    permissions: ["ADDEXTENSIONS", "CHANGEEXTENSIONS"],
  },
  {
    id: "reentrancy",
    label: "Perform nested profile actions",
    description:
      "Can call back into this profile in the middle of another action already in progress.",
    ifRemoved:
      "Some advanced, multi-step actions may fail. Most people never need this.",
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
