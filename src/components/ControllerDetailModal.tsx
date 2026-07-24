"use client";

import { useEffect, useRef } from "react";
import { formatTimestamp } from "@/lib/format/address";
import { controllerKindLabel } from "@/lib/blockchain/controllerKind";
import type { ControllerReportRow } from "@/hooks/useProfileReport";

interface ControllerDetailModalProps {
  controller: ControllerReportRow;
  onClose: () => void;
  showStaleness: boolean;
}

export function ControllerDetailModal({
  controller,
  onClose,
  showStaleness,
}: ControllerDetailModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Move focus into the modal on open, and keep it there - the close
    // button is the only focusable control here, so Tab/Shift+Tab both
    // just keep focus on it rather than leaking out to whatever sits
    // behind the backdrop.
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-6 py-12"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Controller details for ${controller.address}`}
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-md border border-hairline bg-panel px-6 py-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {controller.controllerName && (
              <p className="font-sans text-sm font-semibold text-paper">
                {controller.controllerName}
              </p>
            )}
            <p className="break-all font-mono text-sm text-paper">
              {controller.address}
            </p>
            <span className="mt-1 inline-block rounded border border-hairline px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-paper-dim">
              {controllerKindLabel(controller.controllerKind)}
            </span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded text-paper-dim transition hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital/40"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <ul className="mt-4 space-y-1.5">
          {controller.canStatements.length === 0 ? (
            <li className="text-sm text-paper-dim">Holds no permissions.</li>
          ) : (
            controller.canStatements.map((statement) => (
              <li key={statement} className="text-sm text-paper-dim">
                <span className="text-vital">Can</span> {statement}
              </li>
            ))
          )}
        </ul>

        {showStaleness && (
          <p className="mt-4 font-mono text-xs text-paper-dim/70">
            {controller.lastActivity
              ? `Last active ${formatTimestamp(controller.lastActivity)}`
              : "No on-chain activity found"}
          </p>
        )}
      </div>
    </div>
  );
}
