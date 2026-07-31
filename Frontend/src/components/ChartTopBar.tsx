import { useState } from "react";
import ContractInfoPopover from "./ContractInfoPopover";
import { fetchContractInfo } from "../services/ContractAPI";
import type { ContractInfo } from "../types/ContractInfo";

type TimeframeOption = {
  label: string;
  value: string;
};

const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { label: "1 min", value: "1m" },
  { label: "2 min", value: "2m" },
  { label: "3 min", value: "3m" },
  { label: "5 min", value: "5m" },
  { label: "10 min", value: "10m" },
  { label: "15 min", value: "15m" },
  { label: "30 min", value: "30m" },
  { label: "1 hour", value: "60m" },
  { label: "4 hour", value: "4h" },
  { label: "1 day", value: "1d" },
  { label: "1 week", value: "1wk" },
  { label: "1 month", value: "1mo" },
];

type ChartTopBarProps = {
  symbol: string;
  interval: string;
  status: string;
  isLoading: boolean;
  isReplayMode: boolean;
  onToggleReplayMode: () => void;
  onOpenSymbolModal: () => void;
  onRefresh: () => void;
  onSelectInterval: (interval: string) => void;
};

function ChartTopBar({
  symbol,
  interval,
  status,
  isLoading,
  isReplayMode,
  onToggleReplayMode,
  onOpenSymbolModal,
  onRefresh,
  onSelectInterval,
}: ChartTopBarProps) {
  const [isContractInfoOpen, setIsContractInfoOpen] = useState(false);
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [isContractInfoLoading, setIsContractInfoLoading] = useState(false);
  const [contractInfoError, setContractInfoError] = useState<string | null>(null);

  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);

  const selectedTimeframe =
    TIMEFRAME_OPTIONS.find((option) => option.value === interval)?.label ?? interval;

  const handleSelectTimeframe = (value: string) => {
    onSelectInterval(value);
    setIsTimeframeOpen(false);
  };
  const handleToggleContractInfo = async () => {
    if (isContractInfoOpen) {
        setIsContractInfoOpen(false);
        return;
    }

    setIsContractInfoOpen(true);
    setIsContractInfoLoading(true);
    setContractInfoError(null);

    try {
        const info = await fetchContractInfo(symbol);
        setContractInfo(info);
    } catch (error) {
        console.error(error);
        setContractInfoError("Could not load contract info from Yahoo.");
    } finally {
        setIsContractInfoLoading(false);
    }
    };

  return (
    <div className="chart-top-bar">
      <button className="symbol-search-button" onClick={onOpenSymbolModal}>
        <span className="search-icon">⌕</span>
        <strong>{symbol}</strong>
      </button>

      <button
        className="contract-info-button"
        type="button"
        onClick={handleToggleContractInfo}
        title="Contract info"
        >
        i
        </button>

        {isContractInfoOpen && (
        <ContractInfoPopover
            contractInfo={contractInfo}
            isLoading={isContractInfoLoading}
            error={contractInfoError}
            onClose={() => setIsContractInfoOpen(false)}
        />
      )}

      <div className="chart-toolbar-divider" />

      <div className="timeframe-dropdown-wrapper">
        <button
          className="chart-toolbar-button timeframe-button"
          onClick={() => setIsTimeframeOpen((current) => !current)}
        >
          {selectedTimeframe}
          <span className="dropdown-chevron"></span>
        </button>

        {isTimeframeOpen && (
          <div className="timeframe-dropdown">
            {TIMEFRAME_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`timeframe-option ${
                  interval === option.value ? "active" : ""
                }`}
                onClick={() => handleSelectTimeframe(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button className="chart-toolbar-button">Candles</button>

      <button className="chart-toolbar-button">Indicators</button>

      <div className="chart-toolbar-spacer" />

      <button
        className={`chart-toolbar-button replay-toggle-button ${isReplayMode ? "active" : ""}`}
        onClick={onToggleReplayMode}
        >
        {isReplayMode ? "Replay On" : "Replay Off"}
      </button>

      <button
        className="chart-toolbar-button"
        onClick={onRefresh}
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Refresh"}
      </button>

      <div className="chart-status-text">{status}</div>
    </div>
  );
}

export default ChartTopBar;