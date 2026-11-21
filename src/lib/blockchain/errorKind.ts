// Separates "couldn't reach the RPC" from "reached it, but something in the
// data or our handling of it threw". The first is worth telling the user to
// retry; the second isn't a connection problem, and saying so is misleading.
const NETWORK_PATTERNS = [
  /http request failed/i,
  /fetch failed/i,
  /failed to fetch/i,
  /network/i,
  /timed? ?out|timeout/i,
  /ENOTFOUND|ECONNRESET|ECONNREFUSED|ETIMEDOUT/i,
  /rate limit|429/i,
];

export function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const name = err.name ?? "";
  if (/HttpRequestError|TimeoutError|RpcRequestError/.test(name)) return true;
  // viem wraps the underlying cause, so check the chain as well as the top.
  let current: unknown = err;
  for (let depth = 0; depth < 4; depth++) {
    if (!(current instanceof Error)) break;
    const message = current.message;
    if (NETWORK_PATTERNS.some((pattern) => pattern.test(message))) {
      return true;
    }
    current = (current as Error & { cause?: unknown }).cause;
  }
  return false;
}
