export function normalizeProfName(raw: string) {
  if (!raw) return "";

  let s = raw.trim();

  // If it is "Last, First ..." then flip it to "First ... Last"
  if (s.includes(",")) {
    const parts = s.split(",").map((x) => x.trim()).filter(Boolean);
    const last = parts[0] ?? "";
    const first = parts.slice(1).join(" ").trim();
    s = `${first} ${last}`.trim();
  }

  s = s
    .toLowerCase()
    .replace(/['"\.]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return s;
}

export function findSlugForUicName(
  uicName: string,
  professors: { name: string; slug: string }[]
): string | null {
  const uicNorm = normalizeProfName(uicName);
  const uicTokens = new Set(
    uicNorm.split(" ").filter((t) => t.length > 1)
  );

  if (uicTokens.size < 2) return null;

  let bestSlug: string | null = null;
  let bestScore = 0;

  for (const prof of professors) {
    const rmpTokens = normalizeProfName(prof.name)
      .split(" ")
      .filter((t) => t.length > 1);

    if (rmpTokens.length < 2) continue;

    const allMatch = rmpTokens.every((t) => uicTokens.has(t));
    if (!allMatch) continue;

    const score = rmpTokens.length;
    if (score > bestScore) {
      bestScore = score;
      bestSlug = prof.slug;
    }
  }

  return bestSlug;
}