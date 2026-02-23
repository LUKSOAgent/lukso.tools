"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({ searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg hidden sm:block">
              lukso.tools
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 rounded-full"
              />
            </div>
          </div>

          {/* Right side placeholder */}
          <div className="w-8 shrink-0" />
        </div>
      </div>
    </header>
  );
}
