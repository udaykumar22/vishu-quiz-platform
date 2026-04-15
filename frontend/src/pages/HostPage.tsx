import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { QuizOutletContext } from "../layout/AppLayout";

const api = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function HostPage() {
  const { socket, roomCode, setRoomCode, scoreboard } = useOutletContext<QuizOutletContext>();
  const [hostName, setHostName] = useState("Host");
  const [mode, setMode] = useState<"standard" | "fff">("standard");
  const [joinQrDataUrl, setJoinQrDataUrl] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);

  const sorted = useMemo(() => [...scoreboard].sort((a, b) => b.score - a.score), [scoreboard]);

  useEffect(() => {
    if (!roomCode.trim()) {
      setJoinQrDataUrl(null);
      setJoinUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${api}/api/rooms/${encodeURIComponent(roomCode)}/join-qr`);
        const data = (await res.json()) as { qr?: string; joinUrl?: string };
        if (!cancelled) {
          setJoinQrDataUrl(data.qr ?? null);
          setJoinUrl(data.joinUrl ?? null);
        }
      } catch {
        if (!cancelled) {
          setJoinQrDataUrl(null);
          setJoinUrl(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomCode]);

  return (
    <section className="card">
      <h2>Host dashboard</h2>
      <p className="help-text">
        <strong>What to enter:</strong> Your display name as host, then create a room. After the room code appears,
        share the <strong>join link</strong> or <strong>QR</strong> with players. Use <strong>Next question</strong> after
        each round to score answers and move on (it is a button, not a web link).
      </p>

      <div className="field-block">
        <label className="field-label" htmlFor="host-name">
          Host display name
        </label>
        <p className="field-hint">Shown to players (e.g. your name or &quot;Quiz Club&quot;).</p>
        <div className="field-row">
          <input id="host-name" value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder="e.g. Uday" />
          <button type="button" onClick={() => socket.emit("host:create_room", { hostName })}>
            Create room
          </button>
        </div>
      </div>

      <div className="field-block">
        <label className="field-label" htmlFor="quiz-mode">
          Scoring mode
        </label>
        <p className="field-hint">Standard = fixed points for correct answers. Fastest Finger First = extra points for speed.</p>
        <div className="field-row">
          <select id="quiz-mode" value={mode} onChange={(e) => setMode(e.target.value as "standard" | "fff")}>
            <option value="standard">Standard</option>
            <option value="fff">Fastest Finger First</option>
          </select>
          <button type="button" onClick={() => socket.emit("host:set_mode", { roomCode, mode })} disabled={!roomCode}>
            Apply mode to room
          </button>
        </div>
      </div>

      <div className="field-block">
        <label className="field-label" htmlFor="room-code">
          Room code
        </label>
        <p className="field-hint">Filled automatically when you create a room. You can also type a code if you are rejoining as host.</p>
        <div className="field-row">
          <input
            id="room-code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="e.g. ABC123"
            autoCapitalize="characters"
          />
        </div>
      </div>

      <div className="field-block">
        <span className="field-label">Room join QR (for players)</span>
        <p className="field-hint">Players scan this to open the Player page with this room. Or copy the link below.</p>
        {joinQrDataUrl ? (
          <div className="qr-wrap">
            <img src={joinQrDataUrl} alt="QR code to join this quiz room" className="qr-image" />
            {joinUrl && (
              <p className="field-hint">
                Join link:{" "}
                <a href={joinUrl} className="text-link">
                  {joinUrl}
                </a>
              </p>
            )}
          </div>
        ) : (
          <p className="field-hint muted">Create a room or enter a room code to generate the join QR.</p>
        )}
      </div>

      <div className="field-block">
        <span className="field-label">Run the quiz</span>
        <div className="button-row">
          <button type="button" onClick={() => socket.emit("host:start_quiz", { roomCode })} disabled={!roomCode}>
            Start quiz
          </button>
          <button type="button" onClick={() => socket.emit("host:next_question", { roomCode })} disabled={!roomCode}>
            Next question
          </button>
        </div>
        <p className="field-hint">
          <strong>Next question</strong> ends the current question, updates scores from players&apos; submitted answers,
          then shows the next question (or finishes the quiz on the last one).
        </p>
      </div>

      <h3>Live scoreboard</h3>
      <ul className="score-list">
        {sorted.length === 0 && <li className="muted">No players yet — share the join link or QR.</li>}
        {sorted.map((p) => (
          <li key={p.name}>
            {p.name}: {p.score}
          </li>
        ))}
      </ul>
    </section>
  );
}
