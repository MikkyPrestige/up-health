"use client";

import { useState } from "react";
import { VitalsRule } from "./VitalsRule";
import { ControllerRow } from "./ControllerRow";
import { FindingsPanel } from "./FindingsPanel";
import { ControllerDetailModal } from "./ControllerDetailModal";
import { truncateAddress } from "@/lib/format/address";
import type { ProfileReport } from "@/hooks/useProfileReport";

interface ProfileReportViewProps {
  report: ProfileReport;
  hasConnectedWallet: boolean;
  onGoToMyProfile: () => void;
}

export function ProfileReportView({
  report,
  hasConnectedWallet,
  onGoToMyProfile,
}: ProfileReportViewProps) {
  const [expandedAddress, setExpandedAddress] = useState<string | null>(null);

  const flaggedAddresses = new Set(
    report.flags
      .filter((flag) => flag.triggered)
      .flatMap((flag) => flag.affectedControllers ?? [])
      .map((address) => address.toLowerCase())
  );

  const [avatarFailed, setAvatarFailed] = useState(false);

  const expandedController = report.controllers.find(
    (controller) => controller.address === expandedAddress
  );

  return (
    <div className="hero-enter w-full">
      <div className="mx-auto max-w-2xl">
        {hasConnectedWallet && (
          <div className="mb-4 flex items-center gap-3 text-sm">
            <span
              className={report.isVerifiedOwner ? "text-vital" : "text-paper-dim"}
            >
              {report.isVerifiedOwner
                ? "Viewing your profile"
                : "Viewing another profile"}
            </span>
            {!report.isVerifiedOwner && (
              <button
                type="button"
                onClick={onGoToMyProfile}
                className="text-paper-dim underline decoration-hairline underline-offset-4 transition hover:text-paper"
              >
                Back to my profile
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-4">
          {report.metadata.avatarUrl && !avatarFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={report.metadata.avatarUrl}
              alt=""
              onError={() => setAvatarFailed(true)}
              className="h-12 w-12 rounded-full border border-hairline object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-panel-raised font-mono text-sm text-paper-dim">
              {(report.metadata.name ?? report.address).slice(0, 2)}
            </div>
          )}
          <div>
            <p className="font-sans text-lg font-semibold text-paper">
              {report.metadata.name ?? truncateAddress(report.address)}
            </p>
            <p className="font-mono text-xs text-paper-dim">
              {report.kind === "vault" ? "Vault" : "Universal Profile"} ·{" "}
              {truncateAddress(report.address)}
            </p>
          </div>
        </div>

        <p className="mt-6 text-lg text-paper">{report.summary}</p>

        <VitalsRule className="mt-6" />

        {report.isVerifiedOwner && (
          <div className="mt-6">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-paper-dim">
              Findings
            </h2>
            <div className="mt-3">
              <FindingsPanel flags={report.flags} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-paper-dim">
          Controllers ({report.controllers.length})
        </h2>
        {report.controllers.length === 0 ? (
          <p className="mt-3 text-sm text-paper-dim">
            {report.isVerifiedOwner
              ? "No controllers to show - see the finding above."
              : "No controllers found on this profile."}
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {report.controllers.map((controller) => (
              <ControllerRow
                key={controller.address}
                controller={controller}
                isFlagged={flaggedAddresses.has(
                  controller.address.toLowerCase()
                )}
                onExpand={() => setExpandedAddress(controller.address)}
                showStaleness={report.isVerifiedOwner}
              />
            ))}
          </div>
        )}
      </div>

      {expandedController && (
        <ControllerDetailModal
          controller={expandedController}
          onClose={() => setExpandedAddress(null)}
          showStaleness={report.isVerifiedOwner}
          isFlagged={flaggedAddresses.has(
            expandedController.address.toLowerCase()
          )}
        />
      )}
    </div>
  );
}
