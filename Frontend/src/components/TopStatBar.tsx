type TopStatsBarProps = {
  startingBalance: number;
  openPnl: number;
  closedPnl: number;
  totalPnl: number;
};

function TopStatsBar({
  startingBalance,
  openPnl,
  closedPnl,
  totalPnl,
}: TopStatsBarProps) {
  const balance = startingBalance + closedPnl;
  const equity = startingBalance + totalPnl;

  const dailyChangePercent =
    startingBalance === 0 ? 0 : (totalPnl / startingBalance) * 100;

  return (
    <header className="top-stats-bar">
      <div className="account-section">
        <div className="account-badge">ST</div>
        <div>
          <div className="account-name">Strat Testing Account</div>
          <div className="account-subtitle">Simulation Mode</div>
        </div>
      </div>

      <div className="top-stat">
        <span>Balance</span>
        <strong>{formatMoney(balance)}</strong>
      </div>

      <div className={`top-stat ${openPnl >= 0 ? "positive" : "negative"}`}>
        <span>Open P/L</span>
        <strong>{formatMoney(openPnl)}</strong>
      </div>

      <div className={`top-stat ${closedPnl >= 0 ? "positive" : "negative"}`}>
        <span>Closed P/L</span>
        <strong>{formatMoney(closedPnl)}</strong>
      </div>

      <div className={`top-stat ${totalPnl >= 0 ? "positive" : "negative"}`}>
        <span>Equity</span>
        <strong>{formatMoney(equity)}</strong>
      </div>

      <div className={`top-stat ${dailyChangePercent >= 0 ? "positive" : "negative"}`}>
        <span>Daily Change</span>
        <strong>{dailyChangePercent.toFixed(2)}%</strong>
      </div>

      <div className="market-status">
        <span className="status-dot" />
        Market Data
      </div>
    </header>
  );
}

function formatMoney(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default TopStatsBar;