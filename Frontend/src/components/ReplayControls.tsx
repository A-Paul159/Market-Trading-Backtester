import type { Candle } from "../types/Candle";

export type ReplayPosition = {
  quantity: number;
  averagePrice: number;
};

type ReplayControlsProps = {
  currentCandle: Candle | undefined;
  replayIndex: number;
  totalCandles: number;
  position: ReplayPosition;
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  onStepBack: () => void;
  onStepForward: () => void;
  onBuy: () => void;
  onSell: () => void;
  onClosePosition: () => void;
  onResetReplay: () => void;
};

function ReplayControls({
  currentCandle,
  replayIndex,
  totalCandles,
  position,
  realizedPnl,
  unrealizedPnl,
  totalPnl,
  onStepBack,
  onStepForward,
  onBuy,
  onSell,
  onClosePosition,
  onResetReplay,
}: ReplayControlsProps) {
  const positionLabel =
    position.quantity > 0
      ? `Long ${position.quantity}`
      : position.quantity < 0
        ? `Short ${Math.abs(position.quantity)}`
        : "Flat";

  return (
    <div className="replay-controls">
      <div className="replay-progress">
        <strong>Replay</strong>
        <span>
          Bar {Math.min(replayIndex + 1, totalCandles)} / {totalCandles}
        </span>
        <span>{currentCandle?.timestamp ?? "No candle"}</span>
      </div>

      <div className="replay-buttons">
        <button className="chart-toolbar-button" onClick={onStepBack}>
          ← Prev
        </button>

        <button className="chart-toolbar-button" onClick={onStepForward}>
          Next →
        </button>

        <button className="trade-button buy" onClick={onBuy}>
          Buy
        </button>

        <button className="trade-button sell" onClick={onSell}>
          Sell
        </button>

        <button className="chart-toolbar-button" onClick={onClosePosition}>
          Close
        </button>

        <button className="chart-toolbar-button" onClick={onResetReplay}>
          Reset
        </button>
      </div>

      <div className="replay-pnl-strip">
        <ReplayStat label="Position" value={positionLabel} />
        <ReplayStat
          label="Avg price"
          value={position.quantity === 0 ? "-" : position.averagePrice.toFixed(2)}
        />
        <ReplayStat label="Current" value={currentCandle ? currentCandle.close.toFixed(2) : "-"} />
        <ReplayStat label="Realized" value={`$${realizedPnl.toFixed(2)}`} />
        <ReplayStat label="Open P/L" value={`$${unrealizedPnl.toFixed(2)}`} />
        <ReplayStat label="Total P/L" value={`$${totalPnl.toFixed(2)}`} />
      </div>
    </div>
  );
}

type ReplayStatProps = {
  label: string;
  value: string;
};

function ReplayStat({ label, value }: ReplayStatProps) {
  return (
    <div className="replay-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default ReplayControls;