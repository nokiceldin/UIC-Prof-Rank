// lib/generateProfessorSummary.ts

export type CourseRankSnippet = {
  courseLabel: string; // "CS 301"
  courseTitle?: string; // "Software Design" (optional)
  rank: number; // 1-based
  total: number;
};

export type ProfessorSummaryInput = {
  slug: string;
  name: string;
  department: string;
  school: string;

  quality: number; // 0..5
  ratingsCount: number;

  // These are based on your Bayesian score sorting
  score: number;
  overallRank: number;
  overallTotal: number;

  deptRank: number;
  deptTotal: number;

  // Derived from professor_to_courses.json
  coursesTaughtCount: number;

  // Top ranked courses for this professor (already computed elsewhere)
  topCourseRanks: CourseRankSnippet[];

  // Optional extra info if you want later
  notes?: {
    minRatingsThresholdUsed?: number; // if you ever do that
  };
};

function headline(input: ProfessorSummaryInput, seed: number) {
  const q = input.quality || 0;
  const n = input.ratingsCount || 0;

  const variants = [
    `Top rated in ${input.department} with a ${q.toFixed(1)} rating across ${n} reviews.`,
    `${q.toFixed(1)} rating across ${n} reviews, one of the strongest profiles in ${input.department}.`,
    `A standout in ${input.department}: ${q.toFixed(1)} rating with ${n} reviews.`,
    `Strong student feedback in ${input.department}: ${q.toFixed(1)} rating across ${n} reviews.`,
  ];

  return pick(variants, seed);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function pct(rank: number, total: number) {
  if (!total || total <= 0) return 1;
  return clamp(rank / total, 0, 1);
}

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: T[], seed: number) {
  if (!arr.length) throw new Error("pick called with empty array");
  return arr[seed % arr.length];
}

function formatCourseSnippet(c: CourseRankSnippet) {
  const title = (c.courseTitle || "").trim();
  if (title) return `${c.courseLabel} (${title})`;
  return c.courseLabel;
}

function joinNice(items: string[]) {
  const xs = items.filter(Boolean);
  if (xs.length === 0) return "";
  if (xs.length === 1) return xs[0];
  if (xs.length === 2) return `${xs[0]} and ${xs[1]}`;
  return `${xs.slice(0, -1).join(", ")}, and ${xs[xs.length - 1]}`;
}

function ratingTier(q: number) {
  if (q >= 4.7) return "elite";
  if (q >= 4.4) return "excellent";
  if (q >= 4.0) return "strong";
  if (q >= 3.4) return "mixed";
  if (q >= 2.8) return "weak";
  return "poor";
}

function sampleTier(n: number) {
  if (n >= 200) return "very_high";
  if (n >= 80) return "high";
  if (n >= 25) return "medium";
  if (n >= 8) return "low";
  if (n >= 1) return "tiny";
  return "none";
}

function rankTier(r: number, total: number) {
  const p = pct(r, total);
  if (p <= 0.01) return "top_1";
  if (p <= 0.05) return "top_5";
  if (p <= 0.10) return "top_10";
  if (p <= 0.25) return "top_25";
  if (p <= 0.50) return "top_50";
  return "lower";
}

function courseLoadTier(k: number) {
  if (k >= 10) return "many";
  if (k >= 5) return "several";
  if (k >= 2) return "few";
  if (k === 1) return "one";
  return "none";
}

function confidenceLine(tier: ReturnType<typeof sampleTier>, seed: number) {
  const high = [
    "The rating is backed by a solid amount of student feedback.",
    "This score is supported by a strong number of reviews.",
    "Plenty of reviews here, so the signal is pretty reliable.",
    "There is enough feedback here to feel confident in the rating.",
  ];
  const med = [
    "The rating has a decent sample size, but it can still move over time.",
    "There is a fair amount of feedback, though new reviews could shift things.",
    "The score is meaningful, but still not fully locked in.",
    "There is enough data to read into it, but expect some noise.",
  ];
  const low = [
    "This rating is based on a smaller number of reviews, so it may be noisy.",
    "There is limited review data, so treat the rating as a rough signal.",
    "Not a huge sample size yet, so new reviews could change the picture fast.",
    "Small sample size here, so keep that in mind.",
  ];
  const tiny = [
    "Very limited review data so far, so it is hard to be confident yet.",
    "Only a few reviews so far, so this is more of a first impression.",
    "Not much data yet, so this could change quickly.",
    "Early signal only, since the review count is low.",
  ];
  const none = [
    "No review data is available yet for this professor.",
    "No ratings yet, so there is not enough info to summarize.",
    "No reviews available so far.",
    "No rating data yet.",
  ];

  if (tier === "very_high" || tier === "high") return pick(high, seed);
  if (tier === "medium") return pick(med, seed);
  if (tier === "low") return pick(low, seed);
  if (tier === "tiny") return pick(tiny, seed);
  return pick(none, seed);
}

function performanceLine(
  ratingT: ReturnType<typeof ratingTier>,
  overallT: ReturnType<typeof rankTier>,
  deptT: ReturnType<typeof rankTier>,
  seed: number
) {
  const elite = [
    "Consistently one of the strongest picks on campus.",
    "Student satisfaction is extremely high here.",
    "This is a top tier profile by both rating and rank.",
    "One of the most trusted options based on student feedback.",
  ];
  const excellent = [
    "Very well regarded overall with strong rankings.",
    "Clearly above average and usually a safe choice.",
    "Strong profile with solid student feedback.",
    "High rating and competitive ranking overall.",
  ];
  const strong = [
    "Generally positive feedback with a solid overall standing.",
    "A strong option with good ratings and decent consistency.",
    "Well rated overall, especially compared to typical campus averages.",
    "Mostly positive signal here, with a good rank overall.",
  ];
  const mixed = [
    "Mixed feedback overall, likely course dependent.",
    "Looks like a professor where the specific class matters a lot.",
    "Not a clear yes or no, depends on what you are taking and what you like.",
    "Some students love it, some do not, so context matters.",
  ];
  const weak = [
    "Below average student feedback compared to peers.",
    "Not the strongest profile in the rankings right now.",
    "More negative signal than positive based on ratings.",
    "This one is trending weaker compared to department peers.",
  ];
  const poor = [
    "Consistently low satisfaction compared to peers.",
    "This is one of the weaker profiles by rating and rank.",
    "The ratings are quite low relative to the department.",
    "Based on student feedback, this is a tough profile.",
  ];

  const rankBoost = [
    "It also ranks well overall, which matches the rating.",
    "The overall rank is strong relative to the full dataset.",
    "The rank supports what the rating suggests.",
    "The ranking position lines up with the review score.",
  ];

  const rankNeutral = [
    "The rank is more middle of the pack overall.",
    "Ranking wise, it sits closer to the campus middle.",
    "The ranking is not extreme either way.",
    "Overall ranking is moderate compared to peers.",
  ];

  const rankLow = [
    "The overall rank is on the lower side compared to peers.",
    "Ranking wise, it is not near the top right now.",
    "The rank is weaker than average in the dataset.",
    "Overall ranking is fairly low compared to peers.",
  ];

  let base: string;
  if (ratingT === "elite") base = pick(elite, seed);
  else if (ratingT === "excellent") base = pick(excellent, seed);
  else if (ratingT === "strong") base = pick(strong, seed);
  else if (ratingT === "mixed") base = pick(mixed, seed);
  else if (ratingT === "weak") base = pick(weak, seed);
  else base = pick(poor, seed);

  const overallRankFeel =
    overallT === "top_1" || overallT === "top_5" || overallT === "top_10"
      ? pick(rankBoost, seed + 7)
      : overallT === "top_25" || overallT === "top_50"
      ? pick(rankNeutral, seed + 7)
      : pick(rankLow, seed + 7);

  const deptAdd =
    deptT === "top_1" || deptT === "top_5" || deptT === "top_10"
      ? "Within the department, it is also near the top."
      : deptT === "top_25" || deptT === "top_50"
      ? "Within the department, it lands around the middle."
      : "Within the department, it is currently ranked lower.";

  return `${base} ${overallRankFeel} ${deptAdd}`;
}

function courseLine(
  courseLoadT: ReturnType<typeof courseLoadTier>,
  coursesCount: number,
  topCourses: CourseRankSnippet[],
  seed: number
) {
  const none = [
    "Course mapping data is not available yet for this profile.",
    "No course mapping is attached to this professor yet.",
    "No course list is available for this professor right now.",
    "Course list data is missing for now.",
  ];

  const one = [
    "Currently mapped to 1 course in the dataset.",
    "Mapped to a single course so far.",
    "Appears in 1 course based on the current mapping.",
    "Only 1 mapped course is associated right now.",
  ];

  const few = [
    `Teaches ${coursesCount} courses in the current mapping.`,
    `Mapped to ${coursesCount} courses in the dataset.`,
    `Shows up across ${coursesCount} courses based on the mapping.`,
    `Appears on ${coursesCount} different course pages in the dataset.`,
  ];

  const several = [
    `Teaches ${coursesCount} courses in the current mapping, so there is a decent amount of coverage.`,
    `Mapped to ${coursesCount} courses, which gives a broader view of where they show up.`,
    `Shows up across ${coursesCount} courses, so students see them in multiple places.`,
    `Appears across ${coursesCount} courses in the mapping, which is a solid footprint.`,
  ];

  const many = [
    `Teaches ${coursesCount} courses in the mapping, so this profile covers a wide set of classes.`,
    `Mapped to ${coursesCount} courses, which is a big footprint across the catalog.`,
    `Shows up in ${coursesCount} courses, meaning students run into them a lot.`,
    `Appears across ${coursesCount} mapped courses, which is a broad teaching footprint.`,
  ];

  let base = "";
  if (courseLoadT === "none") base = pick(none, seed);
  else if (courseLoadT === "one") base = pick(one, seed);
  else if (courseLoadT === "few") base = pick(few, seed);
  else if (courseLoadT === "several") base = pick(several, seed);
  else base = pick(many, seed);

  const top = topCourses
    .slice(0, 2)
    .filter((c) => c.total >= 2 && c.rank >= 1)
    .map((c) => `${formatCourseSnippet(c)} at #${c.rank} of ${c.total}`);

  if (top.length === 0) return base;

  const addOns = [
    `Best course ranks include ${joinNice(top)}.`,
    `Strongest placements show up in ${joinNice(top)}.`,
    `Notable course standings include ${joinNice(top)}.`,
    `Course level highlights: ${joinNice(top)}.`,
  ];

  return `${base} ${pick(addOns, seed + 19)}`;
}

function closingLine(ratingT: ReturnType<typeof ratingTier>, sampleT: ReturnType<typeof sampleTier>, seed: number) {
  const elite = [
    "If you want a high confidence pick, this is one of the best profiles.",
    "This is a strong safe choice if you can get in.",
    "Hard to go wrong here if the course fits your schedule.",
    "If you are optimizing for good reviews, this is near the top.",
  ];
  const good = [
    "Looks like a solid option if you want a safe, well rated professor.",
    "Usually a good bet, especially if you prefer clearer teaching.",
    "Worth considering if you want above average student feedback.",
    "A solid pick for most students, based on what is available.",
  ];
  const mixed = [
    "Probably best to check the specific course and term before committing.",
    "This one looks more course dependent, so choose the class carefully.",
    "It may come down to fit and which class you take with them.",
    "If you can, compare against other options for that course.",
  ];
  const weak = [
    "If you have options, it might be worth comparing alternatives for the same course.",
    "This profile looks riskier, so consider other instructors if possible.",
    "Might be worth avoiding unless the schedule forces it.",
    "If you can, check other professors for the same course first.",
  ];

  if (sampleT === "none") {
    const noData = [
      "Once ratings are available, this summary will become more meaningful.",
      "As reviews come in, the profile will be easier to judge.",
      "There is not enough data yet, but it will improve as reviews appear.",
      "No data yet, so it is a blank slate for now.",
    ];
    return pick(noData, seed);
  }

  if (ratingT === "elite" || ratingT === "excellent") return pick(elite, seed);
  if (ratingT === "strong") return pick(good, seed);
  if (ratingT === "mixed") return pick(mixed, seed);
  return pick(weak, seed);
}
export function generateProfessorSummary(input: ProfessorSummaryInput) {
  const seed = hashString(input.slug || input.name);

  const q = Number.isFinite(input.quality) ? input.quality : 0;
  const n = Number.isFinite(input.ratingsCount) ? input.ratingsCount : 0;

  const overallT = rankTier(input.overallRank, input.overallTotal);
  const deptT = rankTier(input.deptRank, input.deptTotal);
  const ratingT = ratingTier(q);
  const sampleT = sampleTier(n);
  const courseLoadT = courseLoadTier(input.coursesTaughtCount);

  // 1) Headline (no more "appears under...")
  const head =
    n > 0
      ? headline(input, seed)
      : `${input.name} has no rating data yet.`;

  // 2) Bullet facts (short and scannable)
  const bullets: string[] = [];

  if (n > 0) bullets.push(`Rating: ${q.toFixed(1)} from ${n} reviews.`);
  bullets.push(`Overall rank: #${input.overallRank} of ${input.overallTotal}.`);
  bullets.push(`Department rank: #${input.deptRank} of ${input.deptTotal}.`);

  if (input.coursesTaughtCount > 0) {
    if (courseLoadT === "many") bullets.push(`Teaches a wide range of courses in the dataset (${input.coursesTaughtCount}).`);
    else bullets.push(`Courses taught in dataset: ${input.coursesTaughtCount}.`);
  } else {
    bullets.push(`Courses taught data is not available yet.`);
  }

  if (input.topCourseRanks?.length) {
    const top = input.topCourseRanks
      .slice(0, 3)
      .filter(c => c.total >= 2 && c.rank >= 1)
      .map(c => `${formatCourseSnippet(c)} (#${c.rank}/${c.total})`);

    if (top.length) bullets.push(`Best course ranks: ${joinNice(top)}.`);
  }

  const bulletBlock = bullets.map(b => `• ${b}`).join("\n");

  // 3) Short insight lines
  const perf = performanceLine(ratingT, overallT, deptT, seed + 3);
  const conf = confidenceLine(sampleT, seed + 11);
  const close = closingLine(ratingT, sampleT, seed + 29);

  // 4) Keep it tight (headline + bullets + 2 short insight blocks)
  const blocks = [
    head,
    bulletBlock,
    `${perf} ${conf}`,
    close,
  ];

  return blocks.join("\n\n").trim();
}