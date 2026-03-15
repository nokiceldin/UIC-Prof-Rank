import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  const { message, rating } = await req.json();
  await prisma.feedback.create({ data: { message, rating } });
  return NextResponse.json({ ok: true });
}