export const dynamic = "force-dynamic"
export const revalidate = 0

import prisma from "../../lib/prisma"
import CoursesTable from "./CoursesTable"

type SortKey = "difficultyDesc" | "difficultyAsc"

function parseSort(sort: string | undefined): SortKey {
  if (sort === "difficultyAsc") return "difficultyAsc"
  return "difficultyDesc"
}

function easinessPillClass(v: number) {
  if (v >= 4.5)
    return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-200 dark:ring-emerald-300/25";
  if (v >= 4.0)
    return "bg-green-100 text-green-700 ring-1 ring-green-200 dark:bg-green-400/15 dark:text-green-200 dark:ring-green-300/25";
  if (v >= 3.0)
    return "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200 dark:bg-yellow-400/15 dark:text-yellow-200 dark:ring-yellow-300/25";
  return "bg-red-100 text-red-700 ring-1 ring-red-200 dark:bg-red-400/15 dark:text-red-200 dark:ring-red-300/25";
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; page?: string; dept?: string; q?: string }>
}) {
  const sp = await searchParams

  const sort = parseSort(sp.sort)
  const page = Math.max(1, Number(sp.page || "1") || 1)
  const pageSize = 50
  const skip = (page - 1) * pageSize

  const dept = sp.dept?.trim() || ""
  const q = sp.q?.trim() || ""

  const hasSortParam = !!sp.sort
const hasQuery = q.length > 0

const where = {
  ...(dept ? { subject: dept } : {}),
  ...(q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { subject: { contains: q, mode: "insensitive" as const } },
          { number: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {}),
  ...(hasSortParam && !hasQuery
    ? {
        difficultyScore: { not: null },
        avgGpa: { gt: 0 },
      }
    : {}),
}

  const orderBy =
    sort === "difficultyAsc"
      ? [
          { difficultyScore: "asc" as const },
          { totalRegsAllTime: "desc" as const },
          { subject: "asc" as const },
          { number: "asc" as const },
        ]
      : [
          { difficultyScore: "desc" as const },
          { totalRegsAllTime: "desc" as const },
          { subject: "asc" as const },
          { number: "asc" as const },
        ]

  const [courses, total, subjectsRows] = await Promise.all([
    prisma.course.findMany({
      where,
      take: pageSize,
      skip,
      orderBy,
      select: {
        id: true,
        subject: true,
        number: true,
        title: true,
        difficultyScore: true,
        avgGpa: true,
        totalRegsAllTime: true,
      },
    }),
    prisma.course.count({ where }),
    prisma.course.findMany({
      distinct: ["subject"],
      select: { subject: true },
      orderBy: { subject: "asc" },
    }),
  ])

  const subjects = subjectsRows.map((s) => s.subject).filter(Boolean)

  return (
    <CoursesTable
      courses={courses}
      total={total}
      page={page}
      pageSize={pageSize}
      sort={sort}
      dept={dept}
      q={q}
      subjects={subjects}
    />
  )
}