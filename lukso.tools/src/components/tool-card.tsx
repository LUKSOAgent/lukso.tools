"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Tool, categories } from "@/data/tools";

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const categoryLabel = tool.categories.length > 0 ? (categories.find(c => c.id === tool.categories[0])?.label || tool.categories[0]) : "";

  return (
    <Card className="group bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow duration-200 h-full py-4 sm:py-6 gap-4 sm:gap-6">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight">
            {tool.name}
          </h3>
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
                aria-label={`Visit ${tool.name}`}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

      </CardHeader>
      <CardContent className="pt-0 flex flex-col flex-1 px-4 sm:px-6">
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed flex-1">
          {tool.description}
        </p>
        <div className="flex flex-wrap gap-2 mt-4 max-h-[3.25rem] overflow-hidden">
          <Badge
            variant="secondary"
            className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border-0 text-xs font-medium"
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
