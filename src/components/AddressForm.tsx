"use client";

import { truncateAddress } from "@/lib/format/address";

interface AddressFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  connectedAddress: `0x${string}` | null;
  isConnecting: boolean;
  connectionError: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function AddressForm({
  value,
  onChange,
  onSubmit,
  connectedAddress,
  isConnecting,
  connectionError,
  onConnect,
  onDisconnect,
}: AddressFormProps) {
  return (
    <div className="hero-enter w-full max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-vital">
        Universal Profile diagnostics
      </p>
      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-vital/10 ring-1 ring-vital/25 sm:h-16 sm:w-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" className="h-8 w-8 sm:h-9 sm:w-9" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          <span className="text-vital">UP</span>{" "}
          <span className="text-paper">Health</span>
        </h1>
      </div>
      <p className="mt-5 max-w-lg text-balance text-paper-dim">
        Paste a Universal Profile address. See exactly who can do what to it,
        and whether anything is worth a closer look.
      </p>

      <form
        className="mt-8 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="0x..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-md border border-hairline bg-panel px-4 py-3 font-mono text-base text-paper placeholder:text-paper-dim/60 focus:border-vital focus:outline-none focus-visible:ring-2 focus-visible:ring-vital/40"
        />
        <button
          type="submit"
          className="rounded-md bg-vital px-6 py-3 font-sans text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-vital/90 hover:shadow-lg hover:shadow-vital/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital/40"
        >
          Check profile
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        {connectedAddress ? (
          <>
            <span className="font-mono text-paper-dim">
              Connected as{" "}
              <span className="text-vital">
                {truncateAddress(connectedAddress)}
              </span>
            </span>
            <button
              type="button"
              onClick={onDisconnect}
              className="text-paper-dim underline decoration-hairline underline-offset-4 transition hover:text-coral"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            disabled={isConnecting}
            className="font-sans text-paper-dim underline decoration-hairline underline-offset-4 transition hover:text-paper disabled:opacity-60"
          >
            {isConnecting ? "Connecting…" : "Or connect your wallet instead"}
          </button>
        )}
      </div>
      {connectionError && (
        <p className="mt-2 text-sm text-coral">{connectionError}</p>
      )}
    </div>
  );
}
