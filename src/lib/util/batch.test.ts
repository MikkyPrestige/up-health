import { describe, it, expect, vi } from "vitest";
import { batchedMap } from "./batch";

describe("batchedMap", () => {
  it("processes every item and preserves order in the results", async () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    const results = await batchedMap(items, async (n) => n * 10, 3, 0);
    expect(results).toEqual([10, 20, 30, 40, 50, 60, 70]);
  });

  it("never has more than batchSize items in flight at once", async () => {
    let concurrent = 0;
    let maxConcurrent = 0;

    const items = Array.from({ length: 11 }, (_, i) => i);
    await batchedMap(
      items,
      async (n) => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise((resolve) => setTimeout(resolve, 5));
        concurrent--;
        return n;
      },
      4,
      0
    );

    expect(maxConcurrent).toBeLessThanOrEqual(4);
  });

  it("pauses between batches but not after the final batch", async () => {
    vi.useFakeTimers();
    const waits: number[] = [];
    const originalSetTimeout = globalThis.setTimeout;
    vi.spyOn(globalThis, "setTimeout").mockImplementation(((
      fn: () => void,
      ms?: number
    ) => {
      if (typeof ms === "number") waits.push(ms);
      return originalSetTimeout(fn, 0);
    }) as typeof setTimeout);

    const promise = batchedMap([1, 2, 3, 4, 5], async (n) => n, 2, 100);
    await vi.runAllTimersAsync();
    await promise;

    // 5 items in batches of 2 -> 3 batches -> exactly 2 pauses between them,
    // none after the last batch.
    expect(waits.filter((ms) => ms === 100)).toHaveLength(2);

    vi.useRealTimers();
  });

  it("handles an empty list without error", async () => {
    const results = await batchedMap([], async (n: number) => n, 3, 0);
    expect(results).toEqual([]);
  });

  it("handles a list smaller than the batch size in a single batch", async () => {
    const results = await batchedMap([1, 2], async (n) => n * 2, 10, 0);
    expect(results).toEqual([2, 4]);
  });
});
