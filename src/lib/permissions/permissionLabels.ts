// Centralized, single source of truth for translating LSP6 technical permission
// names into plain-language statements. Every place in the app that displays a
// controller's permissions should read from here, not re-derive its own wording.
// (Handbook Step 2.3 — keeps future tone adjustments a one-place change.)

export const PERMISSION_LABELS: Record<string, string> = {
  CHANGEOWNER: "transfer ownership of this profile",
  ADDCONTROLLER: "add new controllers",
  EDITPERMISSIONS: "change existing controllers' permissions",
  ADDEXTENSIONS: "add new extensions",
  CHANGEEXTENSIONS: "change or remove existing extensions",
  ADDUNIVERSALRECEIVERDELEGATE: "add a new Universal Receiver Delegate",
  CHANGEUNIVERSALRECEIVERDELEGATE:
    "change or remove the Universal Receiver Delegate",
  REENTRANCY: "make reentrant calls back into this profile",
  SUPER_TRANSFERVALUE: "transfer LYX or tokens, without restriction",
  TRANSFERVALUE: "transfer LYX or tokens, within allowed limits",
  SUPER_CALL: "call any external contract, without restriction",
  CALL: "call external contracts, within allowed limits",
  SUPER_STATICCALL:
    "make read-only calls to any external contract, without restriction",
  STATICCALL: "make read-only calls to external contracts, within allowed limits",
  SUPER_DELEGATECALL:
    "make delegate calls to any external contract, without restriction",
  DELEGATECALL: "make delegate calls to external contracts, within allowed limits",
  DEPLOY: "deploy new smart contracts from this profile",
  SUPER_SETDATA: "change any piece of profile data, without restriction",
  SETDATA: "change specific pieces of profile data, within allowed limits",
  ENCRYPT: "encrypt data on behalf of this profile",
  DECRYPT: "decrypt data on behalf of this profile",
  SIGN: "sign messages on behalf of this profile",
  EXECUTE_RELAY_CALL: "execute gasless (relayed) transactions on this profile's behalf",
};

export function permissionLabel(permissionName: string): string {
  return PERMISSION_LABELS[permissionName] ?? permissionName;
}
