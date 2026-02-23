"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/header";
import { CategorySidebar } from "@/components/category-sidebar";
import { ToolCard } from "@/components/tool-card";
import { tools, categories, ToolCategory } from "@/data/tools";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>("all");

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch =
        searchQuery === "" ||
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" ||
        tool.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tools.length };
    tools.forEach((tool) => {
      counts[tool.category] = (counts[tool.category] || 0) + 1;
    });
    return counts;
  }, []);

  const activeCategoryLabel = selectedCategory === "all" 
    ? "All Tools" 
    : categories.find((c) => c.id === selectedCategory)?.label || "All Tools";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <CategorySidebar
            categories={categories.map(c => ({ ...c, count: categoryCounts[c.id] || 0 }))}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">
                {activeCategoryLabel}
              </h1>
              <span className="text-sm text-gray-500">
                {filteredTools.length} tool{filteredTools.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Tools Grid */}
            {filteredTools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">
                  No tools found matching your criteria.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © 2025 lukso.tools - LUKSO Ecosystem Directory
            </p>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/JordyDutch/lukso.tools/blob/main/CONTRIBUTING.md"
                className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                Submit Tool
              </a>
              <a
                href="https://github.com/JordyDutch/lukso.tools"
                className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
