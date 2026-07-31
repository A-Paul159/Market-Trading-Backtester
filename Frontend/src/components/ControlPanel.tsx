type ControlsPanelProps = {
  symbol: string;
  interval: string;
  startDate: string;
  endDate: string;
  isLoading: boolean;
  onSymbolChange: (value: string) => void;
  onIntervalChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onLoadCandles: () => void;
};

function ControlsPanel({
  symbol,
  interval,
  startDate,
  endDate,
  isLoading,
  onSymbolChange,
  onIntervalChange,
  onStartDateChange,
  onEndDateChange,
  onLoadCandles,
}: ControlsPanelProps) {
  return (
    <section className="panel controls-panel">
      <div className="controls-grid">
        <div className="field">
          <label>Symbol</label>
          <input
            value={symbol}
            onChange={(event) => onSymbolChange(event.target.value)}
            placeholder="MES=F"
          />
        </div>

        <div className="field">
          <label>Interval</label>
          <select
            value={interval}
            onChange={(event) => onIntervalChange(event.target.value)}
          >
            <option value="1m">1 minute</option>
            <option value="2m">2 minutes</option>
            <option value="5m">5 minutes</option>
            <option value="15m">15 minutes</option>
            <option value="30m">30 minutes</option>
            <option value="60m">1 hour</option>
            <option value="1d">1 day</option>
          </select>
        </div>

        <div className="field">
          <label>Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
          />
        </div>

        <div className="field">
          <label>End date</label>
          <input
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
          />
        </div>

        <button
          className="primary-button"
          onClick={onLoadCandles}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Load Data"}
        </button>
      </div>
    </section>
  );
}

export default ControlsPanel;