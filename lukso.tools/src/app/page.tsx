"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { CategorySidebar } from "@/components/category-sidebar";
import { ToolCard } from "@/components/tool-card";
import { tools, categories } from "@/data/tools";

const validCategories = categories.map(c => c.id);

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const categoryParam = searchParams.get("category");
  const selectedCategory: string =
    categoryParam && validCategories.includes(categoryParam) ? categoryParam : "all";

  const setSelectedCategory = useCallback((category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === "all") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    const query = params.toString();
    router.push(query ? `?${query}` : "/", { scroll: false });
  }, [searchParams, router]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch =
        searchQuery === "" ||
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" ||
        tool.categories.includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tools.length };
    tools.forEach((tool) => {
      tool.categories.forEach((cat) => {
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });
    return counts;
  }, []);

  const activeCategoryLabel = selectedCategory === "all"
    ? "All Tools"
    : categories.find((c) => c.id === selectedCategory)?.label || "All Tools";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onReset={() => {
          setSearchQuery("");
          setSelectedCategory("all");
        }}
      />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Categories */}
          <CategorySidebar
            categories={categories.map(c => ({ ...c, count: categoryCounts[c.id] || 0 }))}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            <div className="mb-4 sm:mb-6 flex items-center justify-between">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {activeCategoryLabel}
              </h1>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filteredTools.length} tool{filteredTools.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Tools Grid */}
            {filteredTools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {filteredTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <p className="text-gray-500 dark:text-gray-400">
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
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              © {new Date().getFullYear()} lukso.tools — LUKSO Ecosystem Directory
            </p>
            <div className="flex items-center gap-5">
              <a
                href="https://github.com/JordyDutch/lukso.tools/blob/main/CONTRIBUTING.md"
                className="text-sm text-gray-400 dark:text-gray-500 hover:text-blue-600 transition-colors"
              >
                Submit Tool
              </a>
              <span className="text-gray-200 dark:text-gray-700">·</span>
              <a
                href="https://github.com/JordyDutch/lukso.tools"
                className="text-sm text-gray-400 dark:text-gray-500 hover:text-blue-600 transition-colors"
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

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
