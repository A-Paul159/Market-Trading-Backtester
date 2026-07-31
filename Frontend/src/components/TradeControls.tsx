type Position = {
  quantity: number;
  averagePrice: number | null;
};

type TradeControlsProps = {
  symbol: string;
  currentPrice: number | null;
  position: Position;
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  orderQuantity: number;
  onChangeOrderQuantity: (quantity: number) => void;
  onBuy: () => void;
  onSell: () => void;
  onFlatten: () => void;
};

const ORDER_QUANTITIES = [1, 2, 3, 4, 5, 10, 15, 30];

function TradeControls({
  symbol,
  currentPrice,
  position,
  realizedPnl,
  unrealizedPnl,
  totalPnl,
  orderQuantity,
  onChangeOrderQuantity,
  onBuy,
  onSell,
  onFlatten,
}: TradeControlsProps) {
  return (
    <section className="trade-controls">
      <div className="trade-controls-header">
        <div className="trade-current-price">
          <span> {symbol} Current Price</span>
          <strong>{currentPrice ?? "Unavailable"}</strong>
        </div>
      </div>
      <div className="order-quantity-section">
        <span>Order Quantity</span>

        <div className="order-quantity-grid">
            {ORDER_QUANTITIES.map((quantity) => (
            <button
                key={quantity}
                type="button"
                className={`order-quantity-button ${
                orderQuantity === quantity ? "active" : ""
                }`}
                onClick={() => onChangeOrderQuantity(quantity)}
            >
                {quantity}
            </button>
            ))}
        </div>
      </div>

      <div className="trade-button-row">
        <button className="trade-button buy" onClick={onBuy} disabled={currentPrice === null}>
          Buy
        </button>

        <button className="trade-button sell" onClick={onSell} disabled={currentPrice === null}>
          Sell
        </button>

        <button
          className="trade-button flatten"
          onClick={onFlatten}
          disabled={currentPrice === null || position.quantity === 0}
        >
          Flatten
        </button>
      </div>

      <div className="trade-stats-grid">
        <TradeStat label="Position" value={position.quantity} />
        <TradeStat label="Avg Price" value={position.averagePrice ?? "Flat"} />
        <TradeStat label="Unrealized P/L" value={formatMoney(unrealizedPnl)} />
        <TradeStat label="Realized P/L" value={formatMoney(realizedPnl)} />
        <TradeStat label="Total P/L" value={formatMoney(totalPnl)} />
      </div>
    </section>
  );
}

type TradeStatProps = {
  label: string;
  value: string | number;
};

function TradeStat({ label, value }: TradeStatProps) {
  return (
    <div className="trade-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

export default TradeControls;
export type { Position };