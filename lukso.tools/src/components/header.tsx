"use client";

import { Search, Moon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onReset: () => void;
}

export function Header({ searchQuery, onSearchChange, onReset }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <button
            onClick={onReset}
            className="flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <img src="/logo.svg" alt="LUKSO" className="h-8 w-8" />
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg hidden sm:block">
              lukso.tools
            </span>
          </button>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input
                type="search"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-900 focus:border-blue-500 focus:ring-blue-500/20 rounded-full"
              />
            </div>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
