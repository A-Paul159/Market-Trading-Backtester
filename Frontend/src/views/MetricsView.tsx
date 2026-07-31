import { useState } from "react";
import TradeLog, { type TradeLogEntry } from "../components/TradeLog";

type MetricsViewProps = {
  trades: TradeLogEntry[];
};

function MetricsView({ trades }: MetricsViewProps) {
  const [isTradeLogOpen, setIsTradeLogOpen] = useState(false);

  return (
    <section className="view metrics-view">
      <header className="workspace-header">
        <div>
          <h1>Metrics</h1>
          <p>Review simulated trading performance and execution history.</p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() => setIsTradeLogOpen(true)}
        >
          View Trade Log
        </button>
      </header>

      <section className="metrics-placeholder">
        <h2>Performance metrics coming next</h2>
        <p>
          Trade log is now connected. Next, we can calculate win rate, average
          win/loss, profit factor, and drawdown from your executions.
        </p>
      </section>

      {isTradeLogOpen && (
        <div className="modal-backdrop">
          <div className="trade-log-modal">
            <div className="modal-header">
              <div>
                <h2>Trade Log</h2>
                <p>{trades.length} simulated executions</p>
              </div>

              <button
                className="modal-close-button"
                type="button"
                onClick={() => setIsTradeLogOpen(false)}
              >
                ×
              </button>
            </div>

            <TradeLog trades={trades} />
          </div>
        </div>
      )}
    </section>
  );
}

export default MetricsView;