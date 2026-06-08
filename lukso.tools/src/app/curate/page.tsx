"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Heart, ListPlus, Search, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolCard } from "@/components/tool-card";
import { curatedLists, getToolsWithSignals } from "@/data/curation";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { AddToHashListButton } from "@/components/add-to-hashlist-button";
import { getLiveListConfig, getLiveToolConfig } from "@/lib/lukso/config";
import { useLiveSignals } from "@/hooks/use-live-signals";

export default function CuratePage() {
  const [query, setQuery] = useState("");
  const [selectedListId, setSelectedListId] = useState(curatedLists[0]?.id || "");
  const selectedList = curatedLists.find((list) => list.id === selectedListId);
  const selectedLiveList = selectedList ? getLiveListConfig(selectedList) : undefined;
  const liveSignals = useLiveSignals();

  const tools = useMemo(() => {
    const needle = query.toLowerCase();
    return getToolsWithSignals()
      .filter((tool) => {
        return (
          query === "" ||
          tool.name.toLowerCase().includes(needle) ||
          tool.description.toLowerCase().includes(needle) ||
          tool.tags?.some((tag) => tag.toLowerCase().includes(needle))
        );
      })
      .sort((a, b) => b.score - a.score);
  }, [query]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Directory
          </Link>
        </Button>

        <section className="rounded-lg border border-gray-200 bg-white px-5 py-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  HashList workflow
                </span>
                <span className="inline-flex items-center gap-1">
                  <UserRound className="h-4 w-4" />
                  connect Universal Profile
                </span>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Curate dapp Tool UPs
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Connect a curator UP, select a configured HashList, search Tool UPs, and mint Tool UP address entries into the list.
              </p>
            </div>
            <WalletConnectButton />
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-4">
            <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-sm font-semibold uppercase text-gray-900 dark:text-gray-100">
                Active list
              </h2>
              <select
                value={selectedListId}
                onChange={(event) => setSelectedListId(event.target.value)}
                className="mt-3 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300"
              >
                {curatedLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
              {selectedList ? (
                <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <p>{selectedList.description}</p>
                  <div className="rounded-md bg-gray-50 p-3 text-xs dark:bg-gray-800">
                    HashList: {selectedLiveList?.hashListAddress || "not configured"}
                  </div>
                  <div className="rounded-md bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" />
                      {selectedList.likesReceived.toLocaleString()} LIKES to List UP
                    </span>
                  </div>
                </div>
              ) : null}
              <Button className="mt-4 w-full" variant="outline">
                <ListPlus className="mr-2 h-4 w-4" />
                Create HashList later
              </Button>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-sm font-semibold uppercase text-gray-900 dark:text-gray-100">
                Curation rules
              </h2>
              <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  Tool UP identity should be claimed by the project.
                </p>
                <p className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  HashList membership is a recommendation, not open registration.
                </p>
                <p className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  LIKES boost signal but should not override curator trust.
                </p>
              </div>
            </section>
          </aside>

          <section>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search Tool UPs by name, description, or tags"
                  className="h-10 rounded-md pl-10"
                />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {tools.length} candidates
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {tools.map((tool) => (
                <div key={tool.id} className="relative">
                  <ToolCard tool={tool} liveSignal={liveSignals.toolSignals[tool.id]} />
                  <AddToHashListButton
                    className="absolute bottom-4 right-4"
                    hashListAddress={selectedLiveList?.hashListAddress}
                    toolUpAddress={
                      liveSignals.toolSignals[tool.id]?.upAddress ||
                      getLiveToolConfig(tool.profile)?.upAddress ||
                      tool.profile?.upAddress
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
