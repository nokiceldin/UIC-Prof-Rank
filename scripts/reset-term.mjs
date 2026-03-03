import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function main() {
  const termCode = getArg("term");
  if (!termCode) {
    console.log("Usage: node scripts/reset-term.mjs --term 2025FA");
    process.exit(1);
  }

  const term = await prisma.term.findUnique({ where: { code: termCode } });
  if (!term) {
    console.log(`Term ${termCode} not found, nothing to reset.`);
    return;
  }

  await prisma.courseInstructorTermStats.deleteMany({ where: { termId: term.id } });
  await prisma.courseTermStats.deleteMany({ where: { termId: term.id } });

  console.log(`Reset stats for term ${termCode}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });