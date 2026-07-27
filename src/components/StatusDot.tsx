interface StatusDotProps {
  tone: "clear" | "flagged" | "critical" | "neutral";
}

export function StatusDot({ tone }: StatusDotProps) {
  const colorClass =
    tone === "critical"
      ? "bg-coral"
      : tone === "flagged"
        ? "bg-signal"
        : tone === "clear"
          ? "bg-vital"
          : "bg-paper-dim";

  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${colorClass}`}
      aria-hidden="true"
    />
  );
}
