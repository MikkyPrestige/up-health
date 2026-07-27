const BLOCKSCOUT_API_BASE_URL =
  process.env.NEXT_PUBLIC_LUKSO_BLOCKSCOUT_API_BASE_URL ??
  "https://explorer.execution.mainnet.lukso.network/api";

interface BlockscoutTransaction {
  timestamp?: string;
}

interface BlockscoutTransactionsResponse {
  items?: BlockscoutTransaction[];
}

import { batchedMap } from "../util/batch";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retrieves the timestamp of a controller's most recent on-chain activity via
// Blockscout's standard v2 API (Handbook Step 3.5). Returns null if there's
// genuinely no activity, or if the request still fails after retrying - this
// is supplementary context, not core structure, so it degrades gracefully
// rather than surfacing as an error.
//
// Retries once on a 429 (rate limited) response specifically, rather than
// treating "throttled" the same as "no activity found" - profiles with many
// controllers can otherwise silently look staler than they really are.
export async function getLastActivityTimestamp(
  address: string,
  attempt = 0
): Promise<string | null> {
  try {
    const response = await fetch(
      `${BLOCKSCOUT_API_BASE_URL}/v2/addresses/${address}/transactions`
    );

    if (response.status === 429 && attempt < 2) {
      await wait(400 * (attempt + 1));
      return getLastActivityTimestamp(address, attempt + 1);
    }

    if (!response.ok) return null;

    const data: BlockscoutTransactionsResponse = await response.json();
    return data.items?.[0]?.timestamp ?? null;
  } catch {
    return null;
  }
}

// Fetches last-activity for many controllers without bursting the API all at
// once - a profile with a dozen controllers firing a dozen simultaneous
// requests is exactly what trips public API rate limits. Small batches with
// a short pause between them is a simple, effective fix.
export async function getLastActivityTimestamps(
  addresses: string[],
  batchSize = 3,
  delayBetweenBatchesMs = 250
): Promise<(string | null)[]> {
  return batchedMap(
    addresses,
    (address) => getLastActivityTimestamp(address),
    batchSize,
    delayBetweenBatchesMs
  );
}
