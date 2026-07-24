"use client";

import { useProfileContext } from "@/hooks/useProfileContext";
import { useProfileReport } from "@/hooks/useProfileReport";
import { AddressForm } from "./AddressForm";
import { GridBanner } from "./GridBanner";
import { StatusMessage } from "./StatusMessage";
import { ProfileReportView } from "./ProfileReportView";

export function ProfileChecker() {
  const {
    isEmbedded,
    connectedAddress,
    viewedAddress,
    manualAddressInput,
    setManualAddressInput,
    submitManualAddress,
    connectStandaloneWallet,
    disconnectStandaloneWallet,
    goToMyProfile,
    isConnecting,
    connectionError,
  } = useProfileContext();

  const status = useProfileReport(viewedAddress, connectedAddress);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      {isEmbedded ? (
        <GridBanner connectedAddress={connectedAddress} />
      ) : (
        <AddressForm
          value={manualAddressInput}
          onChange={setManualAddressInput}
          onSubmit={submitManualAddress}
          connectedAddress={connectedAddress}
          isConnecting={isConnecting}
          connectionError={connectionError}
          onConnect={connectStandaloneWallet}
          onDisconnect={disconnectStandaloneWallet}
        />
      )}

      <div
        className={`mt-10 w-full ${
          status.state === "found" ? "max-w-6xl" : "max-w-2xl"
        }`}
      >
        {status.state === "loading" && <StatusMessage kind="loading" />}
        {status.state === "invalid_format" && (
          <StatusMessage kind="invalid_format" />
        )}
        {status.state === "not_found" && <StatusMessage kind="not_found" />}
        {status.state === "network_error" && (
          <StatusMessage kind="network_error" detail={status.message} />
        )}
        {status.state === "found" && (
          <ProfileReportView
            key={status.report.address}
            report={status.report}
            hasConnectedWallet={Boolean(connectedAddress)}
            onGoToMyProfile={goToMyProfile}
          />
        )}
      </div>
    </main>
  );
}
