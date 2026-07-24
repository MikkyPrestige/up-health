interface StatusMessageProps {
  kind: "loading" | "invalid_format" | "not_found" | "network_error";
  detail?: string;
}

const COPY: Record<
  StatusMessageProps["kind"],
  { title: string; body: string }
> = {
  loading: {
    title: "Reading on-chain data…",
    body: "Fetching controllers and permissions directly from LUKSO Mainnet.",
  },
  invalid_format: {
    title: "That doesn't look like a valid address",
    body: "Check the address for typos - it should be a 42-character hex string starting with 0x.",
  },
  not_found: {
    title: "No Universal Profile or Vault found here",
    body: "This address is correctly formatted, but has no LUKSO profile data on Mainnet. Double-check it's the address you meant to look up.",
  },
  network_error: {
    title: "Couldn't reach LUKSO Mainnet",
    body: "This looks like a connection problem, not a missing profile. Check your network and try again.",
  },
};

export function StatusMessage({ kind, detail }: StatusMessageProps) {
  const copy = COPY[kind];
  return (
    <div className="w-full max-w-2xl rounded-md border border-hairline bg-panel px-5 py-4">
      <p className="font-sans text-sm font-semibold text-paper">
        {copy.title}
      </p>
      <p className="mt-1 text-sm text-paper-dim">{copy.body}</p>
      {detail && (
        <p className="mt-2 font-mono text-xs text-paper-dim/70">{detail}</p>
      )}
    </div>
  );
}
