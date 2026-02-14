import "dotenv/config";
import { NextResponse } from "next/server";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

export async function GET() {
  const rows = await prisma.professor.findMany({
    select: { department: true },
  });

  const depts = Array.from(
    new Set(rows.map((r) => r.department).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  return NextResponse.json(depts);
}
