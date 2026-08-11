"use client";

import { useEffect, useRef } from "react";
import { ShieldCheck } from "lucide-react";
import { formatTimestamp } from "@/lib/format/address";
import { controllerKindLabel } from "@/lib/blockchain/controllerKind";
import { CONTROLLER_KIND_ICONS } from "./controllerKindIcons";
import { CATEGORY_ICONS } from "./categoryIcons";
import { getActiveCategories } from "@/lib/permissions/permissionCategories";
import { permissionLabel } from "@/lib/permissions/permissionLabels";
import type { ControllerReportRow } from "@/hooks/useProfileReport";

interface ControllerDetailModalProps {
  controller: ControllerReportRow;
  onClose: () => void;
  showStaleness: boolean;
  isFlagged: boolean;
}

export function ControllerDetailModal({
  controller,
  onClose,
  showStaleness,
  isFlagged,
}: ControllerDetailModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const categories = getActiveCategories(controller.decodedPermissions);
  const KindIcon = CONTROLLER_KIND_ICONS[controller.controllerKind];

  // AllowedCalls only matters if the controller holds a non-SUPER call-type
  // permission - SUPER_ variants bypass this restriction entirely. Shown as
  // its own section rather than split across categories, since it's one
  // shared restriction list, not organized per capability.
  const hasRestrictedCallPermission = Boolean(
    controller.decodedPermissions.CALL ||
      controller.decodedPermissions.STATICCALL ||
      controller.decodedPermissions.DELEGATECALL ||
      controller.decodedPermissions.TRANSFERVALUE
  );
  const hasRestrictedDataPermission = Boolean(
    controller.decodedPermissions.SETDATA
  );

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-6 py-12 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Controller details for ${controller.address}`}
        className="modal-panel flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-lg border border-hairline bg-panel shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className={`h-[3px] w-full shrink-0 ${
            isFlagged ? "bg-signal" : "bg-vital"
          }`}
          aria-hidden="true"
        />

        <div className="overflow-y-auto px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {controller.controllerName && (
                <p className="font-sans text-base font-semibold text-paper">
                  {controller.controllerName}
                </p>
              )}
              <p className="break-all font-mono text-sm text-paper">
                {controller.address}
              </p>
              <span className="mt-1.5 inline-flex items-center gap-1.5 rounded border border-hairline px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-paper-dim">
                <KindIcon size={11} strokeWidth={2} />
                {controllerKindLabel(controller.controllerKind)}
              </span>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-paper-dim transition hover:bg-panel-raised hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital/40"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="mt-5 space-y-4 border-t border-hairline pt-4">
            {categories.length === 0 ? (
              <p className="text-sm text-paper-dim">Holds no permissions.</p>
            ) : (
              categories.map((category) => {
                const Icon = CATEGORY_ICONS[category.id];
                return (
                  <div key={category.id}>
                    <div className="flex items-center gap-2 text-paper">
                      <Icon size={14} strokeWidth={2} className="text-vital" />
                      <p className="text-sm font-semibold">{category.label}</p>
                    </div>
                    <p className="mt-1 text-xs text-paper-dim/80">
                      {category.description}
                    </p>
                    <ul className="mt-2 space-y-1 pl-[22px]">
                      {category.activePermissions.map((permission) => (
                        <li
                          key={permission}
                          className="text-sm text-paper-dim"
                        >
                          <span className="text-vital">Can</span>{" "}
                          {permissionLabel(permission)}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })
            )}
          </div>

          {(hasRestrictedCallPermission || hasRestrictedDataPermission) && (
            <div className="mt-5 space-y-4 border-t border-hairline pt-4">
              <div className="flex items-center gap-2 text-paper">
                <ShieldCheck size={14} strokeWidth={2} className="text-vital" />
                <p className="text-sm font-semibold">Restrictions</p>
              </div>

              {hasRestrictedCallPermission && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-paper-dim">
                    Allowed calls
                  </p>
                  {controller.restrictions.allowedCalls === null ||
                  controller.restrictions.allowedCalls.length === 0 ? (
                    <p className="mt-1.5 text-sm text-paper-dim">
                      No allowed calls configured - this controller cannot
                      currently use this permission at all.
                    </p>
                  ) : (
                    <ul className="mt-1.5 space-y-2">
                      {controller.restrictions.allowedCalls.map(
                        (entry, i) => (
                          <li
                            key={i}
                            className="rounded border border-hairline px-2.5 py-1.5 text-xs text-paper-dim"
                          >
                            <span className="text-vital">
                              {entry.callTypes.join(", ") || "No call type"}
                            </span>{" "}
                            on{" "}
                            <span
                              className="font-mono"
                              title={
                                entry.address !== "Any address"
                                  ? entry.address
                                  : undefined
                              }
                            >
                              {entry.address === "Any address"
                                ? "any address"
                                : `${entry.address.slice(0, 6)}…${entry.address.slice(-4)}`}
                            </span>
                            {" · "}
                            {entry.standard === "Any type"
                              ? "any contract type"
                              : entry.standard}
                            {" · "}
                            {entry.function === "Any function"
                              ? "any function"
                              : `function ${entry.function}`}
                          </li>
                        )
                      )}
                    </ul>
                  )}
                </div>
              )}

              {hasRestrictedDataPermission && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-paper-dim">
                    Allowed data keys
                  </p>
                  {controller.restrictions.allowedDataKeyCount === null ||
                  controller.restrictions.allowedDataKeyCount === 0 ? (
                    <p className="mt-1.5 text-sm text-paper-dim">
                      No allowed data keys configured - this controller
                      cannot currently use this permission at all.
                    </p>
                  ) : (
                    <p className="mt-1.5 text-sm text-paper-dim">
                      Restricted to {controller.restrictions.allowedDataKeyCount}{" "}
                      specific data{" "}
                      {controller.restrictions.allowedDataKeyCount === 1
                        ? "key"
                        : "keys"}
                      .
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {showStaleness && (
            <p className="mt-5 border-t border-hairline pt-3 font-mono text-xs text-paper-dim/70">
              {controller.lastActivity
                ? `Last active ${formatTimestamp(controller.lastActivity)}`
                : "No on-chain activity found"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
