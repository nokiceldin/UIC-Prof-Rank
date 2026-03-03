// app/components/Navbar.tsx
import Link from "next/link"
import Image from "next/image"
import ThemeToggle from "./ThemeToggle"

export default function Navbar() {
  return (
<header className="sticky top-0 z-50 border-b border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950/60 backdrop-blur">      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="UICProf" width={28} height={28} />
<span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
  UICProf
</span>        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/courses"
className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50
dark:border-white/15 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10"          >
            Courses
          </Link>

          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}