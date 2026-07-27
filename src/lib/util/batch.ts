export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Processes a list of items with a bounded number running at once, rather
// than firing everything in parallel via a single Promise.all. A profile
// with many controllers firing dozens of simultaneous RPC calls is exactly
// the pattern that tripped Blockscout's rate limiting earlier in this
// project - this generalizes that fix so every per-controller fan-out
// (contract detection, controller-kind detection, staleness, etc.) gets the
// same protection, not just the one place that happened to be tested against
// a rate limit first.
export async function batchedMap<T, R>(
  items: T[],
  mapFn: (item: T, index: number) => Promise<R>,
  batchSize = 5,
  delayBetweenBatchesMs = 150
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((item, j) => mapFn(item, i + j))
    );
    results.push(...batchResults);

    if (i + batchSize < items.length) {
      await wait(delayBetweenBatchesMs);
    }
  }

  return results;
}
