"use client";

import { cn } from "@/lib/utils";

interface CategoryWithCount {
  id: string;
  label: string;
  count: number;
}

interface CategorySidebarProps {
  categories: CategoryWithCount[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategorySidebar({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategorySidebarProps) {
  return (
    <>
      {/* Mobile: horizontal scrollable chips */}
      <div className="lg:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                "shrink-0 px-3 py-1.5 text-sm font-medium rounded-full border transition-colors",
                selectedCategory === category.id
                  ? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500"
                  : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              {category.label}
              <span className="ml-1.5 text-xs opacity-70">{category.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: vertical sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-20">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-4 px-1">
            Categories
          </h2>
          <nav className="space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  selectedCategory === category.id
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <span>{category.label}</span>
                <span
                  className={cn(
                    "text-xs",
                    selectedCategory === category.id
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-500"
                  )}
                >
                  {category.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
