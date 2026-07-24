interface VitalsRuleProps {
  className?: string;
}

// A thin ECG-style trace that draws itself once on load (see the
// .vitals-rule animation in globals.css). It divides a report's summary
// from its detail - a structural device grounded in the app's own name,
// not decoration for its own sake.
export function VitalsRule({ className = "" }: VitalsRuleProps) {
  return (
    <svg
      className={`vitals-rule h-6 w-full ${className}`}
      viewBox="0 0 400 24"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0,12 L150,12 L158,2 L166,22 L174,4 L182,12 L250,12 L258,2 L266,22 L274,4 L282,12 L400,12"
        stroke="var(--color-vital)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
