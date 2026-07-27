import { Wallet, FileCode2, CircleUserRound, Vault, Webhook, type LucideIcon } from "lucide-react";
import type { ControllerKind } from "@/lib/blockchain/controllerKind";

export const CONTROLLER_KIND_ICONS: Record<ControllerKind, LucideIcon> = {
  wallet: Wallet,
  contract: FileCode2,
  profile: CircleUserRound,
  vault: Vault,
  "delegate-contract": Webhook,
};
