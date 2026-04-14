import { z } from "zod";

export const DifficultySchema = z.enum(["easy", "medium", "hard", "expert"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const QuizModeSchema = z.enum(["standard", "fff"]);
export type QuizMode = z.infer<typeof QuizModeSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(8),
  options: z.array(z.string().min(1)).length(4),
  answer: z.string().min(1),
  difficulty: DifficultySchema,
  published: z.boolean().default(true),
  source: z.string().default("curated")
});
export type Question = z.infer<typeof QuestionSchema>;

export type PlayerScore = {
  playerId: string;
  name: string;
  score: number;
  correctCount: number;
  avgMs: number;
};

export type RoomState = {
  roomCode: string;
  hostName: string;
  mode: QuizMode;
  currentIndex: number;
  status: "lobby" | "in_progress" | "completed";
  timerSeconds: number;
};
