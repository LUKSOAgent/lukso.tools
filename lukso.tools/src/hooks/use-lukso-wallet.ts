"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAddress } from "viem";
import { getInjectedProvider, type Eip1193Provider } from "@/lib/lukso/contracts";
import { LUKSO_CHAIN_ID } from "@/lib/lukso/config";

type WalletState = {
  account: string;
  chainId: number | undefined;
  provider: Eip1193Provider | undefined;
  isConnecting: boolean;
  error: string;
};

export function useLuksoWallet() {
  const [state, setState] = useState<WalletState>({
    account: "",
    chainId: undefined,
    provider: undefined,
    isConnecting: false,
    error: "",
  });

  const refresh = useCallback(async () => {
    const provider = getInjectedProvider();
    if (!provider) {
      setState((current) => ({ ...current, provider: undefined }));
      return;
    }

    const [accounts, chainIdHex] = await Promise.all([
      provider.request({ method: "eth_accounts" }) as Promise<string[]>,
      provider.request({ method: "eth_chainId" }) as Promise<string>,
    ]);

    setState((current) => ({
      ...current,
      provider,
      account: accounts[0] ? getAddress(accounts[0]) : "",
      chainId: Number(chainIdHex),
      error: "",
    }));
  }, []);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const connect = useCallback(async () => {
    const provider = getInjectedProvider();
    if (!provider) {
      setState((current) => ({
        ...current,
        error: "No injected LUKSO wallet provider found.",
      }));
      return;
    }

    setState((current) => ({ ...current, provider, isConnecting: true, error: "" }));

    try {
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      const chainIdHex = (await provider.request({ method: "eth_chainId" })) as string;
      setState((current) => ({
        ...current,
        provider,
        account: accounts[0] ? getAddress(accounts[0]) : "",
        chainId: Number(chainIdHex),
        isConnecting: false,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        isConnecting: false,
        error: error instanceof Error ? error.message : "Wallet connection failed.",
      }));
    }
  }, []);

  const switchToLukso = useCallback(async () => {
    const provider = state.provider || getInjectedProvider();
    if (!provider) return;

    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${LUKSO_CHAIN_ID.toString(16)}` }],
    });
    await refresh();
  }, [refresh, state.provider]);

  return useMemo(
    () => ({
      ...state,
      connect,
      refresh,
      switchToLukso,
      isConnected: Boolean(state.account),
      isLukso: state.chainId === LUKSO_CHAIN_ID,
    }),
    [connect, refresh, state, switchToLukso],
  );
}
