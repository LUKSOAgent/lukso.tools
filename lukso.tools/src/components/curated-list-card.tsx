"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { adjustedLikes, getToolsForList, type CuratedList } from "@/data/curation";
import { ArrowRight, ExternalLink, Heart, ListChecks, ShieldCheck, UserRound } from "lucide-react";
import { LikeButton } from "@/components/like-button";
import { type LiveListSignal } from "@/hooks/use-live-signals";
import { explorerAddressUrl, formatAddress } from "@/lib/lukso/format";

interface CuratedListCardProps {
  list: CuratedList;
  liveSignal?: LiveListSignal;
}

export function CuratedListCard({ list, liveSignal }: CuratedListCardProps) {
  const tools = getToolsForList(list);
  const likesReceived = liveSignal?.likesReceived ?? list.likesReceived;
  const entryCount = liveSignal?.entryAddresses?.length ?? tools.length;
  const score = adjustedLikes(likesReceived, list.uniqueLikers);
  const listAddress = liveSignal?.hashListAddress || list.hashListAddress;
  const initials = list.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="overflow-hidden bg-white py-0 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <div className="h-1.5 bg-gradient-to-r from-teal-500 via-fuchsia-500 to-amber-400" />
      <CardHeader className="px-5 pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200">
              {initials}
            </div>
            <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                curated HashList
              </span>
              <span className="inline-flex items-center gap-1">
                <UserRound className="h-3.5 w-3.5" />
                {list.curator}
              </span>
            </div>
            <h3 className="text-lg font-semibold leading-tight text-gray-900 dark:text-gray-100">
              {list.name}
            </h3>
            <div className="mt-1 font-mono text-xs text-gray-400">
              {formatAddress(listAddress, 5)}
            </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button asChild size="icon" variant="ghost" className="h-8 w-8">
              <a href={explorerAddressUrl(listAddress)} target="_blank" rel="noreferrer" aria-label={`Open ${list.name} on explorer`}>
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="icon" variant="ghost" className="h-8 w-8">
              <Link href={`/lists/${list.id}`} aria-label={`Open ${list.name}`}>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pt-0">
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {list.description}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-md bg-gray-50 px-2.5 py-2 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <span className="flex items-center gap-1 font-medium">
              <ListChecks className="h-3.5 w-3.5" />
              {entryCount} tools
            </span>
          </div>
          <div className="rounded-md bg-rose-50 px-2.5 py-2 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <span className="flex items-center gap-1 font-medium">
              <Heart className="h-3.5 w-3.5" />
              {likesReceived.toLocaleString()}
            </span>
          </div>
          <div className="rounded-md bg-teal-50 px-2.5 py-2 font-medium text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
            score {score.toLocaleString()}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {list.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="border-0 bg-gray-100 text-xs text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {tag}
            </Badge>
          ))}
        </div>
        <LikeButton
          recipient={liveSignal?.listUpAddress || list.listUpAddress}
          label="Like list"
          className="mt-4"
        />
      </CardContent>
    </Card>
  );
}
