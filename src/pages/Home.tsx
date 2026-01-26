const Home = () => (
  <main className="page">
    <section className="hero">
      <div>
        <p className="eyebrow">NullID // NullCAL</p>
        <h1>Calibrate time with a neon-focused, dark mode calendar.</h1>
        <p className="lead">
          NullCAL is a modern scheduling surface designed to keep high-impact
          teams in flow. Trim the noise, surface the essentials, and stay in sync
          across every time zone.
        </p>
        <div className="hero-actions">
          <button className="cta">Request Access</button>
          <button className="ghost">View Roadmap</button>
        </div>
      </div>
      <div className="hero-card">
        <div className="card-glow" />
        <div className="card-content">
          <p className="card-title">Today</p>
          <h2>Thursday</h2>
          <p className="card-meta">Focus blocks aligned with your peak hours.</p>
          <div className="timeline">
            <div>
              <span>09:30</span>
              <strong>Strategy sync</strong>
            </div>
            <div>
              <span>12:00</span>
              <strong>Deep work</strong>
            </div>
            <div>
              <span>16:00</span>
              <strong>Client briefing</strong>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="grid">
      <article className="panel">
        <h3>Signal-first scheduling</h3>
        <p>
          Clear, luminous highlights guide your attention to priority blocks and
          keep collaboration effortless.
        </p>
      </article>
      <article className="panel">
        <h3>Presence-aware routing</h3>
        <p>
          Surface the right meeting slots using contextual availability across
          teams, clients, and time zones.
        </p>
      </article>
      <article className="panel">
        <h3>Minimalist controls</h3>
        <p>
          A refined interface removes clutter so every session feels intentional
          and high signal.
        </p>
      </article>
    </section>
  </main>
);

export default Home;
