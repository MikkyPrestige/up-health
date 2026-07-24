import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-vital">
        404
      </p>
      <h1 className="mt-3 font-sans text-2xl font-semibold text-paper">
        Nothing here
      </h1>
      <p className="mt-3 max-w-md text-sm text-paper-dim">
        This page doesn&apos;t exist. If you were looking up a Universal
        Profile, head back and paste its address there instead.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-vital px-6 py-3 font-sans text-sm font-semibold text-ink transition hover:bg-vital/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital/40"
      >
        Back to UP Health
      </Link>
    </main>
  );
}
