"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { CategorySidebar } from "@/components/category-sidebar";
import { ToolCard } from "@/components/tool-card";
import { tools, categories } from "@/data/tools";
import { CuratedListCard } from "@/components/curated-list-card";
import {
  curatedLists,
  getCuratedToolIds,
  getToolsWithSignals,
  type ToolWithSignals,
} from "@/data/curation";
import { useLiveSignals } from "@/hooks/use-live-signals";

const validCategories = categories.map(c => c.id);
const validViews = ["curated", "trending", "lists", "all"] as const;
type ViewMode = typeof validViews[number];

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<"score" | "likes" | "name">("score");
  const liveSignals = useLiveSignals();

  const categoryParam = searchParams.get("category");
  const viewParam = searchParams.get("view");
  const selectedCategory: string =
    categoryParam && validCategories.includes(categoryParam) ? categoryParam : "all";
  const selectedView: ViewMode =
    viewParam && validViews.includes(viewParam as ViewMode) ? (viewParam as ViewMode) : "curated";

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
    const curatedToolIds = getCuratedToolIds();
    const visibleTools = getToolsWithSignals().filter((tool) => {
      const matchesSearch =
        searchQuery === "" ||
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" ||
        tool.categories.includes(selectedCategory);

      const matchesView =
        selectedView === "all" ||
        selectedView === "trending" ||
        selectedView === "curated" && curatedToolIds.has(tool.id);

      return matchesSearch && matchesCategory && matchesView;
    });

    return visibleTools.sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name);
      if (sortMode === "likes") {
        return (b.profile?.likesReceived || 0) - (a.profile?.likesReceived || 0);
      }
      return b.score - a.score;
    });
  }, [searchQuery, selectedCategory, selectedView, sortMode]);

  const filteredLists = useMemo(() => {
    return curatedLists.filter((list) => {
      const query = searchQuery.toLowerCase();
      return (
        searchQuery === "" ||
        list.name.toLowerCase().includes(query) ||
        list.description.toLowerCase().includes(query) ||
        list.curator.toLowerCase().includes(query) ||
        list.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tools.length };
    tools.forEach((tool) => {
      tool.categories.forEach((cat) => {
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });
    return counts;
  }, []);

  const setSelectedView = useCallback((view: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "curated") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    const query = params.toString();
    router.push(query ? `?${query}` : "/", { scroll: false });
  }, [searchParams, router]);

  const activeCategoryLabel = selectedView === "lists"
    ? "Curated Lists"
    : selectedCategory === "all"
      ? selectedView === "trending" ? "Trending Tool UPs" : selectedView === "all" ? "All Tools" : "Curated Tools"
      : categories.find((c) => c.id === selectedCategory)?.label || "Curated Tools";

  const viewButtons: { id: ViewMode; label: string }[] = [
    { id: "curated", label: "Curated" },
    { id: "trending", label: "Trending" },
    { id: "lists", label: "Lists" },
    { id: "all", label: "All" },
  ];

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
        <section className="mb-5 rounded-lg border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 sm:text-2xl">
                Curated LUKSO tools
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                Tool UPs are the project identities. HashLists are the curation layer. LIKES are the soft signal on tools and lists.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs sm:flex sm:items-center">
              <div className="rounded-md bg-gray-50 px-3 py-2 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {tools.length} tools
              </div>
              <div className="rounded-md bg-teal-50 px-3 py-2 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                {curatedLists.length} lists
              </div>
              <div className="rounded-md bg-rose-50 px-3 py-2 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                {liveSignals.isLoading ? "syncing live" : "$LIKES live-ready"}
              </div>
            </div>
          </div>
          {liveSignals.error ? (
            <p className="mt-3 text-xs text-red-600 dark:text-red-400">
              Live sync issue: {liveSignals.error}
            </p>
          ) : null}
        </section>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Categories */}
          {selectedView !== "lists" ? (
            <CategorySidebar
              categories={categories.map(c => ({ ...c, count: categoryCounts[c.id] || 0 }))}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          ) : null}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {viewButtons.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setSelectedView(view.id)}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      selectedView === view.id
                        ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-950"
                        : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
              {selectedView !== "lists" ? (
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as typeof sortMode)}
                  className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="score">Sort by signal</option>
                  <option value="likes">Sort by LIKES</option>
                  <option value="name">Sort by name</option>
                </select>
              ) : null}
            </div>

            {/* Results header */}
            <div className="mb-4 sm:mb-6 flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {activeCategoryLabel}
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedView === "lists"
                  ? `${filteredLists.length} list${filteredLists.length !== 1 ? "s" : ""}`
                  : `${filteredTools.length} tool${filteredTools.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            {/* Tools Grid */}
            {selectedView === "lists" ? (
              filteredLists.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
                  {filteredLists.map((list) => (
                    <CuratedListCard
                      key={list.id}
                      list={list}
                      liveSignal={liveSignals.listSignals[list.id]}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState onClear={() => setSearchQuery("")} />
              )
            ) : filteredTools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {filteredTools.map((tool: ToolWithSignals) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    liveSignal={liveSignals.toolSignals[tool.id]}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                onClear={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              />
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

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="text-center py-12 sm:py-16 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      <p className="text-gray-500 dark:text-gray-400">
        No matches found.
      </p>
      <button
        onClick={onClear}
        className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
      >
        Clear filters
      </button>
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
