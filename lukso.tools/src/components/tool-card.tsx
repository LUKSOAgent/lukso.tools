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
  const primaryCategory = tool.categories[0];
  const categoryLabel = categories.find(c => c.id === primaryCategory)?.label || primaryCategory;

  return (
    <Card className="group bg-white border-gray-200 hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight">
            {tool.name}
          </h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
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
      <CardContent className="pt-0">
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {tool.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {tool.categories.map((cat) => {
            const label = categories.find(c => c.id === cat)?.label || cat;
            return (
              <Badge
                key={cat}
                variant="secondary"
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0 text-xs font-medium"
              >
                {label}
              </Badge>
            );
          })}
          {tool.tags?.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-gray-100 text-gray-600 hover:bg-gray-200 border-0 text-xs"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
