import { Player } from "../../types.js";

export function scoreAnswer(correct: boolean, ms: number, mode: "standard" | "fff") {
  if (!correct) return 0;
  if (mode === "standard") return 10;
  const speedBonus = Math.max(0, 5000 - ms) / 500;
  return Math.round(10 + speedBonus);
}

export function ranked(players: Player[]) {
  return [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const avgA = a.correct ? a.totalMs / a.correct : Number.MAX_SAFE_INTEGER;
    const avgB = b.correct ? b.totalMs / b.correct : Number.MAX_SAFE_INTEGER;
    return avgA - avgB;
  });
}
