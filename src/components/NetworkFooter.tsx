export function NetworkFooter() {
  return (
    <footer className="flex items-center justify-center gap-2 px-6 py-6 text-xs text-paper-dim">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vital opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-vital" />
      </span>
      <span className="font-mono uppercase tracking-[0.15em]">
        LUKSO Mainnet
      </span>
    </footer>
  );
}
