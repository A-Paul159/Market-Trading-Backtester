import type { Candle } from "../types/Candle";

type StatsPanelProps = {
  candles: Candle[];
};

function StatsPanel({ candles }: StatsPanelProps) {
  if (candles.length === 0) {
    return null;
  }

  const firstCandle = candles[0];
  const lastCandle = candles[candles.length - 1];

  const high = Math.max(...candles.map((candle) => candle.high));
  const low = Math.min(...candles.map((candle) => candle.low));
  const totalVolume = candles.reduce((sum, candle) => sum + candle.volume, 0);

  const netChange = lastCandle.close - firstCandle.open;
  const percentChange = (netChange / firstCandle.open) * 100;

  return (
    <div className="stats-grid">
      <StatCard label="Candles" value={candles.length.toString()} />
      <StatCard label="First open" value={firstCandle.open.toFixed(2)} />
      <StatCard label="Last close" value={lastCandle.close.toFixed(2)} />
      <StatCard label="High" value={high.toFixed(2)} />
      <StatCard label="Low" value={low.toFixed(2)} />
      <StatCard label="Net change" value={netChange.toFixed(2)} />
      <StatCard label="Percent change" value={`${percentChange.toFixed(2)}%`} />
      <StatCard label="Total volume" value={totalVolume.toLocaleString()} />
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string;
};

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export default StatsPanel;