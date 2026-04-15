import { useEffect, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import type { QuizOutletContext } from "../layout/AppLayout";

export function PlayerPage() {
  const { socket, roomCode, setRoomCode, question, playerId } = useOutletContext<QuizOutletContext>();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("Player");
  const [selected, setSelected] = useState("");

  useEffect(() => {
    const fromUrl = searchParams.get("room");
    if (fromUrl) setRoomCode(fromUrl.toUpperCase());
  }, [searchParams, setRoomCode]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const playerLinkWithRoom = roomCode ? `${origin}/player?room=${encodeURIComponent(roomCode)}` : `${origin}/player`;

  return (
    <section className="card">
      <h2>Player</h2>
      <p className="help-text">
        Enter the <strong>room code</strong> the host gives you (or open a link they share that already includes{" "}
        <code className="inline-code">?room=</code>
        ). Choose a <strong>nickname</strong>, tap <strong>Join room</strong>, then answer each question.
      </p>

      <div className="field-block">
        <label className="field-label" htmlFor="room-code-player">
          Room code
        </label>
        <p className="field-hint">From the host (letters/numbers). Can also come from the page URL.</p>
        <div className="field-row">
          <input
            id="room-code-player"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="e.g. ABC123"
            autoCapitalize="characters"
          />
        </div>
        <p className="field-hint muted">Example link you can share: {playerLinkWithRoom}</p>
      </div>

      <div className="field-block">
        <label className="field-label" htmlFor="nickname">
          Nickname
        </label>
        <p className="field-hint">Your name on the scoreboard (e.g. first name or team name).</p>
        <div className="field-row">
          <input id="nickname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anjali" />
          <button type="button" onClick={() => socket.emit("player:join", { roomCode, name, playerToken: playerId })} disabled={!roomCode.trim()}>
            Join room
          </button>
        </div>
      </div>

      {question && (
        <div className="question-block">
          <h3 className="question-title">{question.question}</h3>
          <p className="field-hint">Tap one option, then submit.</p>
          <div className="options options--spaced">
            {question.options.map((opt) => (
              <button
                type="button"
                key={opt}
                className={`option-btn ${selected === opt ? "selected" : ""}`}
                onClick={() => setSelected(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="submit-row">
            <button
              type="button"
              className="btn-primary"
              disabled={!selected}
              onClick={() => socket.emit("player:answer", { roomCode, playerId, option: selected, ms: 1500 })}
            >
              Submit answer
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
