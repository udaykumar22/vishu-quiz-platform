import { useMemo, useState } from "react";
import { Socket } from "socket.io-client";

type Props = {
  socket: Socket;
  roomCode: string;
  setRoomCode: (v: string) => void;
  scoreboard: Array<{ name: string; score: number }>;
};

export function HostPage({ socket, roomCode, setRoomCode, scoreboard }: Props) {
  const [hostName, setHostName] = useState("Host");
  const [mode, setMode] = useState<"standard" | "fff">("standard");

  const sorted = useMemo(() => [...scoreboard].sort((a, b) => b.score - a.score), [scoreboard]);

  return (
    <section className="card">
      <h2>Host Dashboard</h2>
      <div className="row">
        <input value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder="Host Name" />
        <button onClick={() => socket.emit("host:create_room", { hostName })}>Create Room</button>
      </div>
      <div className="row">
        <select value={mode} onChange={(e) => setMode(e.target.value as "standard" | "fff")}>
          <option value="standard">Standard</option>
          <option value="fff">Fastest Finger First</option>
        </select>
        <button onClick={() => socket.emit("host:set_mode", { roomCode, mode })}>Set Mode</button>
      </div>
      <div className="row">
        <input value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} placeholder="Room Code" />
        <button onClick={() => socket.emit("host:start_quiz", { roomCode })}>Start Quiz</button>
        <button onClick={() => socket.emit("host:next_question", { roomCode })}>Next Question</button>
      </div>
      <h3>Live Scoreboard</h3>
      <ul>
        {sorted.map((p) => (
          <li key={p.name}>{p.name}: {p.score}</li>
        ))}
      </ul>
    </section>
  );
}
