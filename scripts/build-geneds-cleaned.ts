import fs from "fs";
import path from "path";

type GenEdEntry = {
  subject: string;
  number: string;
  categories: string[];
};

const CATEGORY_NAMES = [
  "Analyzing the Natural World",
  "Understanding the Individual and Society",
  "Understanding the Past",
  "Understanding the Creative Arts",
  "Exploring World Cultures",
  "Understanding U.S. Society",
];

function normalize(line: string) {
  return line
    .replace(/\uFEFF/g, "")
    .replace(/\t+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectCategory(line: string): string | null {
  const clean = normalize(line).toLowerCase();

  for (const category of CATEGORY_NAMES) {
    const c = category.toLowerCase();
    if (clean === c) return category;
    if (clean === `${c} course`) return category;
    if (clean === `${c} courses`) return category;
    if (clean.includes(c) && clean.includes("course")) return category;
  }

  return null;
}

function extractCourse(line: string) {
  const clean = normalize(line);
  const match = clean.match(/^([A-Z]{2,5})\s+(\d{3}[A-Z]?)(?:\s|$)/);

  if (!match) return null;

  return {
    subject: match[1].trim(),
    number: match[2].trim(),
  };
}

function isDepartmentHeader(line: string) {
  const clean = normalize(line);

  if (!clean) return false;
  if (detectCategory(clean)) return false;
  if (extractCourse(clean)) return false;

  return true;
}

function main() {
  const rawPath = path.join(process.cwd(), "scripts", "geneds-raw.txt");
  const outPath = path.join(process.cwd(), "scripts", "geneds.cleaned.json");

  const raw = fs.readFileSync(rawPath, "utf8");
  const lines = raw.split(/\r?\n/).map(normalize).filter(Boolean);

  const map = new Map<string, GenEdEntry>();
  let currentCategory: string | null = null;

  let categoryHits = 0;
  let courseHits = 0;

  for (const line of lines) {
    const foundCategory = detectCategory(line);

    if (foundCategory) {
      currentCategory = foundCategory;
      categoryHits++;
      continue;
    }

    if (isDepartmentHeader(line)) {
      continue;
    }

    const course = extractCourse(line);

    if (!course || !currentCategory) {
      continue;
    }

    courseHits++;

    const k = `${course.subject} ${course.number}`;
    const existing = map.get(k);

    if (!existing) {
      map.set(k, {
        subject: course.subject,
        number: course.number,
        categories: [currentCategory],
      });
    } else if (!existing.categories.includes(currentCategory)) {
      existing.categories.push(currentCategory);
    }
  }

  const result = Array.from(map.values()).sort((a, b) => {
    if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
    return a.number.localeCompare(b.number);
  });

  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf8");

  console.log("Detected category headers:", categoryHits);
  console.log("Detected course lines:", courseHits);
  console.log("Unique cleaned courses:", result.length);

  const categoryCounts = CATEGORY_NAMES.map((category) => ({
    category,
    count: result.filter((x) => x.categories.includes(category)).length,
  }));

  console.log("\nCategory counts:");
  for (const row of categoryCounts) {
    console.log(`${row.category}: ${row.count}`);
  }
}

main();