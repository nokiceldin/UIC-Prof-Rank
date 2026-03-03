"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "uicprof_theme";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function getSavedTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "dark" || v === "light") return v;
  return null;
}

export function saveTheme(theme: Theme) {
  window.localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = getSavedTheme();
    const theme: Theme =
      saved ?? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    applyTheme(theme);
    setReady(true);
  }, []);

  if (!ready) return <>{children}</>;

  return <>{children}</>;
}