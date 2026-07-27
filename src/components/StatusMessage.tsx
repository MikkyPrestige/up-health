interface StatusMessageProps {
  kind: "loading" | "invalid_format" | "not_found" | "network_error";
  reason?: "no_code" | "unrecognized_contract";
  detail?: string;
}

const COPY: Record<
  Exclude<StatusMessageProps["kind"], "not_found">,
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
  network_error: {
    title: "Couldn't reach LUKSO Mainnet",
    body: "This looks like a connection problem, not a missing profile. Check your network and try again.",
  },
};

// The two "not found" cases get distinct copy: a plain wallet address (no
// contract code at all) is very often someone pasting a controller/wallet
// address by mistake instead of the Universal Profile it controls, so that
// gets a more specific, actionable message rather than the generic one.
const NOT_FOUND_COPY: Record<
  NonNullable<StatusMessageProps["reason"]>,
  { title: string; body: string }
> = {
  no_code: {
    title: "This looks like a wallet address, not a profile",
    body: "This address has no Universal Profile or Vault data - it appears to be a regular wallet (EOA). If you meant to check a controller's own profile, look up the Universal Profile it controls instead, not the controller address itself.",
  },
  unrecognized_contract: {
    title: "No Universal Profile or Vault found here",
    body: "This address is a smart contract, but not one with recognizable Universal Profile or Vault data on LUKSO Mainnet. Double-check it's the address you meant to look up.",
  },
};

export function StatusMessage({ kind, reason, detail }: StatusMessageProps) {
  const copy =
    kind === "not_found"
      ? NOT_FOUND_COPY[reason ?? "unrecognized_contract"]
      : COPY[kind];

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
