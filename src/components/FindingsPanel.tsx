import { StatusDot } from "./StatusDot";
import { truncateAddress } from "@/lib/format/address";
import type { RiskFlagResult } from "@/lib/risk/riskFlags";

interface FindingsPanelProps {
  flags: RiskFlagResult[];
}

export function FindingsPanel({ flags }: FindingsPanelProps) {
  const triggered = flags
    .filter((flag) => flag.triggered)
    .sort((a, b) =>
      a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1
    );

  if (triggered.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-hairline bg-gradient-to-b from-panel to-panel-raised/40">
        <span className="block h-[3px] w-full bg-vital" aria-hidden="true" />
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <StatusDot tone="clear" />
            <p className="text-sm font-semibold text-paper">
              No risk flags found
            </p>
          </div>
          <p className="mt-1 text-sm text-paper-dim">
            This profile&apos;s controller setup doesn&apos;t match any of the
            patterns this tool checks for.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {triggered.map((flag) => {
        const isCritical = flag.severity === "critical";
        return (
          <div
            key={flag.id}
            className="overflow-hidden rounded-lg border border-hairline bg-gradient-to-b from-panel to-panel-raised/40"
          >
            <span
              className={`block h-[3px] w-full ${
                isCritical ? "bg-coral" : "bg-signal"
              }`}
              aria-hidden="true"
            />
            <div className="px-5 py-4">
              <div className="flex items-center gap-3">
                <StatusDot tone={isCritical ? "critical" : "flagged"} />
                <p className="text-sm font-semibold text-paper">
                  {flag.title}
                </p>
              </div>
              <p className="mt-2 text-sm text-paper-dim">
                {flag.explanation}
              </p>
              {flag.affectedControllers &&
                flag.affectedControllers.length > 0 && (
                  <p className="mt-2 font-mono text-xs text-paper-dim/70">
                    Affects:{" "}
                    {flag.affectedControllers.map(truncateAddress).join(", ")}
                  </p>
                )}
              {flag.nextStep && (
                <p className="mt-3 text-sm text-paper">
                  <span className="text-signal">Next step:</span>{" "}
                  {flag.nextStep}{" "}
                  {flag.nextStepUrl && (
                    <a
                      href={flag.nextStepUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-hairline underline-offset-4 hover:text-vital"
                    >
                      Open permission manager ↗
                    </a>
                  )}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
