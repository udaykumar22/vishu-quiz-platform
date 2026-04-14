import { useMemo, useState } from "react";
import { Socket } from "socket.io-client";
import QRCode from "qrcode";

type Props = {
  socket: Socket;
  roomCode: string;
  question: { id: string; question: string; options: string[] } | null;
  playerId: string;
};

export function PlayerPage({ socket, roomCode, question, playerId }: Props) {
  const [name, setName] = useState("Player");
  const [selected, setSelected] = useState("");

  const identityQrPromise = useMemo(() => QRCode.toDataURL(playerId || "pending"), [playerId]);

  async function downloadIdentity() {
    const data = await identityQrPromise;
    const a = document.createElement("a");
    a.href = data;
    a.download = "player-identity-qr.png";
    a.click();
  }

  return (
    <section className="card">
      <h2>Player</h2>
      <div className="row">
        <input value={roomCode} readOnly />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nickname" />
        <button onClick={() => socket.emit("player:join", { roomCode, name, playerToken: playerId })}>Join</button>
      </div>
      <button onClick={downloadIdentity}>Download Identity QR</button>
      {question && (
        <div className="question">
          <h3>{question.question}</h3>
          <div className="options">
            {question.options.map((opt) => (
              <button key={opt} className={selected === opt ? "selected" : ""} onClick={() => setSelected(opt)}>
                {opt}
              </button>
            ))}
          </div>
          <button onClick={() => socket.emit("player:answer", { roomCode, playerId, option: selected, ms: 1500 })}>
            Submit Answer
          </button>
        </div>
      )}
    </section>
  );
}
