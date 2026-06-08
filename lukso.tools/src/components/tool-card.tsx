"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, Heart, Layers, UserRound } from "lucide-react";
import { Tool, categories } from "@/data/tools";
import { type ToolWithSignals } from "@/data/curation";
import { LikeButton } from "@/components/like-button";
import { type LiveToolSignal } from "@/hooks/use-live-signals";

interface ToolCardProps {
  tool: Tool | ToolWithSignals;
  liveSignal?: LiveToolSignal;
}

export function ToolCard({ tool, liveSignal }: ToolCardProps) {
  const categoryLabel = tool.categories.length > 0 ? (categories.find(c => c.id === tool.categories[0])?.label || tool.categories[0]) : "";
  const profile = "profile" in tool ? tool.profile : undefined;
  const curatedBy = "curatedBy" in tool ? tool.curatedBy : [];
  const likesReceived = liveSignal?.likesReceived ?? profile?.likesReceived;
  const displayName = liveSignal?.profileName || tool.name;
  const description = liveSignal?.profileDescription || tool.description;

  return (
    <Card className="group bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow duration-200 h-full py-4 sm:py-6 gap-4 sm:gap-6">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight">
              {displayName}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {profile?.claimed ? (
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {liveSignal?.profileLoaded ? "live Tool UP" : "claimed Tool UP"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <UserRound className="h-3.5 w-3.5" />
                  static entry
                </span>
              )}
              {curatedBy.length > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-blue-500" />
                  {curatedBy.length} list{curatedBy.length === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
              asChild
            >
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${displayName}`}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

      </CardHeader>
      <CardContent className="pt-0 flex flex-col flex-1 px-4 sm:px-6">
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed flex-1">
          {description}
        </p>
        {profile || liveSignal ? (
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-rose-50 px-2.5 py-2 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              <span className="flex items-center gap-1 font-medium">
                <Heart className="h-3.5 w-3.5" />
                {(likesReceived ?? 0).toLocaleString()} LIKES
              </span>
            </div>
            <div className="rounded-md bg-gray-50 px-2.5 py-2 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {profile ? `${profile.uniqueLikers.toLocaleString()} unique likers` : "live profile"}
            </div>
          </div>
        ) : null}
        <LikeButton recipient={liveSignal?.upAddress || profile?.upAddress} className="mt-4" />
        <div className="flex flex-wrap gap-2 mt-4 max-h-[3.25rem] overflow-hidden">
          <Badge
            variant="secondary"
            className="bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 border-0 text-xs font-medium"
          >
            {categoryLabel}
          </Badge>
          {tool.tags?.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border-0 text-xs"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
