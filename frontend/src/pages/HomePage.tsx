import { Link } from "react-router-dom";

export function HomePage() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <section className="card home-card">
      <h1 className="home-title">Vishu Quiz</h1>
      <p className="home-lead">
        Join a quiz as a player using the room code from your host. Host and admin screens are not linked here — open them only
        from the URL you were given, or type <code className="inline-code">/host</code> or <code className="inline-code">/admin</code>{" "}
        in the address bar if you are authorised.
      </p>
      <nav className="home-links" aria-label="Player entry">
        <Link className="home-link home-link--player" to="/player">
          Enter as player
        </Link>
        <p className="home-hint">
          With a room code, use: <code className="inline-code">{origin}/player?room=YOURCODE</code>
        </p>
      </nav>
    </section>
  );
}
