// Confirmed directly from LUKSO's own compiled @lukso/lsp{0,7,8,9}-contracts
// packages, including historical versions where the interface ID has
// changed across spec revisions - a restriction could reference an older
// deployed token contract using a previous version's interface ID.
const KNOWN_STANDARDS: Record<string, string> = {
  "0x24871b3d": "Universal Profile",
  "0x3e89ad98": "Universal Profile (older version)",
  "0xc52d6008": "LSP7 Token",
  "0xb3c4928f": "LSP7 Token (older version)",
  "0xdaa746b7": "LSP7 Token (older version)",
  "0x3a271706": "LSP8 NFT",
  "0xecad9f75": "LSP8 NFT (older version)",
  "0x30dc5278": "LSP8 NFT (older version)",
  "0x28af17e6": "Vault",
};

export function standardLabel(interfaceId: string): string {
  return KNOWN_STANDARDS[interfaceId.toLowerCase()] ?? interfaceId;
}
