"use client";

import { useEffect, useMemo, useState } from "react";

type RawProf = Record<string, any>;


type Prof = {
  name: string;
  department: string;
  school: string;
  quality: number;
  ratingsCount: number;
  wouldTakeAgain: number | null;
  difficulty: number;
  url: string;
  slug: string;
};

function normalize(p: RawProf): Prof {
  const name = String(p.name ?? p.Name ?? "");
  const department = String(p.department ?? p.Department ?? "");
  const school = String(p.school ?? p.School ?? "");
  const quality = Number(p.quality ?? p.Quality ?? 0) || 0;
  const ratingsCount = Number(p.ratingsCount ?? p["Ratings Count"] ?? 0) || 0;

  const wtaRaw = p.wouldTakeAgain ?? p["Would Take Again %"];
  const wouldTakeAgain =
    wtaRaw === null || wtaRaw === undefined || wtaRaw === ""
      ? null
      : Number(wtaRaw);

  const difficulty = Number(p.difficulty ?? p.Difficulty ?? 0) || 0;
  const url = String(p.url ?? p["Profile URL"] ?? "");
  const slug = String(p.slug ?? p.Slug ?? `${name}-${department}`);

  return {
    name,
    department,
    school,
    quality,
    ratingsCount,
    wouldTakeAgain,
    difficulty,
    url,
    slug,
  };
}


export default function Page() {
  const [sort, setSort] = useState<"best" | "worst" | "most">("best");
const [loading, setLoading] = useState(false);

  const [data, setData] = useState<Prof[]>([]);
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(false);


  const [departments, setDepartments] = useState<string[]>([]);
  useEffect(() => {
  fetch("/api/departments")
    .then((r) => r.json())
    .then((d) => setDepartments(Array.isArray(d) ? d : []));
}, []);

  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [dept, setDept] = useState("All");
const [minRatings, setMinRatings] = useState(0);
const [minStars, setMinStars] = useState(0);
const [total, setTotal] = useState(0);


  


useEffect(() => {
  const controller = new AbortController();

  setLoading(true);
  setData([]);

  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("dept", dept);
  params.set("minRatings", String(minRatings));
  params.set("minStars", String(minStars));
  params.set("sort", sort);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  fetch(`/api/professors?${params.toString()}`, { signal: controller.signal })
    .then((r) => r.json())
    .then((res) => {
      setData(res.items || []);
      setTotal(res.total || 0);
    })
    .catch((err) => {
      // Ignore abort errors (happens when you change filters/page quickly)
      if (err?.name !== "AbortError") {
        console.error(err);
      }
    })
    .finally(() => {
      // only stop loading if this request wasn't aborted
      if (!controller.signal.aborted) setLoading(false);
    });

  return () => controller.abort();
}, [query, dept, minRatings, minStars, page, sort]);





useEffect(() => {
  const saved = localStorage.getItem("theme");

  if (saved === "dark") {
    setDark(true);
    document.documentElement.classList.add("dark");
    return;
  }

  if (saved === "light") {
    setDark(false);
    document.documentElement.classList.remove("dark");
    return;
  }

  const alreadyDark = document.documentElement.classList.contains("dark");
  setDark(alreadyDark);
}, []);

// 👇 THEN PASTE THIS
useEffect(() => {
  if (dark) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
}, [dark]);


const totalPages = Math.max(1, Math.ceil(total / pageSize));
const start = (page - 1) * pageSize;



  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">


      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex items-center justify-between gap-3">
  <h1 className="text-4xl font-bold tracking-tight">
    UIC Professors
  </h1>

  <button
    className="cursor-pointer rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
    onClick={() => setDark((d) => !d)}
  >
    {dark ? "Dark Mode" : "Light Mode"}
  </button>
</div>

<p className="mt-2 text-sm text-zinc-600">
</p>

        <p className="mt-2 text-sm text-zinc-600">
  Ranked by a weighted score so professors with more ratings are trusted more.
</p>




        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

  <div className="grid gap-3 sm:grid-cols-12">
    {/* Search */}
    <div className="sm:col-span-8">
      <input
        className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-700"

        placeholder="Search name or department..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPage(1);
        }}
      />
    </div>

    {/* Department */}
    <div className="sm:col-span-4">
      <select
        className="cursor-pointer h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-zinc-700"
        value={dept}
        onChange={(e) => {
          setDept(e.target.value);
          setPage(1);
        }}
      >
        <option value="All">All departments</option>
        {departments.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>

    {/* Min ratings */}
    <div className="sm:col-span-8">
      <div className="mb-1 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
        <span className="font-medium">Minimum reviews</span>

        <span className="tabular-nums">{minRatings}</span>
      </div>

      <div className="flex h-12 items-center rounded-xl border border-zinc-200 bg-white px-4 dark:border-zinc-700 dark:bg-zinc-950">
        <input
          type="range"
          min={0}
          max={200}
          step={5}
          value={minRatings}
          onChange={(e) => {
            setMinRatings(Number(e.target.value));
            setPage(1);
          }}
          className="w-full"
        />
      </div>

      <div className="mt-1 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
        <span>0</span>
        <span>50</span>
        <span>100</span>
        <span>150</span>
        <span>200+</span>
      </div>
    </div>

    <div className="sm:col-span-4 grid grid-cols-2 gap-3">
  {/* Min stars */}
  <div className="col-span-1">
    <div className="mb-1 text-xs font-medium text-zinc-600">Min rating</div>
    <select
  className="cursor-pointer h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-zinc-700"
  value={minStars}
  onChange={(e) => {
    setMinStars(Number(e.target.value));
    setPage(1);
  }}
>

      <option value={0}>Any</option>
      <option value={3}>3.0+</option>
      <option value={3.5}>3.5+</option>
      <option value={4}>4.0+</option>
      <option value={4.5}>4.5+</option>
      <option value={4.8}>4.8+</option>
    </select>
  </div>

  {/* Sort */}
  <div className="col-span-1">
    <div className="mb-1 text-xs font-medium text-zinc-600">Sort</div>
    <select
  className="cursor-pointer h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-zinc-700"
  value={sort}
  onChange={(e) => {
    setSort(e.target.value as any);
    setPage(1);
  }}
>

      <option value="best">Best to worst</option>
      <option value="worst">Worst to best</option>
      <option value="most">Most ratings</option>
    </select>
  </div>
</div>
</div>
</div>




        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">

  <div className="text-zinc-600 tabular-nums dark:text-zinc-300">
    Showing {start + 1} to {Math.min(start + pageSize, total)} of {total}

  </div>

  <div className="flex items-center gap-2">
    <button
      className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-2 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
      onClick={() => setPage((p) => Math.max(1, p - 1))}
      disabled={page === 1 || loading}

    >
      Prev
    </button>

    <div className="text-zinc-600 dark:text-zinc-300">
  Page{" "}
  <span className="font-medium text-zinc-900 dark:text-zinc-100">
    {page}
  </span>{" "}
  of{" "}
  <span className="font-medium text-zinc-900 dark:text-zinc-100">
    {totalPages}
  </span>
</div>


    <button
      className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-2 disabled:opacity-40"
      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
      disabled={page === totalPages || loading}

    >
      Next
    </button>
  </div>
</div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-900">
  <div className="max-h-[70vh] overflow-auto">

    <div className="sticky top-0 z-10 grid grid-cols-12 border-b border-zinc-200 bg-white/85 px-4 py-2.5 text-xs font-semibold text-zinc-600 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85 dark:text-zinc-300">
  <div className="col-span-5">Professor</div>
  <div className="col-span-3">Department</div>
  <div className="col-span-2 text-right">Rating</div>
  <div className="col-span-2 text-right">Link</div>
</div>


    <ul>
      {data.map((p, idx) => (
        <li
          key={p.slug}
          className="grid grid-cols-12 items-center border-b border-zinc-100 px-4 py-3 text-sm odd:bg-white even:bg-zinc-50 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:odd:bg-zinc-900 dark:even:bg-zinc-950 dark:hover:bg-zinc-800"
        >
          <div className="col-span-5">
            <div className="text-base font-semibold tracking-tight">
              {start + idx + 1}. {p.name}
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">{p.school}</div>
          </div>

          <div className="col-span-3 text-right sm:text-left">
            <span className="inline-block rounded-lg bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {p.department}
            </span>
          </div>

          <div className="col-span-2 text-right">
  <span
    className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
      p.quality >= 4.5
        ? "bg-emerald-500/10 text-emerald-600"
        : p.quality >= 4.0
        ? "bg-green-100 text-green-700"
        : p.quality >= 3.0
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700"
    }`}
  >
    <span className="tabular-nums">
      {(Number(p.quality) || 0).toFixed(1)}
    </span>
    <span className="text-xs font-semibold opacity-80 tabular-nums">
      ({Number(p.ratingsCount) || 0})
    </span>
  </span>
</div>


          <div className="col-span-2 text-right">
            <a
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              href={p.url}
              target="_blank"
              rel="noreferrer"
            >
              View
            </a>
          </div>
        </li>
      ))}
    </ul>

  </div>
</div>
</div>

    </main>
  );
}
