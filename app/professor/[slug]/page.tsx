import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";

type ProfCoursesMap = Record<string, string[]>;

function mapKeyToDbName(key: string) {
  const s = (key || "").trim();
  if (!s) return s;

  if (s.includes(",")) {
    const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const last = parts[0];
      const first = parts.slice(1).join(" ");
      return `${first} ${last}`.replace(/\s+/g, " ").trim();
    }
  }

  return s;
}

const globalForCourseMap = globalThis as unknown as { __profCourseMap?: ProfCoursesMap };

function getProfCourseMap(): ProfCoursesMap {
  if (globalForCourseMap.__profCourseMap) return globalForCourseMap.__profCourseMap;

  const filePath = path.join(process.cwd(), "public", "data", "professor_to_courses.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const map = JSON.parse(raw) as ProfCoursesMap;

  globalForCourseMap.__profCourseMap = map;
  return map;
}

function getActiveDbNames() {
  const courseMap = getProfCourseMap();
  const out: string[] = [];

  for (const key of Object.keys(courseMap)) {
    out.push(mapKeyToDbName(key));
  }

  return out;
}

export default async function ProfessorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

const C = 20;
const M = 4.0;
const activeDbNames = getActiveDbNames();

const result = await prisma.$queryRawUnsafe<any[]>(
  `
  WITH scored AS (
    SELECT
      "id",
      "slug",
      "name",
      "department",
      "school",
      COALESCE("rmpQuality", 0) as "quality",
      COALESCE("rmpRatingsCount", 0) as "ratingsCount",
      COALESCE("rmpUrl", '') as "rmpUrl",
      CASE
        WHEN COALESCE("rmpRatingsCount", 0) = 0 THEN 0
        ELSE
          (COALESCE("rmpRatingsCount", 0)::float / (COALESCE("rmpRatingsCount", 0) + ${C})) * COALESCE("rmpQuality", 0)
          + (${C}::float / (COALESCE("rmpRatingsCount", 0) + ${C})) * ${M}
      END as "score"
    FROM "Professor"
    WHERE "name" = ANY($2)
  ),
  ranked AS (
    SELECT *,
      ROW_NUMBER() OVER (ORDER BY "score" DESC, "ratingsCount" DESC, "name" ASC) as "overallRank",
      ROW_NUMBER() OVER (PARTITION BY "department" ORDER BY "score" DESC, "ratingsCount" DESC, "name" ASC) as "deptRank"
    FROM scored
  )
  SELECT *
  FROM ranked
  WHERE "slug" = $1
  `,
  slug,
  activeDbNames
);





const professor = result[0];

if (!professor) {
  notFound();
}

  return (
    <main className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-3xl px-5 py-16">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-white/10 dark:bg-zinc-900/40">
<div className="mb-8 flex items-center gap-8">
  {/* Big rating circle */}
  <div
    className={`flex h-24 w-24 items-center justify-center rounded-full text-4xl font-bold text-white shadow-lg ${
      professor.quality >= 4.5
        ? "bg-emerald-500"
        : professor.quality >= 4.0
        ? "bg-green-500"
        : professor.quality >= 3.0
        ? "bg-yellow-500"
        : "bg-red-500"
    }`}
  >
    {Number(professor.quality || 0).toFixed(1)}
  </div>

  {/* Ranking info */}
  <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
    <div>
      <span className="font-semibold">Overall Rank:</span>{" "}
      #{professor.overallRank}
    </div>

    <div>
      <span className="font-semibold">
        Rank in {professor.department}:
      </span>{" "}
      #{professor.deptRank}
    </div>

    <div>
      {professor.ratingsCount} total ratings
    </div>
  </div>
</div>
          <h1 className="text-4xl font-semibold tracking-tight">
            {professor.name}
          </h1>

          <div className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            <div>
              <span className="font-semibold">Department:</span>{" "}
              {professor.department}
            </div>

            <div>
              <span className="font-semibold">School:</span>{" "}
              {professor.school}
            </div>
          </div>

          {professor.rmpUrl && (
            <div className="mt-6">
              <a
                href={professor.rmpUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-2xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-white dark:text-zinc-900"
              >
                View on RateMyProfessor
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}