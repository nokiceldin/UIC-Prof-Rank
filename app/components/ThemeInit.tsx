// app/components/ThemeInit.tsx
"use client"

import { useEffect } from "react"

export default function ThemeInit() {
  useEffect(() => {
    const saved = localStorage.getItem("theme")

    if (saved === "dark") {
      document.documentElement.classList.add("dark")
      return
    }

    if (saved === "light") {
      document.documentElement.classList.remove("dark")
      return
    }

    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches

    if (prefersDark) document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
  }, [])

  return null
}