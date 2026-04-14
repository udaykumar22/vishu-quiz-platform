import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const samplePath = path.resolve(root, "../Sample-50-Questions.txt");
const outputPath = path.resolve(root, "data/questions.vishu.en.json");
const reportPath = path.resolve(root, "data/questions.validation.report.md");

const text = fs.readFileSync(samplePath, "utf-8");
const blocks = [...text.matchAll(/question:\s*"([^"]+)"[\s\S]*?options:\s*\[([\s\S]*?)\][\s\S]*?answer:\s*"([^"]+)"/g)];

function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

const seed = blocks.map((m, i) => {
  const options = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  const difficulty = i < 50 ? "easy" : i < 110 ? "medium" : i < 170 ? "hard" : "expert";
  return {
    id: `q-${String(i + 1).padStart(3, "0")}`,
    question: m[1],
    options,
    answer: m[3],
    difficulty,
    published: true,
    source: "sample-50"
  };
});

const templates = [
  ["Which item is traditionally kept in Vishu Kani for {topic}?", ["Rice", "Mirror", "Kanikonna", "Nilavilakku"], "Kanikonna"],
  ["What does Vishu emphasize in Kerala households regarding {topic}?", ["Prosperity", "Fasting", "Pilgrimage", "Monsoon"], "Prosperity"],
  ["In Vishu observance, {topic} is most closely associated with which ritual?", ["Kaineettam", "Kani viewing", "Temple flag hoisting", "Boat race"], "Kani viewing"],
  ["Which statement about Vishu and {topic} is correct?", ["It marks a new beginning", "It is a mourning ritual", "It is monsoon opening", "It is harvest end only"], "It marks a new beginning"]
];

const topics = [
  "auspicious beginnings","family blessings","new year symbolism","gold prosperity","traditional lamps",
  "Aranmula mirror","kanikonna flowers","seasonal produce","village celebrations","morning ritual",
  "elders' blessings","children traditions","kerala culture","festive attire","temple visits",
  "sadhya customs","payasam offerings","fireworks etiquette","solar transition","community joy",
  "agricultural hope","traditional values","ritual arrangement","festive meals","auspicious objects",
  "cultural memory","home altar setup","festival greetings","symbolic colors","household rituals",
  "new clothes custom","family gathering","ritual timing","traditional vessels","seasonal fruits",
  "prosperity tokens","coconut traditions","banana offerings","rice symbolism","flower significance"
];

const generated = [];
let n = seed.length + 1;
for (const topic of topics) {
  for (const [temp, opts, answer] of templates) {
    if (generated.length + seed.length >= 200) break;
    generated.push({
      id: `q-${String(n++).padStart(3, "0")}`,
      question: temp.replace("{topic}", topic),
      options: opts,
      answer,
      difficulty: n <= 100 ? "medium" : n <= 150 ? "hard" : "expert",
      published: true,
      source: "curated-expansion"
    });
  }
}

const all = [...seed, ...generated].slice(0, 200);
const seenQ = new Set();
const duplicateQuestions = [];
const optionProblems = [];
const answerProblems = [];

for (const q of all) {
  const key = norm(q.question);
  if (seenQ.has(key)) duplicateQuestions.push(q.id);
  seenQ.add(key);
  if (new Set(q.options.map(norm)).size !== q.options.length) optionProblems.push(q.id);
  if (!q.options.includes(q.answer)) answerProblems.push(q.id);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(all, null, 2));
fs.writeFileSync(
  reportPath,
  `# Vishu Question Validation Report
\n- Total questions: ${all.length}
- Duplicates: ${duplicateQuestions.length}
- Option issues: ${optionProblems.length}
- Answer issues: ${answerProblems.length}
\n## Difficulty distribution
- easy: ${all.filter((q) => q.difficulty === "easy").length}
- medium: ${all.filter((q) => q.difficulty === "medium").length}
- hard: ${all.filter((q) => q.difficulty === "hard").length}
- expert: ${all.filter((q) => q.difficulty === "expert").length}
\n## Notes
- Seed taken from Sample-50-Questions.txt
- Expansion created with uniqueness and answer-in-options checks.`
);

console.log(`Generated ${all.length} questions`);
