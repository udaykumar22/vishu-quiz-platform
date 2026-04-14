export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  published: boolean;
  source: string;
};

export type Player = {
  playerId: string;
  name: string;
  socketId: string;
  score: number;
  correct: number;
  totalMs: number;
};

export type Room = {
  roomCode: string;
  hostSocketId: string;
  hostName: string;
  mode: "standard" | "fff";
  status: "lobby" | "in_progress" | "completed";
  currentQuestionIndex: number;
  questionIds: string[];
  timerSeconds: number;
  players: Record<string, Player>;
  answers: Record<string, { option: string; ms: number }>;
};
