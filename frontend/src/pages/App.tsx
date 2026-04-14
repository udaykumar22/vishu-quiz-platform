import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { HostPage } from "./HostPage";
import { PlayerPage } from "./PlayerPage";
import { AdminPage } from "./AdminPage";
import { KanikonnaFall } from "../animations/KanikonnaFall";

const api = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const socket = io(api);

export function App() {
  const [tab, setTab] = useState<"host" | "player" | "admin">("host");
  const [roomCode, setRoomCode] = useState("");
  const [playerId] = useState(() => localStorage.getItem("playerId") ?? crypto.randomUUID());
  const [question, setQuestion] = useState<{ id: string; question: string; options: string[] } | null>(null);
  const [scoreboard, setScoreboard] = useState<Array<{ name: string; score: number }>>([]);
  const [musicOn, setMusicOn] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    localStorage.setItem("playerId", playerId);
    socket.on("quiz:room_state", (state) => {
      setRoomCode(state.roomCode || roomCode);
      setScoreboard(state.players ?? []);
    });
    socket.on("quiz:question", setQuestion);
    socket.on("quiz:scoreboard", setScoreboard);
    socket.on("quiz:completed", () => confetti({ particleCount: 200, spread: 90 }));
    return () => {
      socket.removeAllListeners();
    };
  }, [playerId, roomCode]);

  const title = useMemo(() => (tab === "host" ? "Vishu Kani Host" : tab === "player" ? "Vishu Quiz Player" : "Admin"), [tab]);

  return (
    <main className="app">
      <KanikonnaFall />
      <AnimatePresence>
        {showIntro && (
          <motion.section
            className="intro-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h1>Vishu Kani</h1>
            <p>Welcome to the Vishu Multiplayer Quiz</p>
            <button onClick={() => setShowIntro(false)}>Enter Festival Quiz</button>
          </motion.section>
        )}
      </AnimatePresence>
      <header>
        <h1>{title}</h1>
        <div className="row">
          <button onClick={() => setTab("host")}>Host</button>
          <button onClick={() => setTab("player")}>Player</button>
          <button onClick={() => setTab("admin")}>Admin</button>
          <button onClick={() => setMusicOn((v) => !v)}>{musicOn ? "Music Off" : "Music On"}</button>
        </div>
      </header>
      {musicOn && <audio src="https://cdn.pixabay.com/download/audio/2022/03/15/audio_b1f2969f5a.mp3" autoPlay loop />}
      <AnimatePresence mode="wait">
        {tab === "host" && (
          <motion.div key="host" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}>
            <HostPage socket={socket} roomCode={roomCode} setRoomCode={setRoomCode} scoreboard={scoreboard} />
          </motion.div>
        )}
        {tab === "player" && (
          <motion.div key="player" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}>
            <PlayerPage socket={socket} roomCode={roomCode} question={question} playerId={playerId} />
          </motion.div>
        )}
        {tab === "admin" && (
          <motion.div key="admin" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}>
            <AdminPage />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
