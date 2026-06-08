"use client";

import { UserRound, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLuksoWallet } from "@/hooks/use-lukso-wallet";

export function WalletConnectButton() {
  const wallet = useLuksoWallet();

  if (wallet.isConnected && !wallet.isLukso) {
    return (
      <Button variant="outline" onClick={wallet.switchToLukso}>
        <WifiOff className="h-4 w-4" />
        Switch to LUKSO
      </Button>
    );
  }

  return (
    <Button
      onClick={wallet.connect}
      disabled={wallet.isConnecting}
      className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-gray-200"
    >
      <UserRound className="h-4 w-4" />
      {wallet.account ? `${wallet.account.slice(0, 6)}...${wallet.account.slice(-4)}` : "Connect UP"}
    </Button>
  );
}
