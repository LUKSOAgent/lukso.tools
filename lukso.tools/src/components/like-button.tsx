"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLuksoWallet } from "@/hooks/use-lukso-wallet";
import { DEFAULT_LIKES_AMOUNT, LIKES_TOKEN_ADDRESS, isConfiguredAddress } from "@/lib/lukso/config";
import { readLsp7Decimals, sendLikesTransfer } from "@/lib/lukso/contracts";

type LikeButtonProps = {
  recipient: string | undefined;
  label?: string;
  className?: string;
};

export function LikeButton({ recipient, label = "Send LIKES", className }: LikeButtonProps) {
  const wallet = useLuksoWallet();
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const canSend = isConfiguredAddress(LIKES_TOKEN_ADDRESS) && isConfiguredAddress(recipient);

  async function sendLikes() {
    setError("");
    setTxHash("");

    if (!wallet.provider || !wallet.account) {
      await wallet.connect();
      return;
    }

    if (!canSend || !recipient) {
      setError("LIKES token or recipient is not configured yet.");
      return;
    }

    setIsSending(true);
    try {
      const decimals = await readLsp7Decimals(LIKES_TOKEN_ADDRESS);
      const hash = await sendLikesTransfer(
        wallet.provider,
        LIKES_TOKEN_ADDRESS,
        wallet.account,
        recipient,
        DEFAULT_LIKES_AMOUNT,
        decimals,
      );
      setTxHash(hash);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "LIKES transfer failed.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className={className}>
      <Button variant="outline" size="sm" onClick={sendLikes} disabled={isSending}>
        <Heart className="h-4 w-4" />
        {isSending ? "Sending" : label}
      </Button>
      {txHash ? (
        <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
          Sent: {txHash.slice(0, 10)}...
        </p>
      ) : null}
      {error ? (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
