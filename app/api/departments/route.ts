import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT DISTINCT "department"
       FROM "Professor"
       WHERE "department" IS NOT NULL AND "department" <> ''
       ORDER BY "department" ASC`
    );

    const depts = result.rows.map((r) => r.department);
    return NextResponse.json(depts);
  } catch (err) {
    console.error("GET /api/departments error:", err);
    return NextResponse.json(
      { error: "Failed to load departments" },
      { status: 500 }
    );
  }
}
