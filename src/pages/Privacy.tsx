const Privacy = () => (
  <main className="page">
    <section className="page-hero">
      <p className="eyebrow">Privacy & Legal</p>
      <h1>Respecting your time and data.</h1>
      <p className="lead">
        NullCAL follows a privacy-first stance with minimal data retention and
        transparent access controls.
      </p>
    </section>

    <section className="grid">
      <article className="panel">
        <h3>Data minimization</h3>
        <p>
          We only collect the essential schedule metadata required to keep your
          calendar in sync.
        </p>
      </article>
      <article className="panel">
        <h3>Secure by default</h3>
        <p>
          Encryption in transit and at rest keeps your events and attendees
          protected at every step.
        </p>
      </article>
      <article className="panel">
        <h3>Transparent policies</h3>
        <p>
          Clear documentation and opt-in controls help teams stay compliant and
          confident.
        </p>
      </article>
    </section>
  </main>
);

export default Privacy;
