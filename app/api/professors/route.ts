import { NextResponse } from "next/server";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "@prisma/client";

const C = 20; // minimum weight, tweak later
const M = 4.0; // baseline average rating

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") || "").trim();
  const dept = (searchParams.get("dept") || "All").trim();
  const minRatings = Number(searchParams.get("minRatings") || "0") || 0;
  const minStars = Number(searchParams.get("minStars") || "0") || 0;
  const sort = (searchParams.get("sort") || "best").toLowerCase();

  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(10, Number(searchParams.get("pageSize") || "50") || 50)
  );
  const offset = (page - 1) * pageSize;

  const whereParts: string[] = [];
  const params: any[] = [];

  if (dept !== "All") {
    params.push(dept);
    whereParts.push(`"department" = $${params.length}`);
  }

  if (q) {
    params.push(`%${q}%`);
    const p1 = params.length;
    params.push(`%${q}%`);
    const p2 = params.length;
    whereParts.push(`("name" ILIKE $${p1} OR "department" ILIKE $${p2})`);
  }

  if (minRatings > 0) {
    params.push(minRatings);
    whereParts.push(`COALESCE("rmpRatingsCount", 0) >= $${params.length}`);
  }

  if (minStars > 0) {
    params.push(minStars);
    whereParts.push(`COALESCE("rmpQuality", 0) >= $${params.length}`);
  }

  const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

  const scoreSql = `
    CASE
      WHEN COALESCE("rmpRatingsCount", 0) = 0 THEN 0
      ELSE
        (COALESCE("rmpRatingsCount", 0)::float / (COALESCE("rmpRatingsCount", 0) + ${C})) * COALESCE("rmpQuality", 0)
        + (${C}::float / (COALESCE("rmpRatingsCount", 0) + ${C})) * ${M}
    END
  `;

  let orderSql = `"score" DESC, "rmpRatingsCount" DESC, "name" ASC`;
  if (sort === "worst") orderSql = `"score" ASC, "rmpRatingsCount" DESC, "name" ASC`;
  if (sort === "most") {
    orderSql = `COALESCE("rmpRatingsCount", 0) DESC, COALESCE("rmpQuality", 0) DESC, "name" ASC`;
  }

  const countRows = await prisma.$queryRawUnsafe<{ total: number }[]>(
    `SELECT COUNT(*)::int as total FROM "Professor" ${whereSql}`,
    ...params
  );
  const total = countRows?.[0]?.total ?? 0;

  const dataParams = [...params, pageSize, offset];
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
    SELECT
      "id",
      "slug",
      "name",
      "department",
      "school",
      COALESCE("rmpQuality", 0) as "quality",
      COALESCE("rmpRatingsCount", 0) as "ratingsCount",
      COALESCE("rmpUrl", '') as "url",
      ${scoreSql} as "score"
    FROM "Professor"
    ${whereSql}
    ORDER BY ${orderSql}
    LIMIT $${dataParams.length - 1}
    OFFSET $${dataParams.length}
    `,
    ...dataParams
  );

  return NextResponse.json({
    total,
    page,
    pageSize,
    items: rows,
  });
}
