type WatchlistSymbol = {
  symbol: string;
  name: string;
  category: string;
};

const WATCHLIST_SYMBOLS: WatchlistSymbol[] = [
  { symbol: "MES=F", name: "Micro E-mini S&P 500", category: "Index Futures" },
  { symbol: "MNQ=F", name: "Micro E-mini Nasdaq", category: "Index Futures" },
  { symbol: "ES=F", name: "E-mini S&P 500", category: "Index Futures" },
  { symbol: "NQ=F", name: "E-mini Nasdaq", category: "Index Futures" },
  { symbol: "YM=F", name: "Dow Futures", category: "Index Futures" },
  { symbol: "RTY=F", name: "Russell 2000 Futures", category: "Index Futures" },
  { symbol: "GC=F", name: "Gold Futures", category: "Commodities" },
  { symbol: "MGC=F", name: "Micro Gold Futures", category: "Commodities" },
  { symbol: "CL=F", name: "Crude Oil Futures", category: "Commodities" },
];

type WatchlistProps = {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
};

function Watchlist({ selectedSymbol, onSelectSymbol }: WatchlistProps) {
  return (
    <aside className="panel watchlist">
      <div className="watchlist-header">
        <h2>Watchlist</h2>
        <span>{WATCHLIST_SYMBOLS.length} symbols</span>
      </div>

      <div className="watchlist-items">
        {WATCHLIST_SYMBOLS.map((item) => {
          const isActive = item.symbol === selectedSymbol;

          return (
            <button
              key={item.symbol}
              className={`watchlist-item ${isActive ? "active" : ""}`}
              onClick={() => onSelectSymbol(item.symbol)}
            >
              <div>
                <strong>{item.symbol}</strong>
                <p>{item.name}</p>
              </div>

              <span>{item.category}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default Watchlist;