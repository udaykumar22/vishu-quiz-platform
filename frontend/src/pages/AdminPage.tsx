import { useEffect, useState } from "react";

type Question = {
  id: string;
  question: string;
  options: string[];
  answer: string;
  difficulty: string;
  published: boolean;
};

const api = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const defaultUserHint = import.meta.env.VITE_ADMIN_USER_HINT ?? "admin";

const ADMIN_TOKEN_KEY = "vishu_admin_token";

export function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem(ADMIN_TOKEN_KEY) ?? "");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const authHeaders = (json = true): HeadersInit => {
    const h: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (json) h["content-type"] = "application/json";
    return h;
  };

  useEffect(() => {
    if (!token) return;
    setLoadError(null);
    fetch(`${api}/api/admin/questions`, { headers: authHeaders(false) })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.message ?? `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then(setQuestions)
      .catch((e: Error) => {
        setLoadError(e.message);
        setQuestions([]);
      });
  }, [token]);

  async function login() {
    setLoginError(null);
    const res = await fetch(`${api}/api/admin/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoginError(data.message ?? "Login failed — check API URL (HTTPS) and credentials match Render ADMIN_USER / ADMIN_PASSWORD");
      return;
    }
    const t = data.token as string;
    sessionStorage.setItem(ADMIN_TOKEN_KEY, t);
    setToken(t);
  }

  function logout() {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken("");
    setPassword("");
  }

  async function togglePublish(question: Question) {
    await fetch(`${api}/api/admin/questions/${question.id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ published: !question.published })
    });
    setQuestions((prev) => prev.map((q) => (q.id === question.id ? { ...q, published: !q.published } : q)));
  }

  async function exportJson() {
    const res = await fetch(`${api}/api/admin/questions/export`, { headers: authHeaders(false) });
    if (!res.ok) return;
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data.questions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "questions.vishu.en.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!token) {
    return (
      <section className="card card--admin">
        <h2 className="card-title">Admin login</h2>
        <p className="help-text">
          Use the same <code className="inline-code">ADMIN_USER</code> and <code className="inline-code">ADMIN_PASSWORD</code> as on your
          Render backend. Username is often <strong>{defaultUserHint}</strong>. The site must call the API over <strong>HTTPS</strong> (
          <code className="inline-code">VITE_API_URL</code> on Netlify).
        </p>
        <div className="form-panel">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="admin-user">Admin username</label>
              <input id="admin-user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            </div>
            <div className="form-field">
              <label htmlFor="admin-pass">Admin password</label>
              <input
                id="admin-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Server ADMIN_PASSWORD"
              />
            </div>
          </div>
          {loginError && <p className="error-text">{loginError}</p>}
          <div className="form-actions">
            <button type="button" className="btn-primary" onClick={() => void login()}>
              Log in
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="card card--admin">
      <div className="toolbar">
        <h2 className="card-title">Admin panel</h2>
        <button type="button" className="btn-ghost btn-small" onClick={logout}>
          Log out
        </button>
      </div>
      {loadError && <p className="error-text">{loadError}</p>}
      <p className="field-hint">Total questions: {questions.length}</p>
      <div className="form-actions">
        <button type="button" onClick={() => void exportJson()}>
          Export JSON
        </button>
      </div>
      <ul className="admin-list">
        {questions.slice(0, 25).map((q) => (
          <li key={q.id} className="admin-row">
            <div>
              <strong>{q.question}</strong> <span className="muted">({q.difficulty})</span>{" "}
              <span className="muted">[{q.published ? "Published" : "Hidden"}]</span>
            </div>
            <button type="button" onClick={() => void togglePublish(q)}>
              Toggle publish
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
