"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ reset }: ErrorPageProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
        Something went wrong
      </p>
      <h1 className="mt-3 font-sans text-2xl font-semibold text-paper">
        This check didn&apos;t complete
      </h1>
      <p className="mt-3 max-w-md text-sm text-paper-dim">
        That&apos;s on us, not your profile — nothing here reflects on the address
        you looked up. Try again, and if it keeps happening, this is worth
        reporting.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-vital px-6 py-3 font-sans text-sm font-semibold text-ink transition hover:bg-vital/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital/40"
      >
        Try again
      </button>
    </main>
  );
}
