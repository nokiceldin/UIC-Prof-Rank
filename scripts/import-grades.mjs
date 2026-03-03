import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

function normalizeHeader(h) {
  return String(h || "").trim().replace(/\s+/g, " ");
}

function parseLine(line, delimiter) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out.map((x) => x.trim());
}

function detectDelimiter(firstLine) {
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return tabs >= commas ? "\t" : ",";
}

function toInt(v) {
  const n = Number(String(v || "").trim());
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function pick(row, colMap, name) {
  const idx = colMap.get(name);
  if (idx == null) return "";
  return row[idx] ?? "";
}

function sumStats(dst, add) {
  for (const k of Object.keys(add)) {
    dst[k] = (dst[k] || 0) + (add[k] || 0);
  }
  return dst;
}

async function upsertTerm(code) {
  const termKey = code.slice(4, 6);
  const termName = termKey === "FA" ? "Fall" : termKey === "SP" ? "Spring" : "Summer";
  const name = code.length === 6 ? `${termName} ${code.slice(0, 4)}` : code;

  return prisma.term.upsert({
    where: { code },
    update: { name },
    create: { code, name },
  });
}

async function main() {
  const term = getArg("term");
  const file = getArg("file");

  if (!term || !file) {
    console.log('Usage: node scripts/import-grades.mjs --term 2025FA --file public/data/fall25.csv');
    process.exit(1);
  }

  const abs = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
  const text = fs.readFileSync(abs, "utf8").replace(/\r\n/g, "\n").trim();
  const lines = text.split("\n").filter(Boolean);

  if (lines.length < 2) throw new Error("File has no data rows");

  const delimiter = detectDelimiter(lines[0]);
  const header = parseLine(lines[0], delimiter).map((h) => normalizeHeader(h.replace(/^"|"$/g, "")));
  const colMap = new Map();
  header.forEach((h, i) => colMap.set(h.replace(/^"|"$/g, ""), i));

  const required = [
    "CRS SUBJ CD","CRS NBR","CRS TITLE","DEPT CD","DEPT NAME",
    "Primary Instructor","Grade Regs",
    "A","B","C","D","F",
    "ADV","CR","DFR","I","NG","NR","O","PR","S","U","W",
  ];

  for (const r of required) {
    if (!colMap.has(r)) throw new Error(`Missing column: ${r}`);
  }

  const termRow = await upsertTerm(term);

  // 1) Aggregate in-memory
  const courseMeta = new Map(); // key -> {subject, number, title, deptCode, deptName}
  const courseTotals = new Map(); // key -> stats
  const instructorTotals = new Map(); // key2 -> stats

  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i], delimiter);

    const subject = String(pick(row, colMap, "CRS SUBJ CD")).trim().toUpperCase();
    const number = String(pick(row, colMap, "CRS NBR")).trim();
    const title = String(pick(row, colMap, "CRS TITLE")).trim();
    const deptCode = String(pick(row, colMap, "DEPT CD")).trim();
    const deptName = String(pick(row, colMap, "DEPT NAME")).trim();
    const instructorName = String(pick(row, colMap, "Primary Instructor")).trim();
    const gradeRegs = toInt(pick(row, colMap, "Grade Regs"));

    if (!subject || !number || !title) continue;

    const key = `${subject}__${number}`;
    courseMeta.set(key, { subject, number, title, deptCode: deptCode || null, deptName: deptName || null });

    const stats = {
      gradeRegs,
      a: toInt(pick(row, colMap, "A")),
      b: toInt(pick(row, colMap, "B")),
      c: toInt(pick(row, colMap, "C")),
      d: toInt(pick(row, colMap, "D")),
      f: toInt(pick(row, colMap, "F")),
      adv: toInt(pick(row, colMap, "ADV")),
      cr: toInt(pick(row, colMap, "CR")),
      dfr: toInt(pick(row, colMap, "DFR")),
      i: toInt(pick(row, colMap, "I")),
      ng: toInt(pick(row, colMap, "NG")),
      nr: toInt(pick(row, colMap, "NR")),
      o: toInt(pick(row, colMap, "O")),
      pr: toInt(pick(row, colMap, "PR")),
      s: toInt(pick(row, colMap, "S")),
      u: toInt(pick(row, colMap, "U")),
      w: toInt(pick(row, colMap, "W")),
    };

    if (!courseTotals.has(key)) courseTotals.set(key, {});
    sumStats(courseTotals.get(key), stats);

    if (instructorName) {
      const key2 = `${key}__${instructorName}`;
      if (!instructorTotals.has(key2)) instructorTotals.set(key2, {});
      sumStats(instructorTotals.get(key2), stats);
    }
  }

  console.log(`Aggregated: ${courseTotals.size} courses, ${instructorTotals.size} course+instructor groups`);

  // 2) Upsert courses in batches
  const keys = Array.from(courseMeta.keys());
  const courseIdByKey = new Map();

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const meta = courseMeta.get(key);

    const course = await prisma.course.upsert({
      where: { subject_number: { subject: meta.subject, number: meta.number } },
      update: { title: meta.title, deptCode: meta.deptCode, deptName: meta.deptName },
      create: { subject: meta.subject, number: meta.number, title: meta.title, deptCode: meta.deptCode, deptName: meta.deptName },
    });

    courseIdByKey.set(key, course.id);

    if ((i + 1) % 200 === 0) console.log(`Upserted courses: ${i + 1}/${keys.length}`);
  }

  // 3) Upsert course term totals
  const courseKeys = Array.from(courseTotals.keys());
  for (let i = 0; i < courseKeys.length; i++) {
    const key = courseKeys[i];
    const courseId = courseIdByKey.get(key);
    const stats = courseTotals.get(key);

    await prisma.courseTermStats.upsert({
      where: { courseId_termId: { courseId, termId: termRow.id } },
      update: stats,
      create: { courseId, termId: termRow.id, ...stats },
    });

    if ((i + 1) % 200 === 0) console.log(`Upserted course totals: ${i + 1}/${courseKeys.length}`);
  }

  // 4) Upsert instructor totals
  const instKeys = Array.from(instructorTotals.keys());
  for (let i = 0; i < instKeys.length; i++) {
    const key2 = instKeys[i];
    const [courseKey, instructorName] = key2.split("__").slice(0, 2).length === 2
      ? key2.split("__").reduce((acc, part, idx, arr) => {
          if (idx < 2) acc[0].push(part);
          else acc[1].push(part);
          return acc;
        }, [[], []]).map((x) => x.join("__"))
      : [null, null];

    // safer split:
    const parts = key2.split("__");
    const courseKeyFixed = `${parts[0]}__${parts[1]}`;
    const instructorFixed = parts.slice(2).join("__");

    const courseId = courseIdByKey.get(courseKeyFixed);
    const stats = instructorTotals.get(key2);

    await prisma.courseInstructorTermStats.upsert({
      where: { courseId_termId_instructorName: { courseId, termId: termRow.id, instructorName: instructorFixed } },
      update: stats,
      create: { courseId, termId: termRow.id, instructorName: instructorFixed, ...stats },
    });

    if ((i + 1) % 300 === 0) console.log(`Upserted instructor totals: ${i + 1}/${instKeys.length}`);
  }

  console.log(`Done. Imported aggregated stats into term ${term}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });