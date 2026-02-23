"use client";

import { Github, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
            <span>for the LUKSO ecosystem</span>
          </div>
          
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/your-username/lukso.tools"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              <Github className="h-4 w-4" />
              Contribute on GitHub
            </a>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span className="text-sm text-zinc-500 dark:text-zinc-500">
              MIT License
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
