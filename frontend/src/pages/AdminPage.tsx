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

export function AdminPage() {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${api}/api/admin/questions`)
      .then((r) => r.json())
      .then(setQuestions)
      .catch(() => setQuestions([]));
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
      setLoginError(data.message ?? "Login failed");
      return;
    }
    setToken(data.token ?? "");
  }

  async function togglePublish(question: Question) {
    await fetch(`${api}/api/admin/questions/${question.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ published: !question.published })
    });
    setQuestions((prev) => prev.map((q) => (q.id === question.id ? { ...q, published: !q.published } : q)));
  }

  async function exportJson() {
    const res = await fetch(`${api}/api/admin/questions/export`);
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
      <section className="card">
        <h2>Admin login</h2>
        <p className="help-text">
          This panel is only at <code className="inline-code">/admin</code> (bookmark it separately from Host/Player). Sign in
          with the backend&apos;s <code className="inline-code">ADMIN_USER</code> and <code className="inline-code">ADMIN_PASSWORD</code>{" "}
          environment variables (Render → your web service → Environment). Username is often <strong>{defaultUserHint}</strong> unless
          you changed it; the password is exactly what you set as <code className="inline-code">ADMIN_PASSWORD</code> (not shown here).
        </p>

        <div className="field-block">
          <label className="field-label" htmlFor="admin-user">
            Admin username
          </label>
          <div className="field-row">
            <input id="admin-user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </div>
        </div>
        <div className="field-block">
          <label className="field-label" htmlFor="admin-pass">
            Admin password
          </label>
          <div className="field-row">
            <input
              id="admin-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter server admin password"
            />
          </div>
        </div>
        {loginError && <p className="error-text">{loginError}</p>}
        <div className="button-row">
          <button type="button" className="btn-primary" onClick={() => void login()}>
            Log in
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Admin panel</h2>
      <p className="field-hint">Total questions: {questions.length}</p>
      <div className="button-row">
        <button type="button" onClick={exportJson}>
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
