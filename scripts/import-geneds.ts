import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

type GenEdEntry = {
  subject: string;
  number: string;
  categories: string[];
};

function key(subject: string, number: string) {
  return `${subject.trim().toUpperCase()} ${number.trim().toUpperCase()}`;
}

async function main() {
  const file = path.join(process.cwd(), "scripts", "geneds.cleaned.json");

  const data: GenEdEntry[] = JSON.parse(fs.readFileSync(file, "utf8"));

  const dbCourses = await prisma.course.findMany({
    select: {
      subject: true,
      number: true,
    },
  });

  const dbSet = new Set(dbCourses.map((c) => key(c.subject, c.number)));

  const matched = data.filter((course) =>
    dbSet.has(key(course.subject, course.number))
  );

  const missing = data
    .filter((course) => !dbSet.has(key(course.subject, course.number)))
    .map((course) => key(course.subject, course.number));

  console.log("Gen Ed entries in cleaned file:", data.length);
  console.log("Courses found in DB:", matched.length);
  console.log("Courses missing from DB:", missing.length);
  console.log("Sample missing:", missing.slice(0, 25));

  let updated = 0;

  for (let i = 0; i < matched.length; i++) {
    const course = matched[i];

    const result = await prisma.course.updateMany({
      where: {
        subject: course.subject,
        number: course.number,
      },
      data: {
        isGenEd: true,
        genEdCategory: course.categories[0] ?? null,
      },
    });

    updated += result.count;

    if ((i + 1) % 50 === 0 || i === matched.length - 1) {
      console.log(`Updated ${i + 1}/${matched.length} matched courses...`);
    }
  }

  console.log("\nDone.");
  console.log("Courses updated:", updated);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});