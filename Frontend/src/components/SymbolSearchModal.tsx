import { useState } from "react";

type MarketSelection = {
  symbol: string;
  interval: string;
};

type SymbolSearchModalProps = {
  symbol: string;
  interval: string;
  onClose: () => void;
  onApply: (selection: MarketSelection) => void;
};

const QUICK_SYMBOLS = ["MES=F", "MNQ=F", "ES=F", "NQ=F", "GC=F", "MGC=F", "CL=F"];

function SymbolSearchModal({
  symbol,
  interval,
  onClose,
  onApply,
}: SymbolSearchModalProps) {
  const [draftSymbol, setDraftSymbol] = useState(symbol);
  const [draftInterval, setDraftInterval] = useState(interval);

  const handleApply = () => {
    onApply({
      symbol: draftSymbol.trim(),
      interval: draftInterval,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="symbol-modal">
        <div className="modal-header">
          <div>
            <h2>Change market</h2>
            <p>Select a symbol and interval. The chart will automatically load the latest 5 days.</p>
          </div>

          <button className="modal-close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-field">
          <label>Symbol</label>
          <input
            value={draftSymbol}
            onChange={(event) => setDraftSymbol(event.target.value)}
            placeholder="MES=F"
            autoFocus
          />
        </div>

        <div className="quick-symbol-grid">
          {QUICK_SYMBOLS.map((quickSymbol) => (
            <button
              key={quickSymbol}
              className={draftSymbol === quickSymbol ? "quick-symbol active" : "quick-symbol"}
              onClick={() => setDraftSymbol(quickSymbol)}
            >
              {quickSymbol}
            </button>
          ))}
        </div>

        <div className="modal-field">
          <label>Interval</label>
          <select
            value={draftInterval}
            onChange={(event) => setDraftInterval(event.target.value)}
          >
            <option value="1m">1 minute</option>
            <option value="2m">2 minutes</option>
            <option value="3m">3 minutes</option>
            <option value="5m">5 minutes</option>
            <option value="10m">10 minutes</option>
            <option value="15m">15 minutes</option>
            <option value="30m">30 minutes</option>
            <option value="60m">1 hour</option>
            <option value="4h">4 hours</option>
            <option value="1d">1 day</option>
            <option value="1wk">1 week</option>
            <option value="1mo">1 month</option>
          </select>
        </div>

        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>

          <button className="primary-button" onClick={handleApply}>
            Load Market
          </button>
        </div>
      </div>
    </div>
  );
}

export default SymbolSearchModal;
export type { MarketSelection };