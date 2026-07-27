import { StatusDot } from "./StatusDot";
import { CategoryBadge } from "./CategoryBadge";
import { truncateAddress, formatTimestamp } from "@/lib/format/address";
import { controllerKindLabel } from "@/lib/blockchain/controllerKind";
import { CONTROLLER_KIND_ICONS } from "./controllerKindIcons";
import { getActiveCategories } from "@/lib/permissions/permissionCategories";
import type { ControllerReportRow } from "@/hooks/useProfileReport";

interface ControllerRowProps {
  controller: ControllerReportRow;
  isFlagged: boolean;
  onExpand: () => void;
  showStaleness: boolean;
}

// Categories shown before the card defers to the detail modal for the full
// breakdown - keeps every card the same fixed height regardless of how many
// capabilities a controller has.
const VISIBLE_CATEGORIES_LIMIT = 4;

export function ControllerRow({
  controller,
  isFlagged,
  onExpand,
  showStaleness,
}: ControllerRowProps) {
  const categories = getActiveCategories(controller.decodedPermissions);
  const visibleCategories = categories.slice(0, VISIBLE_CATEGORIES_LIMIT);
  const hiddenCount = Math.max(0, categories.length - VISIBLE_CATEGORIES_LIMIT);
  const KindIcon = CONTROLLER_KIND_ICONS[controller.controllerKind];

  return (
    <button
      type="button"
      onClick={onExpand}
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-lg border bg-gradient-to-b from-panel to-panel-raised/40 text-left transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital/40 ${
        isFlagged
          ? "border-signal-dim hover:border-signal"
          : "border-hairline hover:border-vital/50"
      }`}
    >
      <span
        className={`h-[3px] w-full shrink-0 ${
          isFlagged ? "bg-signal" : "bg-vital"
        }`}
        aria-hidden="true"
      />

      <div className="flex flex-1 flex-col px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {controller.controllerName ? (
              <>
                <p className="truncate font-sans text-base font-semibold text-paper">
                  {controller.controllerName}
                </p>
                <p
                  className="truncate font-mono text-xs text-paper-dim"
                  title={controller.address}
                >
                  {truncateAddress(controller.address)}
                </p>
              </>
            ) : (
              <p
                className="font-mono text-sm text-paper"
                title={controller.address}
              >
                {truncateAddress(controller.address)}
              </p>
            )}
          </div>
          <StatusDot tone={isFlagged ? "flagged" : "clear"} />
        </div>

        <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded border border-hairline px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-paper-dim">
          <KindIcon size={11} strokeWidth={2} />
          {controllerKindLabel(controller.controllerKind)}
        </span>

        <div className="mt-3.5 flex flex-1 flex-wrap content-start items-start gap-1.5">
          {categories.length === 0 ? (
            <span className="text-sm text-paper-dim">Holds no permissions.</span>
          ) : (
            <>
              {visibleCategories.map((category) => (
                <CategoryBadge
                  key={category.id}
                  categoryId={category.id}
                  label={category.label}
                />
              ))}
              {hiddenCount > 0 && (
                <span className="inline-flex items-center whitespace-nowrap rounded-full border border-vital/30 bg-vital/10 px-2.5 py-1 font-mono text-xs text-vital">
                  +{hiddenCount} more
                </span>
              )}
            </>
          )}
        </div>

        <div className="mt-auto">
          {showStaleness && (
            <div className="mt-3.5 border-t border-hairline pt-2.5">
              {controller.lastActivity ? (
                <p className="font-mono text-xs text-paper-dim/70">
                  Last active {formatTimestamp(controller.lastActivity)}
                </p>
              ) : (
                <p className="font-mono text-xs text-paper-dim/50">
                  No on-chain activity found
                </p>
              )}
            </div>
          )}
          <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-paper-dim/50 transition group-hover:text-vital/70">
            View full details →
          </p>
        </div>
      </div>
    </button>
  );
}
