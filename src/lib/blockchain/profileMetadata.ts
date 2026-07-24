import ERC725 from "@erc725/erc725.js";
import { LSP3Schema } from "@erc725/erc725.js/schemas";
import { RPC_URL } from "./luksoClient";

const IPFS_GATEWAY_URL =
  process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL ??
  "https://api.universalprofile.cloud/ipfs";

export interface ProfileDisplayMetadata {
  name?: string;
  avatarUrl?: string;
}

interface Lsp3ProfileImage {
  url?: string;
}

interface Lsp3ProfileJson {
  name?: string;
  profileImage?: Lsp3ProfileImage[];
}

// Retrieves display-only LSP3 metadata (name, avatar). This is purely for
// making results feel human and readable — a profile with no metadata set
// simply returns an empty object rather than throwing (Handbook Step 2.5:
// missing name/avatar is a normal case, not an error).
export async function getProfileMetadata(
  address: string
): Promise<ProfileDisplayMetadata> {
  const erc725 = new ERC725(LSP3Schema, address, RPC_URL, {
    ipfsGateway: IPFS_GATEWAY_URL,
  });

  try {
    const result = await erc725.fetchData("LSP3Profile");
    const value = result.value as { LSP3Profile?: Lsp3ProfileJson } | null;
    const profile = value?.LSP3Profile;
    if (!profile) return {};

    return {
      name: profile.name,
      avatarUrl: resolveIpfsUrl(profile.profileImage?.[0]?.url),
    };
  } catch {
    // No metadata set, or it couldn't be fetched/verified — degrade
    // gracefully rather than surfacing this as an error to the user.
    return {};
  }
}

function resolveIpfsUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("ipfs://")) {
    return `${IPFS_GATEWAY_URL}/${url.replace("ipfs://", "")}`;
  }
  return url;
}
