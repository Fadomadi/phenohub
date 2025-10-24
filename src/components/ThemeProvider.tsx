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
const PREFERENCE_KEY = "phenohub-theme-preference";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 Jahr

type ThemeProviderProps = {
  children: ReactNode;
  initialTheme?: Theme;
};

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
  root.classList.toggle("dark", theme === "dark");
  if (body) {
    body.classList.toggle("dark", theme === "dark");
  }

  const colorScheme = theme === "dark" ? "dark" : "light";
  root.style.colorScheme = colorScheme;
  if (body) {
    body.style.colorScheme = colorScheme;
    body.style.backgroundColor = theme === "dark" ? "#020617" : "#ffffff";
    body.style.color = theme === "dark" ? "#e6f0ff" : "#171717";
  }

  document.cookie = `${STORAGE_KEY}=${theme}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
};

export const ThemeProvider = ({ children, initialTheme = "light" }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  const persistPreference = useCallback((next: Theme) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PREFERENCE_KEY, next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const updateTheme = useCallback((next: Theme) => {
    const normalizedTheme: Theme = next === "dark" ? "dark" : "light";
    setThemeState(normalizedTheme);
    applyThemeToDocument(normalizedTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, normalizedTheme);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedPreference = window.localStorage.getItem(PREFERENCE_KEY) as Theme | null;
    if (storedPreference === "dark" || storedPreference === "light") {
      updateTheme(storedPreference);
      return;
    }

    // Legacy fallback: enforce provided initial theme (defaults to light).
    updateTheme(initialTheme);
    persistPreference(initialTheme);
  }, [initialTheme, persistPreference, updateTheme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== PREFERENCE_KEY) {
        return;
      }

      const storedPref = window.localStorage.getItem(PREFERENCE_KEY) as Theme | null;
      if (storedPref === "dark" || storedPref === "light") {
        updateTheme(storedPref);
        return;
      }

      const storedTheme = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (storedTheme === "dark" || storedTheme === "light") {
        updateTheme(storedTheme);
        persistPreference(storedTheme);
        return;
      }

      updateTheme(initialTheme);
      persistPreference(initialTheme);
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [initialTheme, persistPreference, updateTheme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleMediaChange = () => {
      const storedPreference = window.localStorage.getItem(PREFERENCE_KEY) as Theme | null;
      if (storedPreference === "dark" || storedPreference === "light") {
        updateTheme(storedPreference);
        return;
      }

      updateTheme(initialTheme);
    };

    media.addEventListener("change", handleMediaChange);
    return () => {
      media.removeEventListener("change", handleMediaChange);
    };
  }, [initialTheme, updateTheme]);

  const setTheme = useCallback(
    (next: Theme) => {
      updateTheme(next);
      persistPreference(next);
    },
    [persistPreference, updateTheme],
  );

  const toggleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    updateTheme(next);
    persistPreference(next);
  }, [persistPreference, theme, updateTheme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
