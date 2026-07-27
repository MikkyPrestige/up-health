interface GridBannerProps {
  connectedAddress: `0x${string}` | null;
}

export function GridBanner({ connectedAddress }: GridBannerProps) {
  return (
    <div className="hero-enter w-full max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-vital">
        Universal Profile diagnostics
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="" className="h-6 w-6 shrink-0" />
        <h1 className="font-sans text-xl font-semibold tracking-tight text-paper">
          UP Health
        </h1>
      </div>
      <p className="mt-2 text-sm text-paper-dim">
        {connectedAddress
          ? "Showing diagnostics for this Grid's profile."
          : "Connect to see the full risk breakdown for this Grid's profile."}
      </p>
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-sm text-paper-dim underline decoration-hairline underline-offset-4 transition hover:text-paper"
      >
        Open full UP Health to check another profile ↗
      </a>
    </div>
  );
}
