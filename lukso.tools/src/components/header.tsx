"use client";

import { Search, Moon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import Link from "next/link";
import Image from "next/image";
import { WalletConnectButton } from "@/components/wallet-connect-button";

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
            <Image src="/logo.svg" alt="LUKSO" width={32} height={32} />
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

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/?view=curated"
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            >
              Curated
            </Link>
            <Link
              href="/?view=lists"
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            >
              Lists
            </Link>
            <Link
              href="/curate"
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            >
              Curate
            </Link>
          </nav>

          <div className="hidden shrink-0 sm:block">
            <WalletConnectButton />
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
