import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
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

  const identityQrPromise = useMemo(() => QRCode.toDataURL(playerId || "pending"), [playerId]);

  async function downloadIdentity() {
    const data = await identityQrPromise;
    const a = document.createElement("a");
    a.href = data;
    a.download = "vishu-player-identity-qr.png";
    a.click();
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const playerLinkWithRoom = roomCode ? `${origin}/player?room=${encodeURIComponent(roomCode)}` : `${origin}/player`;

  return (
    <section className="card">
      <h2>Player</h2>
      <p className="help-text">
        <strong>How QR codes work here:</strong> the <strong>host</strong> shows a <strong>room join QR</strong> (same as
        opening this page with <code className="inline-code">?room=CODE</code>). The <strong>Download identity QR</strong>{" "}
        button saves a code that represents <strong>you</strong> on this device so you can rejoin the same browser profile;
        show it to the host if they need to verify you offline (optional for v1).
      </p>

      <div className="field-block">
        <label className="field-label" htmlFor="room-code-player">
          Room code
        </label>
        <p className="field-hint">Usually set from the URL when you scan the host&apos;s QR (example below). You can type it if needed.</p>
        <div className="field-row">
          <input
            id="room-code-player"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="e.g. ABC123"
            autoCapitalize="characters"
          />
        </div>
        <p className="field-hint muted">Example player URL: {playerLinkWithRoom}</p>
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

      <div className="field-block identity-block">
        <span className="field-label">Identity QR (optional)</span>
        <p className="field-hint">PNG download — encodes your player id for this browser. Not required to play if you stay on this device.</p>
        <div className="button-row">
          <button type="button" className="btn-secondary" onClick={() => void downloadIdentity()}>
            Download identity QR
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
