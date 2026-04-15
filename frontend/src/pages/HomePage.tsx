import { Link } from "react-router-dom";

export function HomePage() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <section className="card home-card">
      <h1 className="home-title">Vishu Quiz</h1>
      <p className="home-lead">
        Join as a player from this page. The host and admin consoles are separate URLs (not linked here); bookmark them
        or type the path in the browser bar when you need them.
      </p>
      <nav className="home-links" aria-label="Player entry">
        <Link className="home-link home-link--player" to="/player">
          Open Player screen
        </Link>
        <p className="home-hint">
          Share this player link with your room code in the query string, for example:{" "}
          <code className="inline-code">{origin}/player?room=YOURCODE</code>
        </p>
        <p className="home-hint muted">
          Host path (no link): <code className="inline-code">/host</code> — requires host login configured on the server.
          Admin path (no link): <code className="inline-code">/admin</code>.
        </p>
      </nav>
    </section>
  );
}
