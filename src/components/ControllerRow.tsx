import { StatusDot } from "./StatusDot";
import { truncateAddress, formatTimestamp } from "@/lib/format/address";
import { controllerKindLabel } from "@/lib/blockchain/controllerKind";
import type { ControllerReportRow } from "@/hooks/useProfileReport";

interface ControllerRowProps {
  controller: ControllerReportRow;
  isFlagged: boolean;
  onExpand: () => void;
  // Only true for the verified owner - staleness data is only ever computed
  // for them, so this decides whether to show it at all. Showing "No
  // on-chain activity found" to someone we never checked for would falsely
  // imply we looked, the same trap the summary line already avoids.
  showStaleness: boolean;
}

// Permissions shown before the card defers to the detail modal - keeps every
// card the same fixed height regardless of how many permissions a controller
// holds, so the grid stays uniform both on load and while interacting with it.
const VISIBLE_PERMISSIONS_LIMIT = 4;

export function ControllerRow({
  controller,
  isFlagged,
  onExpand,
  showStaleness,
}: ControllerRowProps) {
  const statements = controller.canStatements;
  const hasOverflow = statements.length > VISIBLE_PERMISSIONS_LIMIT;
  const visibleStatements = statements.slice(0, VISIBLE_PERMISSIONS_LIMIT);

  return (
    <div className="flex h-full flex-col rounded-md border border-hairline bg-panel px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <StatusDot tone={isFlagged ? "flagged" : "clear"} />
        {controller.controllerName ? (
          <span className="font-sans text-sm font-semibold text-paper">
            {controller.controllerName}
          </span>
        ) : (
          <span
            className="font-mono text-sm text-paper"
            title={controller.address}
          >
            {truncateAddress(controller.address)}
          </span>
        )}
        <span className="rounded border border-hairline px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-paper-dim">
          {controllerKindLabel(controller.controllerKind)}
        </span>
      </div>
      {controller.controllerName && (
        <span
          className="mt-1 block font-mono text-xs text-paper-dim"
          title={controller.address}
        >
          {truncateAddress(controller.address)}
        </span>
      )}

      <ul className="mt-3 flex-1 space-y-1">
        {statements.length === 0 ? (
          <li className="text-sm text-paper-dim">Holds no permissions.</li>
        ) : (
          visibleStatements.map((statement) => (
            <li key={statement} className="text-sm text-paper-dim">
              <span className="text-vital">Can</span> {statement}
            </li>
          ))
        )}
      </ul>

      {hasOverflow && (
        <button
          type="button"
          onClick={onExpand}
          className="mt-2 self-start text-xs text-paper-dim underline decoration-hairline underline-offset-4 transition hover:text-paper"
        >
          Show all {statements.length} permissions
        </button>
      )}

      {showStaleness &&
        (controller.lastActivity ? (
          <p className="mt-3 font-mono text-xs text-paper-dim/70">
            Last active {formatTimestamp(controller.lastActivity)}
          </p>
        ) : (
          <p className="mt-3 font-mono text-xs text-paper-dim/50">
            No on-chain activity found
          </p>
        ))}
    </div>
  );
}
