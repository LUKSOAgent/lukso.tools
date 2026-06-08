"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type CuratedList, type ToolWithSignals } from "@/data/curation";
import { useLiveSignals } from "@/hooks/use-live-signals";
import { explorerAddressUrl, formatAddress } from "@/lib/lukso/format";
import { readLsp3Profile } from "@/lib/lukso/contracts";
import { CheckCircle2, Copy, ExternalLink, Loader2, UserRound } from "lucide-react";

type HashListEntryTableProps = {
  list: CuratedList;
  fallbackTools: ToolWithSignals[];
};

type EntryProfilePreviewProps = {
  address: string;
  fallbackTool?: ToolWithSignals;
};

function readProfileText(value: unknown) {
  if (!value || typeof value !== "object") return {};
  const profile = "LSP3Profile" in value ? (value as { LSP3Profile?: unknown }).LSP3Profile : value;
  if (!profile || typeof profile !== "object") return {};
  const record = profile as Record<string, unknown>;

  return {
    name: typeof record.name === "string" ? record.name : undefined,
    description: typeof record.description === "string" ? record.description : undefined,
  };
}

function EntryProfilePreview({ address, fallbackTool }: EntryProfilePreviewProps) {
  const [profile, setProfile] = useState<{ name?: string; description?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(Boolean(fallbackTool));
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (shouldLoad || fallbackTool) return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setShouldLoad(true);
      },
      { rootMargin: "160px" },
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [fallbackTool, shouldLoad]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!shouldLoad || fallbackTool) return;
      setIsLoading(true);
      try {
        const value = await readLsp3Profile(address);
        if (!cancelled) setProfile(readProfileText(value));
      } catch {
        if (!cancelled) setProfile({});
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [address, fallbackTool, shouldLoad]);

  const displayName = fallbackTool?.name || profile?.name || "Universal Profile";
  const description = fallbackTool?.description || profile?.description || "HashList entry";

  return (
    <div ref={containerRef} className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs font-semibold text-gray-600 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300">
        {displayName.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{displayName}</p>
          {fallbackTool?.profile?.claimed ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> : null}
          {isLoading ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-gray-400" /> : null}
        </div>
        <p className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
}

export function HashListEntryTable({ list, fallbackTools }: HashListEntryTableProps) {
  const { listSignals, isLoading } = useLiveSignals();
  const liveEntries = listSignals[list.id]?.entryAddresses;
  const fallbackEntries = fallbackTools
    .map((tool) => ({ address: tool.profile?.upAddress, tool }))
    .filter((entry): entry is { address: string; tool: ToolWithSignals } => Boolean(entry.address));
  const entries = liveEntries?.length
    ? liveEntries.map((address) => ({ address, tool: fallbackEntries.find((entry) => entry.address.toLowerCase() === address.toLowerCase())?.tool }))
    : fallbackEntries;
  const sourceLabel = liveEntries?.length ? "live HashList entries" : "configured preview entries";

  const notesByAddress = useMemo(() => {
    return new Map(fallbackEntries.map((entry) => [entry.address.toLowerCase(), `${entry.tool.name} is included in ${list.name}.`]));
  }, [fallbackEntries, list.name]);

  async function copyAddress(address: string) {
    await navigator.clipboard.writeText(address);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-1 border-b border-gray-200 px-4 py-3 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Entries</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{entries.length} {sourceLabel}</p>
        </div>
        {isLoading ? (
          <span className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            checking live HashList
          </span>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-950 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Entry</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Curator note</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {entries.map((entry) => (
              <tr key={entry.address} className="align-middle">
                <td className="min-w-72 px-4 py-3">
                  <EntryProfilePreview address={entry.address} fallbackTool={entry.tool} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-300">
                  {formatAddress(entry.address, 5)}
                </td>
                <td className="min-w-60 px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                  {notesByAddress.get(entry.address.toLowerCase()) || "Added by curator."}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyAddress(entry.address)} aria-label="Copy entry address">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={explorerAddressUrl(entry.address)} target="_blank" rel="noreferrer" aria-label="Open entry on explorer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-800">
        <Badge variant="secondary" className="border-0 bg-gray-100 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          HashList membership
        </Badge>
        <Badge variant="secondary" className="border-0 bg-gray-100 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          Tool UP addresses
        </Badge>
        <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <UserRound className="h-3.5 w-3.5" />
          metadata loads lazily
        </span>
      </div>
    </div>
  );
}
