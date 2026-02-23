"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github } from "lucide-react";
import { Tool, categories } from "@/data/tools";

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const categoryLabel = categories.find(c => c.id === tool.category)?.label || tool.category;

  return (
    <Card className="group bg-white border-gray-200 hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight">
            {tool.name}
          </h3>
          <div className="flex gap-1">
            {tool.githubUrl && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                asChild
              >
                <a
                  href={tool.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${tool.name} on GitHub`}
                >
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            )}
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
        {tool.author && (
          <p className="text-xs text-gray-500 mt-1">by {tool.author}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {tool.description}
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="secondary"
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0 text-xs font-medium"
          >
            {categoryLabel}
          </Badge>
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
