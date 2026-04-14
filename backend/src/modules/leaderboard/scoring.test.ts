import { describe, expect, it } from "vitest";
import { ranked, scoreAnswer } from "./scoring.js";

describe("scoring", () => {
  it("awards speed bonus in fff", () => {
    expect(scoreAnswer(true, 1200, "fff")).toBeGreaterThan(10);
    expect(scoreAnswer(false, 1200, "fff")).toBe(0);
  });

  it("ranks by score then avg speed", () => {
    const result = ranked([
      { playerId: "1", name: "A", socketId: "x", score: 20, correct: 2, totalMs: 3000 },
      { playerId: "2", name: "B", socketId: "y", score: 20, correct: 2, totalMs: 5000 }
    ]);
    expect(result[0].name).toBe("A");
  });
});
