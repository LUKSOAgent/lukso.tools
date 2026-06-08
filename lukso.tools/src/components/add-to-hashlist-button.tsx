"use client";

import { useState } from "react";
import { ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLuksoWallet } from "@/hooks/use-lukso-wallet";
import { isConfiguredAddress } from "@/lib/lukso/config";
import { mintHashListEntry } from "@/lib/lukso/contracts";

type AddToHashListButtonProps = {
  hashListAddress: string | undefined;
  toolUpAddress: string | undefined;
  className?: string;
};

export function AddToHashListButton({
  hashListAddress,
  toolUpAddress,
  className,
}: AddToHashListButtonProps) {
  const wallet = useLuksoWallet();
  const [isWriting, setIsWriting] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const canWrite = isConfiguredAddress(hashListAddress) && isConfiguredAddress(toolUpAddress);

  async function addEntry() {
    setTxHash("");
    setError("");

    if (!wallet.provider || !wallet.account) {
      await wallet.connect();
      return;
    }

    if (!canWrite || !hashListAddress || !toolUpAddress) {
      setError("Live HashList and Tool UP addresses must be configured first.");
      return;
    }

    setIsWriting(true);
    try {
      const hash = await mintHashListEntry(wallet.provider, wallet.account, hashListAddress, toolUpAddress);
      setTxHash(hash);
    } catch (writeError) {
      setError(writeError instanceof Error ? writeError.message : "HashList write failed.");
    } finally {
      setIsWriting(false);
    }
  }

  return (
    <div className={className}>
      <Button className="h-8 bg-teal-600 px-3 text-xs text-white hover:bg-teal-700" onClick={addEntry} disabled={isWriting}>
        <ListPlus className="mr-1.5 h-3.5 w-3.5" />
        {isWriting ? "Adding" : "Add"}
      </Button>
      {txHash ? (
        <p className="mt-1 text-right text-xs text-emerald-600 dark:text-emerald-400">
          {txHash.slice(0, 10)}...
        </p>
      ) : null}
      {error ? (
        <p className="mt-1 max-w-44 text-right text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
