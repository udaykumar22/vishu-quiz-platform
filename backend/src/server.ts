import express from "express";
import type { Request, RequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { loadQuestions, store, upsertQuestions } from "./dataStore.js";
import { ranked, scoreAnswer } from "./modules/leaderboard/scoring.js";
import { generateCertificatePdf } from "./modules/certificates/certificateService.js";
import { SocketEvents } from "./socket/events.js";
import { QuizQuestion, Room } from "./types.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
const port = Number(process.env.PORT ?? 4000);
const jwtSecret = process.env.JWT_SECRET ?? "dev-secret";
const adminUser = process.env.ADMIN_USER ?? "admin";
const adminPassword = process.env.ADMIN_PASSWORD ?? "vishu-admin";
const hostUser = process.env.HOST_USER ?? "host";
const hostPassword = process.env.HOST_PASSWORD ?? "vishu-host";

app.use(cors());
app.use(helmet());
app.use(compression() as any);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

loadQuestions();

function roomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function safeRoom(room: Room) {
  return {
    roomCode: room.roomCode,
    mode: room.mode,
    status: room.status,
    timerSeconds: room.timerSeconds,
    currentQuestionIndex: room.currentQuestionIndex,
    players: Object.values(room.players).map((p) => ({
      playerId: p.playerId,
      name: p.name,
      score: p.score
    }))
  };
}

function getBearer(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7);
}

const requireAdmin: RequestHandler = (req, res, next) => {
  const token = getBearer(req);
  if (!token) return res.status(401).json({ message: "Missing Authorization Bearer token" });
  try {
    const decoded = jwt.verify(token, jwtSecret) as { role?: string };
    if (decoded.role !== "admin") return res.status(403).json({ message: "Admin role required" });
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

app.get("/api/health", (_req, res) => res.json({ ok: true, questions: store.questions.length }));

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body ?? {};
  if (username !== adminUser || password !== adminPassword) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = jwt.sign({ role: "admin", username }, jwtSecret, { expiresIn: "8h" });
  res.json({ token });
});

app.post("/api/host/login", (req, res) => {
  const { username, password } = req.body ?? {};
  if (username !== hostUser || password !== hostPassword) {
    return res.status(401).json({ message: "Invalid host credentials" });
  }
  const token = jwt.sign({ role: "host", username }, jwtSecret, { expiresIn: "8h" });
  res.json({ token });
});

app.get("/api/admin/questions", requireAdmin, (_req, res) => res.json(store.questions));
app.post("/api/admin/questions", requireAdmin, (req, res) => {
  const body = req.body as QuizQuestion;
  const question = { ...body, id: body.id || uuid() };
  store.questions.push(question);
  upsertQuestions(store.questions);
  res.status(201).json(question);
});
app.put("/api/admin/questions/:id", requireAdmin, (req, res) => {
  const idx = store.questions.findIndex((q) => q.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: "Not found" });
  store.questions[idx] = { ...store.questions[idx], ...(req.body as Partial<QuizQuestion>) };
  upsertQuestions(store.questions);
  res.json(store.questions[idx]);
});
app.delete("/api/admin/questions/:id", requireAdmin, (req, res) => {
  store.questions = store.questions.filter((q) => q.id !== req.params.id);
  upsertQuestions(store.questions);
  res.status(204).send();
});
app.get("/api/admin/questions/export", requireAdmin, (_req, res) => {
  res.json({ questions: store.questions });
});
app.post("/api/admin/questions/import", requireAdmin, (req, res) => {
  const incoming = req.body?.questions as QuizQuestion[] | undefined;
  if (!incoming || !Array.isArray(incoming)) {
    return res.status(400).json({ message: "questions[] is required" });
  }
  upsertQuestions(incoming);
  res.json({ imported: incoming.length });
});

app.get("/api/certificates/:id/verify", (req, res) => {
  const cert = store.certificates.get(req.params.id);
  if (!cert) return res.status(404).json({ valid: false });
  return res.json({ valid: true, cert });
});

function verifyHostToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, jwtSecret) as { role?: string };
    return decoded.role === "host";
  } catch {
    return false;
  }
}

io.on("connection", (socket) => {
  socket.on(SocketEvents.hostAuthenticate, (payload: { token?: string }, ack?: (r: { ok: boolean; message?: string }) => void) => {
    const ok = verifyHostToken(payload?.token);
    socket.data.hostAuthed = ok;
    if (ack) ack(ok ? { ok: true } : { ok: false, message: "Invalid or expired host token. Log in again on the Host page." });
  });

  socket.on(SocketEvents.hostCreateRoom, ({ hostName }) => {
    if (!socket.data.hostAuthed) {
      socket.emit(SocketEvents.hostError, { message: "Host login required. Sign in with Host ID and password, then try again." });
      return;
    }
    const code = roomCode();
    const qs = store.questions.filter((q) => q.published).map((q) => q.id);
    const room: Room = {
      roomCode: code,
      hostSocketId: socket.id,
      hostName: hostName ?? "Host",
      mode: "standard",
      status: "lobby",
      currentQuestionIndex: 0,
      questionIds: qs.slice(0, 20),
      timerSeconds: 20,
      players: {},
      answers: {}
    };
    store.rooms.set(code, room);
    socket.join(code);
    io.to(code).emit(SocketEvents.roomState, safeRoom(room));
  });

  socket.on(SocketEvents.playerJoin, ({ roomCode, name, playerToken }) => {
    const room = store.rooms.get(roomCode);
    if (!room) return;
    socket.join(roomCode);
    const playerId = playerToken ?? uuid();
    room.players[playerId] = room.players[playerId] ?? {
      playerId,
      name,
      socketId: socket.id,
      score: 0,
      correct: 0,
      totalMs: 0
    };
    room.players[playerId].socketId = socket.id;
    room.players[playerId].name = name;
    io.to(roomCode).emit(SocketEvents.roomState, safeRoom(room));
  });

  socket.on(SocketEvents.hostSetMode, ({ roomCode, mode }) => {
    const room = store.rooms.get(roomCode);
    if (!room || room.hostSocketId !== socket.id || !socket.data.hostAuthed) return;
    room.mode = mode;
    io.to(roomCode).emit(SocketEvents.roomState, safeRoom(room));
  });

  socket.on(SocketEvents.hostStartQuiz, ({ roomCode }) => {
    const room = store.rooms.get(roomCode);
    if (!room || room.hostSocketId !== socket.id || !socket.data.hostAuthed) return;
    room.status = "in_progress";
    room.currentQuestionIndex = 0;
    room.answers = {};
    const q = store.questions.find((x) => x.id === room.questionIds[room.currentQuestionIndex]);
    io.to(roomCode).emit(SocketEvents.question, q);
    io.to(roomCode).emit(SocketEvents.roomState, safeRoom(room));
  });

  socket.on(SocketEvents.playerAnswer, ({ roomCode, playerId, option, ms }) => {
    const room = store.rooms.get(roomCode);
    if (!room || room.status !== "in_progress") return;
    room.answers[playerId] = { option, ms };
  });

  socket.on(SocketEvents.hostNextQuestion, ({ roomCode }) => {
    const room = store.rooms.get(roomCode);
    if (!room || room.hostSocketId !== socket.id || !socket.data.hostAuthed) return;
    const q = store.questions.find((x) => x.id === room.questionIds[room.currentQuestionIndex]);
    if (q) {
      Object.entries(room.answers).forEach(([playerId, ans]) => {
        const player = room.players[playerId];
        if (!player) return;
        const correct = ans.option === q.answer;
        const points = scoreAnswer(correct, ans.ms, room.mode);
        player.score += points;
        if (correct) {
          player.correct += 1;
          player.totalMs += ans.ms;
        }
      });
    }
    room.answers = {};
    room.currentQuestionIndex += 1;
    const leaders = ranked(Object.values(room.players));
    io.to(roomCode).emit(SocketEvents.scoreboard, leaders);

    if (room.currentQuestionIndex >= room.questionIds.length) {
      room.status = "completed";
      io.to(roomCode).emit(SocketEvents.completed, leaders);
      io.to(roomCode).emit(SocketEvents.roomState, safeRoom(room));
      return;
    }

    const next = store.questions.find((x) => x.id === room.questionIds[room.currentQuestionIndex]);
    io.to(roomCode).emit(SocketEvents.question, next);
    io.to(roomCode).emit(SocketEvents.roomState, safeRoom(room));
  });
});

app.post("/api/rooms/:roomCode/certificates", async (req, res) => {
  const room = store.rooms.get(req.params.roomCode);
  if (!room) return res.status(404).json({ message: "Room not found" });
  const { playerId } = req.body;
  const player = room.players[playerId];
  if (!player) return res.status(404).json({ message: "Player not found" });
  const maxScore = room.questionIds.length * 20;
  const baseUrl = process.env.BACKEND_URL ?? `http://localhost:${port}`;
  const pdf = await generateCertificatePdf(baseUrl, player.name, room.roomCode, player.score, maxScore);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("X-Certificate-Id", pdf.cert.id);
  return res.send(pdf.buffer);
});

httpServer.listen(port, () => {
  console.log(`Vishu Quiz backend running on ${port}`);
});
