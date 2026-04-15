import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { QuizOutletContext } from "../layout/AppLayout";
import { SocketEvents } from "../realtime/events";

const api = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const HOST_TOKEN_KEY = "vishu_host_token";

export function HostPage() {
  const { socket, roomCode, setRoomCode, scoreboard } = useOutletContext<QuizOutletContext>();
  const [hostUser, setHostUser] = useState("");
  const [hostPass, setHostPass] = useState("");
  const [hostToken, setHostToken] = useState(() => sessionStorage.getItem(HOST_TOKEN_KEY) ?? "");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [hostAuthOk, setHostAuthOk] = useState(false);
  const [hostName, setHostName] = useState("Host");
  const [mode, setMode] = useState<"standard" | "fff">("standard");
  const [hostSocketError, setHostSocketError] = useState<string | null>(null);

  const sorted = useMemo(() => [...scoreboard].sort((a, b) => b.score - a.score), [scoreboard]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const playerShareUrl = roomCode ? `${origin}/player?room=${encodeURIComponent(roomCode)}` : "";

  useEffect(() => {
    const onHostErr = (p: { message?: string }) => setHostSocketError(p.message ?? "Host action refused");
    socket.on(SocketEvents.hostError, onHostErr);
    return () => {
      socket.off(SocketEvents.hostError, onHostErr);
    };
  }, [socket]);

  useEffect(() => {
    if (!hostToken) {
      setHostAuthOk(false);
      return;
    }
    const authenticate = () => {
      socket.emit(
        SocketEvents.hostAuthenticate,
        { token: hostToken },
        (res: { ok?: boolean; message?: string } | undefined) => {
          if (res?.ok) {
            setHostAuthOk(true);
            setHostSocketError(null);
          } else {
            setHostAuthOk(false);
            setHostSocketError(res?.message ?? "Could not verify host session");
          }
        }
      );
    };
    authenticate();
    socket.on("connect", authenticate);
    return () => {
      socket.off("connect", authenticate);
    };
  }, [hostToken, socket]);

  async function loginHost() {
    setLoginError(null);
    const res = await fetch(`${api}/api/host/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: hostUser, password: hostPass })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoginError(data.message ?? "Host login failed");
      setHostToken("");
      sessionStorage.removeItem(HOST_TOKEN_KEY);
      return;
    }
    const token = data.token as string;
    sessionStorage.setItem(HOST_TOKEN_KEY, token);
    setHostToken(token);
  }

  function logoutHost() {
    sessionStorage.removeItem(HOST_TOKEN_KEY);
    setHostToken("");
    setHostAuthOk(false);
    setHostPass("");
  }

  return (
    <section className="card card--host">
      <h2 className="card-title">Host dashboard</h2>

      {!hostToken || !hostAuthOk ? (
        <div className="form-panel">
          <p className="help-text">
            Sign in with the <strong>Host ID</strong> and <strong>password</strong> configured on the server (
            <code className="inline-code">HOST_USER</code> and <code className="inline-code">HOST_PASSWORD</code> in Render).
            After login, your session is saved in this browser until you log out.
          </p>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="host-id">Host ID</label>
              <input id="host-id" value={hostUser} onChange={(e) => setHostUser(e.target.value)} autoComplete="username" placeholder="Host username" />
            </div>
            <div className="form-field">
              <label htmlFor="host-pass">Host password</label>
              <input
                id="host-pass"
                type="password"
                value={hostPass}
                onChange={(e) => setHostPass(e.target.value)}
                autoComplete="current-password"
                placeholder="Password"
              />
            </div>
          </div>
          {loginError && <p className="error-text">{loginError}</p>}
          {hostSocketError && <p className="error-text">{hostSocketError}</p>}
          <div className="form-actions">
            <button type="button" className="btn-primary" onClick={() => void loginHost()}>
              Sign in as host
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <span className="badge badge--ok">Host signed in</span>
            <button type="button" className="btn-ghost btn-small" onClick={logoutHost}>
              Sign out
            </button>
          </div>
          {hostSocketError && <p className="error-text">{hostSocketError}</p>}

          <div className="form-panel">
            <h3 className="section-heading">Room</h3>
            <div className="form-grid">
              <div className="form-field form-field--grow">
                <label htmlFor="host-name">Display name (shown to players)</label>
                <input id="host-name" value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder="e.g. Quiz Club" />
              </div>
              <div className="form-actions form-actions--inline">
                <button type="button" className="btn-primary" onClick={() => socket.emit(SocketEvents.hostCreateRoom, { hostName })}>
                  Create room
                </button>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="quiz-mode">Scoring mode</label>
                <select id="quiz-mode" value={mode} onChange={(e) => setMode(e.target.value as "standard" | "fff")}>
                  <option value="standard">Standard</option>
                  <option value="fff">Fastest Finger First</option>
                </select>
              </div>
              <div className="form-actions form-actions--inline">
                <button type="button" onClick={() => socket.emit(SocketEvents.hostSetMode, { roomCode, mode })} disabled={!roomCode}>
                  Apply mode
                </button>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="room-code">Room code</label>
              <input
                id="room-code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Filled when you create a room"
                autoCapitalize="characters"
              />
            </div>

            {playerShareUrl && (
              <div className="share-box">
                <span className="field-label">Share with players</span>
                <p className="field-hint">Copy this link — players open it, enter nickname, and join.</p>
                <code className="share-url">{playerShareUrl}</code>
              </div>
            )}
          </div>

          <div className="form-panel">
            <h3 className="section-heading">Run quiz</h3>
            <p className="field-hint">
              <strong>Next question</strong> scores this round and advances (it is not a hyperlink).
            </p>
            <div className="form-actions">
              <button type="button" className="btn-primary" onClick={() => socket.emit(SocketEvents.hostStartQuiz, { roomCode })} disabled={!roomCode}>
                Start quiz
              </button>
              <button type="button" onClick={() => socket.emit(SocketEvents.hostNextQuestion, { roomCode })} disabled={!roomCode}>
                Next question
              </button>
            </div>
          </div>

          <div className="form-panel">
            <h3 className="section-heading">Live scoreboard</h3>
            <ul className="score-list">
              {sorted.length === 0 && <li className="muted">No players yet — share the link above.</li>}
              {sorted.map((p) => (
                <li key={p.name}>
                  <span className="score-name">{p.name}</span>
                  <span className="score-val">{p.score}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
