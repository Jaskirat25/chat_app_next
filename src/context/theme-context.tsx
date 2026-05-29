"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("app-theme") as ThemeMode | null;
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const initialTheme =
        storedTheme ?? (systemPrefersDark ? "dark" : "light");
      setTheme(initialTheme);
      document.documentElement.classList.toggle(
        "dark",
        initialTheme === "dark",
      );
      document.documentElement.classList.toggle(
        "light",
        initialTheme === "light",
      );
    } catch (error) {
      console.warn("Theme initialization failed", error);
    }
  }, []);

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme: ThemeMode = currentTheme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("app-theme", nextTheme);
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
        document.documentElement.classList.toggle(
          "light",
          nextTheme === "light",
        );
      } catch (error) {
        console.warn("Theme toggle failed", error);
      }
      return nextTheme;
    });
  };

  const value = useMemo(
    () => ({ theme, isDark: theme === "dark", toggleTheme }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
