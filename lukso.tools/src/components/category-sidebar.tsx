"use client";

import { cn } from "@/lib/utils";
import { ToolCategory, categories as allCategories } from "@/data/tools";

interface CategoryWithCount {
  id: ToolCategory;
  label: string;
  description: string;
  count: number;
}

interface CategorySidebarProps {
  categories: CategoryWithCount[];
  selectedCategory: ToolCategory;
  onSelectCategory: (category: ToolCategory) => void;
}

export function CategorySidebar({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategorySidebarProps) {
  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="sticky top-20">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 px-1">
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
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <span>{category.label}</span>
              <span
                className={cn(
                  "text-xs",
                  selectedCategory === category.id
                    ? "text-blue-600"
                    : "text-gray-500"
                )}
              >
                {category.count}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
