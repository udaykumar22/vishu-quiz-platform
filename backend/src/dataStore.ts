import fs from "node:fs";
import path from "node:path";
import { v4 as uuid } from "uuid";
import { QuizQuestion, Room } from "./types.js";

const questionsFile = path.resolve(process.cwd(), "data/questions.vishu.en.json");

type Certificate = {
  id: string;
  playerName: string;
  roomCode: string;
  score: number;
  grade: string;
  createdAt: string;
};

export const store = {
  rooms: new Map<string, Room>(),
  playerIdentity: new Map<string, string>(),
  certificates: new Map<string, Certificate>(),
  questions: [] as QuizQuestion[]
};

export function loadQuestions() {
  const text = fs.readFileSync(questionsFile, "utf-8");
  store.questions = JSON.parse(text) as QuizQuestion[];
}

export function upsertQuestions(questions: QuizQuestion[]) {
  store.questions = questions;
  fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2));
}

export function createCertificate(payload: Omit<Certificate, "id" | "createdAt">) {
  const cert: Certificate = {
    id: uuid(),
    createdAt: new Date().toISOString(),
    ...payload
  };
  store.certificates.set(cert.id, cert);
  return cert;
}
