"use client";

import { useEffect, useState } from "react";
import { batchedMap } from "@/lib/util/batch";
import { getRawControllerAddresses } from "@/lib/blockchain/profileLookup";
import {
  getControllerPermissions,
  type ControllerBreakdown,
} from "@/lib/blockchain/controllerPermissions";
import { getAddressKind, type AddressKind } from "@/lib/blockchain/addressKind";
import {
  getProfileMetadata,
  type ProfileDisplayMetadata,
} from "@/lib/blockchain/profileMetadata";
import { getUniversalReceiverDelegate } from "@/lib/blockchain/universalReceiverDelegate";
import { isContractAddress } from "@/lib/blockchain/contractDetection";
import { getControllerKind, type ControllerKind } from "@/lib/blockchain/controllerKind";
import { getLastActivityTimestamps } from "@/lib/blockchain/staleness";
import {
  checkConcentratedPower,
  checkNoRecoveryPath,
  checkSuspiciousDelegate,
  checkNoControllers,
  type RiskFlagResult,
} from "@/lib/risk/riskFlags";
import { generateSummary } from "@/lib/risk/summary";
import { isVerifiedOwner } from "@/lib/wallet/identityMatch";

export interface ControllerReportRow extends ControllerBreakdown {
  isContract: boolean; // public (Proposal 6.4)
  controllerKind: ControllerKind;
  controllerName: string | null; // set only when the controller is itself a named Universal Profile
  lastActivity: string | null; // owner-only; null for everyone else
}

export interface ProfileReport {
  address: string;
  kind: AddressKind;
  metadata: ProfileDisplayMetadata;
  controllers: ControllerReportRow[];
  delegateAddress: string | null; // public: whether one is configured (Proposal 4.2)
  isVerifiedOwner: boolean;
  summary: string;
  flags: RiskFlagResult[]; // empty unless verified owner
}

export type ProfileReportStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "invalid_format" }
  | { state: "not_found"; reason: "no_code" | "unrecognized_contract" }
  | { state: "network_error"; message: string }
  | { state: "found"; report: ProfileReport };

type SettledResult = { address: string; status: ProfileReportStatus };

export function useProfileReport(
  viewedAddress: string | null,
  connectedAddress: string | null
): ProfileReportStatus {
  // Keyed to the address it was computed for, so "loading" can be derived by
  // comparing addresses during render rather than setState'd synchronously
  // in the effect body (every setResult call below happens only inside the
  // async run() function, after an await - not directly in the effect body).
  const [result, setResult] = useState<SettledResult | null>(null);

  useEffect(() => {
    if (!viewedAddress) return;

    let cancelled = false;

    async function run(address: string) {
      const lookup = await getRawControllerAddresses(address);
      if (cancelled) return;

      if (lookup.status !== "found") {
        let status: ProfileReportStatus;
        if (lookup.status === "network_error") {
          status = { state: "network_error", message: lookup.message };
        } else if (lookup.status === "not_found") {
          status = { state: "not_found", reason: lookup.reason };
        } else {
          status = { state: "invalid_format" };
        }
        setResult({ address, status });
        return;
      }

      const verifiedOwner = isVerifiedOwner(connectedAddress, address);

      const [kind, metadata, breakdown, delegateAddress] = await Promise.all([
        getAddressKind(address),
        getProfileMetadata(address),
        getControllerPermissions(address, lookup.controllers),
        getUniversalReceiverDelegate(address),
      ]);
      if (cancelled) return;

      // Contract-vs-wallet detection is public info regardless of ownership
      // (Proposal 6.4) - computed for every controller either way. Batched
      // rather than fired all at once, so a profile with many controllers
      // doesn't burst the RPC endpoint with dozens of simultaneous calls.
      const contractFlags = await batchedMap(breakdown, (controller) =>
        isContractAddress(controller.address)
      );
      if (cancelled) return;

      // What a controller actually is (Profile/Vault/LSP1 Delegate/plain
      // contract/wallet) is likewise just factual, public info - not gated
      // to the verified owner. Also batched, since this can issue up to 3
      // RPC calls per contract-type controller.
      const controllerKinds = await batchedMap(
        breakdown,
        (controller, i) => getControllerKind(controller.address, contractFlags[i])
      );
      if (cancelled) return;

      // If a controller is itself a Universal Profile, fetch its own name
      // too (e.g. a dedicated recovery profile named "recovery-up4") -
      // reuses the exact same metadata lookup used for the main profile.
      const controllerNames = await batchedMap(controllerKinds, (kind, i) =>
        kind === "profile"
          ? getProfileMetadata(breakdown[i].address).then((m) => m.name ?? null)
          : Promise.resolve(null)
      );
      if (cancelled) return;

      let controllers: ControllerReportRow[] = breakdown.map(
        (controller, i) => ({
          ...controller,
          isContract: contractFlags[i],
          controllerKind: controllerKinds[i],
          controllerName: controllerNames[i],
          lastActivity: null,
        })
      );

      let flags: RiskFlagResult[] = [];

      if (verifiedOwner) {
        const delegateHasCode = delegateAddress
          ? await isContractAddress(delegateAddress)
          : false;

        const lastActivities = await getLastActivityTimestamps(
          breakdown.map((controller) => controller.address)
        );
        if (cancelled) return;

        controllers = controllers.map((controller, i) => ({
          ...controller,
          lastActivity: lastActivities[i],
        }));

        flags = [
          checkConcentratedPower(breakdown),
          checkNoRecoveryPath(breakdown),
          checkSuspiciousDelegate(delegateAddress, delegateHasCode),
          checkNoControllers(breakdown),
        ];
      }

      setResult({
        address,
        status: {
          state: "found",
          report: {
            address,
            kind,
            metadata,
            controllers,
            delegateAddress,
            isVerifiedOwner: verifiedOwner,
            summary: generateSummary(
              lookup.controllers.length,
              flags,
              verifiedOwner
            ),
            flags,
          },
        },
      });
    }

    run(viewedAddress).catch((err) => {
      if (!cancelled) {
        setResult({
          address: viewedAddress,
          status: {
            state: "network_error",
            message: err instanceof Error ? err.message : "Unknown error",
          },
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [viewedAddress, connectedAddress]);

  if (!viewedAddress) return { state: "idle" };
  if (!result || result.address !== viewedAddress) return { state: "loading" };
  return result.status;
}
