import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Heart, ListChecks, ShieldCheck, UserRound } from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import { Button } from "@/components/ui/button";
import { curatedLists, getToolsForList, adjustedLikes } from "@/data/curation";
import { LikeButton } from "@/components/like-button";
import { getLiveListConfig } from "@/lib/lukso/config";
import { explorerAddressUrl, formatAddress } from "@/lib/lukso/format";
import { HashListEntryTable } from "@/components/hashlist-entry-table";

interface ListPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return curatedLists.map((list) => ({ id: list.id }));
}

export default async function ListPage({ params }: ListPageProps) {
  const { id } = await params;
  const list = curatedLists.find((item) => item.id === id);

  if (!list) notFound();

  const tools = getToolsForList(list).filter((tool) => tool !== undefined);
  const score = adjustedLikes(list.likesReceived, list.uniqueLikers);
  const liveList = getLiveListConfig(list);
  const hashListAddress = liveList?.hashListAddress || list.hashListAddress;
  const listUpAddress = liveList?.listUpAddress || list.listUpAddress;
  const initials = list.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/?view=lists">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Lists
          </Link>
        </Button>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="h-2 bg-gradient-to-r from-teal-500 via-fuchsia-500 to-amber-400" />
          <div className="px-5 py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-lg font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    HashList curation
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="h-4 w-4" />
                    {list.curator}
                  </span>
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {list.name}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {list.description}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs sm:min-w-96">
              <div className="rounded-md bg-gray-50 px-3 py-2 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                <span className="flex items-center gap-1 font-medium">
                  <ListChecks className="h-3.5 w-3.5" />
                  {tools.length} tools
                </span>
              </div>
              <div className="rounded-md bg-rose-50 px-3 py-2 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                <span className="flex items-center gap-1 font-medium">
                  <Heart className="h-3.5 w-3.5" />
                  {list.likesReceived.toLocaleString()} LIKES
                </span>
              </div>
              <div className="rounded-md bg-teal-50 px-3 py-2 font-medium text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                score {score.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-2 text-xs text-gray-500 dark:text-gray-400 sm:grid-cols-3">
            <div className="rounded-md border border-gray-200 px-3 py-2 dark:border-gray-800">
              List UP: <span className="font-mono">{formatAddress(listUpAddress, 5)}</span>
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-2 dark:border-gray-800">
              HashList: <span className="font-mono">{formatAddress(hashListAddress, 5)}</span>
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-2 dark:border-gray-800">
              Curator UP: <span className="font-mono">{formatAddress(list.curatorUp, 5)}</span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <LikeButton recipient={listUpAddress} />
            <Button asChild variant="outline">
              <a href={`https://universaleverything.io/${listUpAddress}`} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open List UP
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={explorerAddressUrl(hashListAddress)} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open HashList
              </a>
            </Button>
          </div>
          </div>
        </section>

        <section className="mt-5">
          <HashListEntryTable list={list} fallbackTools={tools} />
        </section>

        <section className="mt-5">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Tool cards</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
