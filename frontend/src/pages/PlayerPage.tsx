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
    <section className="card card--player">
      <h2 className="card-title">Player</h2>
      <p className="help-text">
        Ask the host for the <strong>room code</strong>, or open the link they send you. Enter your <strong>nickname</strong>, then{" "}
        <strong>Join room</strong>. When a question appears, choose an answer and tap <strong>Submit answer</strong>.
      </p>

      <div className="form-panel">
        <div className="form-field">
          <label htmlFor="room-code-player">Room code</label>
          <input
            id="room-code-player"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="e.g. ABC123"
            autoCapitalize="characters"
          />
        </div>
        <p className="field-hint muted">Example URL with code: {playerLinkWithRoom}</p>

        <div className="form-grid">
          <div className="form-field form-field--grow">
            <label htmlFor="nickname">Nickname</label>
            <input id="nickname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name on the scoreboard" />
          </div>
          <div className="form-actions form-actions--inline">
            <button type="button" className="btn-primary" onClick={() => socket.emit("player:join", { roomCode, name, playerToken: playerId })} disabled={!roomCode.trim()}>
              Join room
            </button>
          </div>
        </div>
      </div>

      {question && (
        <div className="question-block">
          <h3 className="question-title">{question.question}</h3>
          <p className="field-hint">Select one option, then submit.</p>
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
              className="btn-primary btn-wide"
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
