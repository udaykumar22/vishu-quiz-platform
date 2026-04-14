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

export function AdminPage() {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("vishu-admin");
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${api}/api/admin/questions`).then((r) => r.json()).then(setQuestions);
  }, [token]);

  async function login() {
    const res = await fetch(`${api}/api/admin/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    setToken(data.token);
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
        <h2>Admin Login</h2>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={login}>Login</button>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Admin Panel</h2>
      <p>Total Questions: {questions.length}</p>
      <button onClick={exportJson}>Export JSON</button>
      <ul className="admin-list">
        {questions.slice(0, 25).map((q) => (
          <li key={q.id}>
            <strong>{q.question}</strong> ({q.difficulty}) [{q.published ? "Published" : "Hidden"}]
            <button onClick={() => togglePublish(q)}>Toggle Publish</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
