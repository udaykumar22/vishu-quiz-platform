import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { QuizOutletContext } from "../layout/AppLayout";

const api = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const HOST_TOKEN_KEY = "vishuHostToken";

export function HostPage() {
  const { socket, roomCode, setRoomCode, scoreboard } = useOutletContext<QuizOutletContext>();
  const [hostToken, setHostToken] = useState(() => sessionStorage.getItem(HOST_TOKEN_KEY) ?? "");
  const [hostLoginUser, setHostLoginUser] = useState("host");
  const [hostLoginPass, setHostLoginPass] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [hostName, setHostName] = useState("Host");
  const [mode, setMode] = useState<"standard" | "fff">("standard");

  const sorted = useMemo(() => [...scoreboard].sort((a, b) => b.score - a.score), [scoreboard]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const sharePlayerLink = roomCode ? `${origin}/player?room=${encodeURIComponent(roomCode)}` : "";

  async function hostLogin() {
    setLoginError(null);
    const res = await fetch(`${api}/api/host/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: hostLoginUser, password: hostLoginPass })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoginError(data.message ?? "Host login failed");
      return;
    }
    const token = data.token as string;
    sessionStorage.setItem(HOST_TOKEN_KEY, token);
    setHostToken(token);
  }

  function hostLogout() {
    sessionStorage.removeItem(HOST_TOKEN_KEY);
    setHostToken("");
    setHostLoginPass("");
  }

  if (!hostToken) {
    return (
      <section className="card">
        <h2>Host sign-in</h2>
        <p className="help-text">
          The host account is controlled by server environment variables <code className="inline-code">HOST_USER</code>{" "}
          and <code className="inline-code">HOST_PASSWORD</code> (set on Render for the API). Defaults for local dev are
          often <code className="inline-code">host</code> / <code className="inline-code">vishu-host</code> unless you
          changed them.
        </p>
        <div className="field-block">
          <label className="field-label" htmlFor="host-login-user">
            Host user ID
          </label>
          <div className="field-row">
            <input
              id="host-login-user"
              value={hostLoginUser}
              onChange={(e) => setHostLoginUser(e.target.value)}
              autoComplete="username"
            />
          </div>
        </div>
        <div className="field-block">
          <label className="field-label" htmlFor="host-login-pass">
            Host password
          </label>
          <div className="field-row">
            <input
              id="host-login-pass"
              type="password"
              value={hostLoginPass}
              onChange={(e) => setHostLoginPass(e.target.value)}
              autoComplete="current-password"
            />
          </div>
        </div>
        {loginError && <p className="error-text">{loginError}</p>}
        <div className="button-row">
          <button type="button" className="btn-primary" onClick={() => void hostLogin()}>
            Sign in as host
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="host-signed-in">
        <p className="field-hint muted">Signed in as host.</p>
        <button type="button" className="btn-ghost" onClick={hostLogout}>
          Sign out
        </button>
      </div>

      <h2>Host dashboard</h2>
      <p className="help-text">
        <strong>What to enter:</strong> Your display name, then <strong>Create room</strong>. Tell players the{" "}
        <strong>room code</strong> or share the <strong>player link</strong> below. Use <strong>Next question</strong> after
        each round to score answers and move on (it is a button, not a web link).
      </p>

      <div className="field-block">
        <label className="field-label" htmlFor="host-name">
          Host display name
        </label>
        <p className="field-hint">Shown to players (e.g. your name or &quot;Quiz Club&quot;).</p>
        <div className="field-row">
          <input id="host-name" value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder="e.g. Uday" />
          <button type="button" onClick={() => socket.emit("host:create_room", { hostName, hostToken })}>
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
          <button type="button" onClick={() => socket.emit("host:set_mode", { roomCode, mode, hostToken })} disabled={!roomCode}>
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

      {sharePlayerLink && (
        <div className="field-block">
          <span className="field-label">Share with players</span>
          <p className="field-hint">Copy this link so players open the Player screen with the room already filled in.</p>
          <p className="field-hint">
            <a href={sharePlayerLink} className="text-link">
              {sharePlayerLink}
            </a>
          </p>
        </div>
      )}

      <div className="field-block">
        <span className="field-label">Run the quiz</span>
        <div className="button-row">
          <button type="button" onClick={() => socket.emit("host:start_quiz", { roomCode, hostToken })} disabled={!roomCode}>
            Start quiz
          </button>
          <button type="button" onClick={() => socket.emit("host:next_question", { roomCode, hostToken })} disabled={!roomCode}>
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
        {sorted.length === 0 && <li className="muted">No players yet — share the room code or player link.</li>}
        {sorted.map((p) => (
          <li key={p.name}>
            {p.name}: {p.score}
          </li>
        ))}
      </ul>
    </section>
  );
}
