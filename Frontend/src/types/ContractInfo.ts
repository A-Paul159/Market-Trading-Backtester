export type ContractInfo = {
  symbol: string | null;
  currency: string | null;
  exchangeName: string | null;
  fullExchangeName: string | null;
  instrumentType: string | null;
  timezone: string | null;
  exchangeTimezoneName: string | null;
  gmtoffset: number | null;
  regularMarketPrice: number | null;
  chartPreviousClose: number | null;
  priceHint: number | null;
  dataGranularity: string | null;
  range: string | null;
  dataProvider: string | null;
};