import { isAddress, isAddressEqual } from "viem";

// The single, centralized answer to "does the connected wallet own the
// profile being examined?" (Handbook Step 3.2). Every feature that gates on
// ownership — risk flags, staleness, next steps — must call this function
// rather than re-implementing the comparison, since getting this wrong in
// either direction has real consequences (exposing sensitive findings to a
// stranger, or hiding them from the actual owner).
export function isVerifiedOwner(
  connectedAddress: string | null,
  profileAddress: string
): boolean {
  if (!connectedAddress) return false;
  if (!isAddress(connectedAddress) || !isAddress(profileAddress)) return false;

  // isAddressEqual handles checksum-casing differences correctly rather than
  // comparing raw strings, which would wrongly treat the same address as a
  // mismatch if the two came from sources using different letter casing.
  return isAddressEqual(connectedAddress, profileAddress);
}
