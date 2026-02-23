"use client";

import { ToolCard } from "./tool-card";
import { type Tool } from "@/data/tools";
import { Package, Search } from "lucide-react";

interface ToolGridProps {
  tools: Tool[];
  isLoading?: boolean;
  searchQuery?: string;
}

export function ToolGrid({ tools, isLoading, searchQuery }: ToolGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="mt-3 h-10 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="mt-4 h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-zinc-100 dark:bg-zinc-900 p-4 mb-4">
          {searchQuery ? (
            <Search className="h-8 w-8 text-zinc-400" />
          ) : (
            <Package className="h-8 w-8 text-zinc-400" />
          )}
        </div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          {searchQuery ? "No tools found" : "No tools available"}
        </h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
          {searchQuery
            ? `No tools match "${searchQuery}". Try a different search term or category.`
            : "Check back later for new additions to the directory."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
