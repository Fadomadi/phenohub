"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Hellmodus aktivieren" : "Dunkelmodus aktivieren"}
      aria-pressed={isDark}
      onClick={toggleTheme}
      className="fixed bottom-5 right-5 z-50 inline-flex h-11 w-[5.5rem] items-center justify-center rounded-full border border-slate-200 bg-slate-100/80 text-slate-600 shadow-lg backdrop-blur transition-transform hover:scale-105 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
    >
      <span className="relative z-10 flex w-full items-center justify-between px-3 text-xs font-semibold uppercase tracking-wide">
        <Sun
          className={`h-4 w-4 transition-opacity ${isDark ? "opacity-50" : "opacity-100 text-amber-500"}`}
        />
        <Moon
          className={`h-4 w-4 transition-opacity ${isDark ? "opacity-100 text-sky-400" : "opacity-50"}`}
        />
      </span>
      {mounted ? (
        <span
          className="absolute left-1 top-1 z-0 h-9 w-9 rounded-full bg-white shadow-sm transition-transform duration-300 dark:bg-slate-950"
          style={{
            transform: isDark ? "translateX(2.75rem)" : "translateX(0)",
          }}
        />
      ) : null}
    </button>
  );
};

export default ThemeToggle;
