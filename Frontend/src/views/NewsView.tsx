function NewsView() {
  return (
    <section className="view placeholder-view">
      <div className="workspace-header">
        <div>
          <h1>News</h1>
          <p>Market news, policy updates, earnings, and macro reports.</p>
        </div>
      </div>

      <section className="terminal-empty-state">
        <h2>News coming soon</h2>
        <p>
          This section will eventually show breaking news, earnings reports,
          FOMC updates, CPI/PPI reports, and market-moving headlines.
        </p>
      </section>
    </section>
  );
}

export default NewsView;