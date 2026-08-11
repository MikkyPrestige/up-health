// Exact bit values confirmed from @lukso/lsp6-contracts' own compiled
// constants (not the same as the main 32-byte PERMISSIONS bitfield - this
// is a separate, smaller 4-flag bitmask used only within AllowedCalls
// entries to say which *style* of interaction is permitted with a
// specific allowed target).
const CALLTYPE_BITS: Record<string, number> = {
  "transfer value": 0x00000001,
  call: 0x00000002,
  "static call": 0x00000004,
  "delegate call": 0x00000008,
};

export function decodeCallTypes(callTypesHex: string): string[] {
  const value = parseInt(callTypesHex, 16);
  if (Number.isNaN(value)) return [];

  return Object.entries(CALLTYPE_BITS)
    .filter(([, bit]) => (value & bit) === bit)
    .map(([label]) => label);
}
