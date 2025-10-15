"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "phenohub-theme";

export const useTheme = () => {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return value;
};

const applyThemeToDocument = (theme: Theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;

  root.setAttribute("data-theme", theme);
  root.classList.remove("dark");
  body?.classList.remove("dark");

  if (theme === "dark") {
    root.style.colorScheme = "dark";
    if (body) {
      body.style.colorScheme = "dark";
      body.style.backgroundColor = "#020617";
      body.style.color = "#e6f0ff";
    }
  } else {
    root.style.colorScheme = "light";
    if (body) {
      body.style.colorScheme = "light";
      body.style.backgroundColor = "#ffffff";
      body.style.color = "#171717";
    }
  }

  if (theme === "dark") {
    root.classList.add("dark");
    body?.classList.add("dark");
  }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>("light");

  const updateTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyThemeToDocument(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    updateTheme(stored === "dark" ? "dark" : "light");
  }, [updateTheme]);

  const setTheme = useCallback(
    (next: Theme) => {
      updateTheme(next);
    },
    [updateTheme],
  );

  const toggleTheme = useCallback(() => {
    updateTheme(theme === "light" ? "dark" : "light");
  }, [theme, updateTheme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
