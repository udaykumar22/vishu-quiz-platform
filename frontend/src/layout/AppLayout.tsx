import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { KanikonnaFall } from "../animations/KanikonnaFall";

const api = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

/** Primary: try a light instrumental; fallback on `error` event (see audio element). */
const FESTIVAL_AUDIO_PRIMARY =
  "https://cdn.pixabay.com/download/audio/2022/03/24/audio_5b982d7c21.mp3?filename=soft-india-110666.mp3";
const FESTIVAL_AUDIO_FALLBACK = "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3";

export type QuizOutletContext = {
  socket: Socket;
  roomCode: string;
  setRoomCode: (v: string) => void;
  playerId: string;
  question: { id: string; question: string; options: string[] } | null;
  scoreboard: Array<{ name: string; score: number }>;
};

export function AppLayout() {
  const location = useLocation();
  const [socket] = useState(() => io(api));
  const [roomCode, setRoomCode] = useState("");
  const [playerId] = useState(() => localStorage.getItem("playerId") ?? crypto.randomUUID());
  const [question, setQuestion] = useState<{ id: string; question: string; options: string[] } | null>(null);
  const [scoreboard, setScoreboard] = useState<Array<{ name: string; score: number }>>([]);
  const [musicOn, setMusicOn] = useState(false);
  const [showIntro, setShowIntro] = useState(() => location.pathname === "/");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioSrc, setAudioSrc] = useState(FESTIVAL_AUDIO_PRIMARY);

  useEffect(() => {
    audioRef.current?.load();
  }, [audioSrc]);

  useEffect(() => {
    localStorage.setItem("playerId", playerId);
  }, [playerId]);

  useEffect(() => {
    const onRoom = (state: { roomCode?: string; players?: Array<{ name: string; score: number }> }) => {
      if (state.roomCode) setRoomCode(state.roomCode);
      setScoreboard(state.players ?? []);
    };
    socket.on("quiz:room_state", onRoom);
    socket.on("quiz:question", setQuestion);
    socket.on("quiz:scoreboard", setScoreboard);
    const onDone = () => confetti({ particleCount: 200, spread: 90 });
    socket.on("quiz:completed", onDone);
    return () => {
      socket.off("quiz:room_state", onRoom);
      socket.off("quiz:question", setQuestion);
      socket.off("quiz:scoreboard", setScoreboard);
      socket.off("quiz:completed", onDone);
    };
  }, [socket]);

  const syncAudio = useCallback(
    async (nextOn: boolean) => {
      const el = audioRef.current;
      if (!el) return;
      if (nextOn) {
        try {
          el.volume = 0.35;
          await el.play();
        } catch {
          setMusicOn(false);
        }
      } else {
        el.pause();
      }
    },
    []
  );

  const toggleMusic = async () => {
    const next = !musicOn;
    setMusicOn(next);
    await syncAudio(next);
  };

  const title =
    location.pathname.startsWith("/host")
      ? "Host dashboard"
      : location.pathname.startsWith("/player")
        ? "Player"
        : location.pathname.startsWith("/admin")
          ? "Admin"
          : "Vishu Quiz";

  const outletContext: QuizOutletContext = {
    socket,
    roomCode,
    setRoomCode,
    playerId,
    question,
    scoreboard
  };

  return (
    <main className="app">
      <div className="bg-vishu" aria-hidden="true" />
      <div className="bg-lamp-glow" aria-hidden="true" />
      <KanikonnaFall />
      <audio
        ref={audioRef}
        src={audioSrc}
        loop
        preload="metadata"
        onError={() => setAudioSrc((prev) => (prev === FESTIVAL_AUDIO_FALLBACK ? prev : FESTIVAL_AUDIO_FALLBACK))}
      />

      <AnimatePresence>
        {showIntro && location.pathname === "/" && (
          <motion.section
            className="intro-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h1 className="intro-kani">Vishu Kani</h1>
            <p className="intro-sub">Welcome to the Vishu multiplayer quiz</p>
            <button type="button" className="btn-primary" onClick={() => setShowIntro(false)}>
              Enter festival quiz
            </button>
          </motion.section>
        )}
      </AnimatePresence>

      <header className="site-header">
        <div className="site-header__inner">
          <Link to="/" className="site-brand">
            Vishu Quiz
          </Link>
          <h1 className="site-title">{title}</h1>
          <div className="site-header__actions">
            <button type="button" className="btn-ghost" onClick={() => void toggleMusic()}>
              {musicOn ? "Music off" : "Music on"}
            </button>
          </div>
        </div>
        <p className="site-header__note">
          Music only starts after you tap &quot;Music on&quot; (browser autoplay rules). Use device volume if needed.
        </p>
      </header>

      <div className="outlet-wrap">
        <Outlet context={outletContext} />
      </div>
    </main>
  );
}
