export type TradeLogEntry = {
  id: string;
  timestamp: string;
  candleTimestamp: string;
  symbol: string;
  side: "BUY" | "SELL" | "FLATTEN";
  quantity: number;
  fillPrice: number;
  positionAfter: number;
  fees: number;
  grossRealizedPnl: number;
  realizedPnl: number;
};

type TradeLogProps = {
  trades: TradeLogEntry[];
};

function TradeLog({ trades }: TradeLogProps) {
  return (
    <section className="trade-log">
      <div className="trade-log-header">
        <strong>Trade Log</strong>
        <span>{trades.length} executions</span>
      </div>

      {trades.length === 0 ? (
        <div className="trade-log-empty">No trades placed yet.</div>
      ) : (
        <div className="trade-log-table-wrapper">
          <table className="trade-log-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Side</th>
                <th>Qty</th>
                <th>Fill</th>
                <th>Pos</th>
                <th>Fees</th>
                <th>Net P/L</th>
              </tr>
            </thead>

            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id}>
                  <td>{formatTime(trade.timestamp)}</td>
                  <td className={trade.side === "BUY" ? "buy-text" : "sell-text"}>
                    {trade.side}
                  </td>
                  <td>{trade.quantity}</td>
                  <td>{trade.fillPrice.toFixed(2)}</td>
                  <td>{trade.positionAfter}</td>
                  <td className="negative-text">{formatMoney(-Math.abs(trade.fees))}</td>
                  <td className={trade.realizedPnl >= 0 ? "positive-text" : "negative-text"}>
                    {formatMoney(trade.realizedPnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

export default TradeLog;