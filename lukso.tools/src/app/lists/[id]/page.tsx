import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Heart, ListChecks, ShieldCheck, UserRound } from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import { Button } from "@/components/ui/button";
import { curatedLists, getToolsForList, adjustedLikes } from "@/data/curation";
import { LikeButton } from "@/components/like-button";
import { getLiveListConfig } from "@/lib/lukso/config";

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

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/?view=lists">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Lists
          </Link>
        </Button>

        <section className="rounded-lg border border-gray-200 bg-white px-5 py-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
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
              List UP: {liveList?.listUpAddress || list.listUpAddress}
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-2 dark:border-gray-800">
              HashList: {liveList?.hashListAddress || list.hashListAddress}
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-2 dark:border-gray-800">
              Curator UP: {list.curatorUp}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <LikeButton recipient={liveList?.listUpAddress || list.listUpAddress} />
            <Button asChild variant="outline">
              <a href={`https://universaleverything.io/${list.listUpAddress}`} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open List UP
              </a>
            </Button>
          </div>
        </section>

        <section className="mt-5">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Curated tools
          </h2>
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
