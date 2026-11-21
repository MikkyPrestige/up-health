// Addresses LUKSO listed for the November 2026 email-recovery incident.
// Lowercased so comparisons never depend on checksum casing.
export interface IncidentAddress {
  address: `0x${string}`;
  label: string;
  role: "attacker_key" | "recovery_profile";
}

export const INCIDENT_ADDRESSES: IncidentAddress[] = [
  {
    address: "0xa2f8fd85366d1b4a3b13c33a48cd959f6d1ba3a7",
    label: "attacker key",
    role: "attacker_key",
  },
  ...[
    "0xd6ebb3c5c1836f5377d134c303f4ebb053562f6f",
    "0x2e90c2ff7e9bbd9381c8e4ea030666f9c6090727",
    "0x9f44982b472431bedefc1dc92149ca2ea09820aa",
    "0x348ea31074263385a87e2b83f5ab58a7678205f7",
    "0x22e4f54586676158b7d5251e457383e499903617",
    "0x5827b91d84050d3a8e159c27e16b0d7426f66aeb",
    "0x4a252e46a640fb2c45f0e74bac9448f68fe66d63",
    "0xeb7a7b91b5b7188c098cb64dd01f59c9d876566d",
    "0xbe8ea52ca32c51024e8b11c2719d9edb94b21d16",
    "0x242387f645a327af3f1e34f3a9a9032beee69fb0",
  ].map((address, i) => ({
    address: address as `0x${string}`,
    label: `recovery-up${i + 1}`,
    role: "recovery_profile" as const,
  })),
];

export function findIncidentAddress(
  address: string
): IncidentAddress | undefined {
  const lower = address.toLowerCase();
  return INCIDENT_ADDRESSES.find((entry) => entry.address === lower);
}
