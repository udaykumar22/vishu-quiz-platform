import { Link } from "react-router-dom";

export function HomePage() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <section className="card home-card">
      <h1 className="home-title">Vishu Quiz</h1>
      <p className="home-lead">
        Multiplayer Vishu festival quiz. Pick a role below — each role has its own link you can bookmark or share.
      </p>
      <nav className="home-links" aria-label="Main routes">
        <Link className="home-link home-link--host" to="/host">
          Open Host dashboard
        </Link>
        <Link className="home-link home-link--player" to="/player">
          Open Player screen
        </Link>
        <p className="home-hint">
          Players should open the Player link with the room code in the URL, for example:{" "}
          <code className="inline-code">{origin}/player?room=YOURCODE</code>
        </p>
        <Link className="home-link home-link--admin" to="/admin">
          Open Admin (content) panel
        </Link>
      </nav>
    </section>
  );
}
