import type { ContractInfo } from "../types/ContractInfo";

type ContractInfoPopoverProps = {
  contractInfo: ContractInfo | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
};

function ContractInfoPopover({
  contractInfo,
  isLoading,
  error,
  onClose,
}: ContractInfoPopoverProps) {
  return (
    <div className="modal-backdrop">
      <div className="contract-info-modal">
        <div className="modal-header">
          <div>
            <h2>Contract Info</h2>
            <p>Metadata provided by Yahoo Finance.</p>
          </div>

          <button className="modal-close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {isLoading && <div className="contract-info-message">Loading info...</div>}

        {error && <div className="contract-info-error">{error}</div>}

        {!isLoading && !error && contractInfo && (
          <div className="contract-info-grid">
            <InfoRow label="Symbol" value={contractInfo.symbol} />
            <InfoRow label="Currency: " value={contractInfo.currency} />
            <InfoRow label="Exchange: " value={contractInfo.exchangeName} />
            <InfoRow label="Full Exchange: " value={contractInfo.fullExchangeName} />
            <InfoRow label="Type: " value={contractInfo.instrumentType} />
            <InfoRow label="Timezone: " value={contractInfo.timezone} />
            <InfoRow label="Exchange Timezone: " value={contractInfo.exchangeTimezoneName} />
            <InfoRow label="GMT Offset: " value={contractInfo.gmtoffset} />
            <InfoRow label="Market Price: " value={contractInfo.regularMarketPrice} />
            <InfoRow label="Previous Close: " value={contractInfo.chartPreviousClose} />
            <InfoRow label="Price Hint: " value={contractInfo.priceHint} />
            <InfoRow label="Data Granularity: " value={contractInfo.dataGranularity} />
            <InfoRow label="Range: " value={contractInfo.range} />
            <InfoRow label="Provider: " value={contractInfo.dataProvider} />
          </div>
        )}
      </div>
    </div>
  );
}

type InfoRowProps = {
  label: string;
  value: string | number | null;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="contract-info-row">
      <span>{label}</span>
      <strong>{value ?? "Unavailable"}</strong>
    </div>
  );
}

export default ContractInfoPopover;