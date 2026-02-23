"use client";

import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search tools...", className }: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 h-11 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300"
      />
    </div>
  );
}
