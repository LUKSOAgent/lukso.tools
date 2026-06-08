"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getLiveListConfig,
  getLiveToolConfig,
  LIKES_TOKEN_ADDRESS,
  type LiveListConfig,
} from "@/lib/lukso/config";
import { curatedLists, toolProfiles } from "@/data/curation";
import {
  readHashListEntries,
  readLikesBalance,
  readLsp3Profile,
  readLsp7Decimals,
} from "@/lib/lukso/contracts";

export type LiveToolSignal = {
  toolId: string;
  upAddress: string;
  likesReceived?: number;
  profileName?: string;
  profileDescription?: string;
  profileLoaded: boolean;
};

export type LiveListSignal = {
  listId: string;
  hashListAddress: string;
  listUpAddress?: string;
  entryAddresses?: string[];
  likesReceived?: number;
};

type LiveSignalsState = {
  toolSignals: Record<string, LiveToolSignal>;
  listSignals: Record<string, LiveListSignal>;
  likesDecimals: number;
  isLoading: boolean;
  error: string;
};

function readProfileText(value: unknown) {
  if (!value || typeof value !== "object") return {};
  const profile = "LSP3Profile" in value ? (value as { LSP3Profile?: unknown }).LSP3Profile : value;
  if (!profile || typeof profile !== "object") return {};
  const record = profile as Record<string, unknown>;

  return {
    profileName: typeof record.name === "string" ? record.name : undefined,
    profileDescription: typeof record.description === "string" ? record.description : undefined,
  };
}

export function useLiveSignals() {
  const [state, setState] = useState<LiveSignalsState>({
    toolSignals: {},
    listSignals: {},
    likesDecimals: 18,
    isLoading: false,
    error: "",
  });

  const listConfigs = useMemo(
    () => curatedLists.map(getLiveListConfig).filter((list): list is LiveListConfig => Boolean(list)),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const liveToolConfigs = toolProfiles.map(getLiveToolConfig).filter(Boolean);
      const hasAnyLiveSource = liveToolConfigs.length > 0 || listConfigs.length > 0 || Boolean(LIKES_TOKEN_ADDRESS);
      if (!hasAnyLiveSource) return;

      setState((current) => ({ ...current, isLoading: true, error: "" }));

      try {
        const likesDecimals = LIKES_TOKEN_ADDRESS ? await readLsp7Decimals(LIKES_TOKEN_ADDRESS) : 18;
        const toolSignals: Record<string, LiveToolSignal> = {};
        const listSignals: Record<string, LiveListSignal> = {};

        await Promise.all(
          liveToolConfigs.map(async (config) => {
            if (!config) return;
            const [profileValue, likesReceived] = await Promise.all([
              readLsp3Profile(config.upAddress).catch(() => undefined),
              LIKES_TOKEN_ADDRESS
                ? readLikesBalance(LIKES_TOKEN_ADDRESS, config.upAddress, likesDecimals).catch(() => undefined)
                : Promise.resolve(undefined),
            ]);
            const profileText = readProfileText(profileValue);

            toolSignals[config.toolId] = {
              toolId: config.toolId,
              upAddress: config.upAddress,
              likesReceived,
              profileLoaded: Boolean(profileValue),
              ...profileText,
            };
          }),
        );

        await Promise.all(
          listConfigs.map(async (config) => {
            const [entryAddresses, likesReceived] = await Promise.all([
              readHashListEntries(config.hashListAddress).catch(() => undefined),
              LIKES_TOKEN_ADDRESS && config.listUpAddress
                ? readLikesBalance(LIKES_TOKEN_ADDRESS, config.listUpAddress, likesDecimals).catch(() => undefined)
                : Promise.resolve(undefined),
            ]);

            listSignals[config.id] = {
              listId: config.id,
              hashListAddress: config.hashListAddress,
              listUpAddress: config.listUpAddress,
              entryAddresses,
              likesReceived,
            };
          }),
        );

        if (!cancelled) {
          setState({
            toolSignals,
            listSignals,
            likesDecimals,
            isLoading: false,
            error: "",
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            isLoading: false,
            error: error instanceof Error ? error.message : "Live signal loading failed.",
          }));
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [listConfigs]);

  return state;
}
