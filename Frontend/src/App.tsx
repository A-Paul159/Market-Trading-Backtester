import { useEffect, useRef, useState } from "react";
import "./App.css";
import IconSidebar, { type AppView } from "./components/IconSidebar";
import TopStatsBar from "./components/TopStatBar";
import { fetchCandles } from "./services/CandleAPI";
import type { Candle } from "./types/Candle";
import MetricsView from "./views/MetricsView";
import NewsView from "./views/NewsView";
import TradingView from "./views/TradingView";
import type { MarketSelection } from "./components/SymbolSearchModal";
import { parseCandleTime } from "./utils/candleTime";
import type { TradeLogEntry } from "./components/TradeLog";

function getDateString(date: Date) {
  return date.toISOString().split("T")[0];
}

function getTodayDateString() {
  return getDateString(new Date());
}

function getFiveDaysAgoDateString() {
  const date = new Date();
  date.setDate(date.getDate() - 5);
  return getDateString(date);
}

function getPreviousFiveDayRange(currentStartDate: string) {
  const currentStart = new Date(`${currentStartDate}T00:00:00`);

  const olderEnd = new Date(currentStart);
  olderEnd.setDate(olderEnd.getDate() - 1);

  const olderStart = new Date(olderEnd);
  olderStart.setDate(olderStart.getDate() - 4);

  return {
    startDate: getDateString(olderStart),
    endDate: getDateString(olderEnd),
  };
}
function getDelayedLiveCutoffTime() {
  const cutoff = new Date();
  cutoff.setMinutes(cutoff.getMinutes() - 30);
  return cutoff;
}

function mergeCandles(existingCandles: Candle[], newCandles: Candle[]) {
  const candleMap = new Map<string, Candle>();

  [...newCandles, ...existingCandles].forEach((candle) => {
    candleMap.set(`${candle.symbol}-${candle.timestamp}`, candle);
  });

  return Array.from(candleMap.values()).sort(
    (a, b) =>
      parseCandleTime(a.timestamp).getTime() - parseCandleTime(b.timestamp).getTime()
  );
}

function App() {
  
  const [activeView, setActiveView] = useState<AppView>("trading");

  const [symbol, setSymbol] = useState("MES=F");
  const [interval, setInterval] = useState("5m");
  const [startDate, setStartDate] = useState(getFiveDaysAgoDateString());
  const [candles, setCandles] = useState<Candle[]>([]);
  const [status, setStatus] = useState("No candles loaded yet.");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
  const hasLoadedInitialCandles = useRef(false);
  const [liveCutoffTime, setLiveCutoffTime] = useState(getDelayedLiveCutoffTime());
  const STARTING_BALANCE = 50000;
  const [accountStats, setAccountStats] = useState({openPnl: 0,closedPnl: 0,totalPnl: 0,});
  const [tradeLog, setTradeLog] = useState<TradeLogEntry[]>([]);

  const addTradeLogEntry = (trade: TradeLogEntry) => {
    setTradeLog((currentTrades) => [trade, ...currentTrades]);
  };

  const clearTradeLog = () => {
    setTradeLog([]);
  };
  

  const loadCandles = async (override?: MarketSelection) => {
    const request = {
      symbol: override?.symbol ?? symbol,
      interval: override?.interval ?? interval,
      startDate: getFiveDaysAgoDateString(),
      endDate: getTodayDateString(),
    };

    try {
      setIsLoading(true);
      setStatus("Loading candles...");

      const candleData = await fetchCandles(request);

      setCandles(candleData);
      setStartDate(request.startDate);

      if (candleData.length === 0) {
        setStatus(`No candles found for ${request.symbol}.`);
      } else {
        setStatus(`Loaded ${candleData.length} candles for ${request.symbol}`);
      }
    } catch (error) {
      console.error(error);
      setStatus("Could not load candles. Check backend terminal or data availability.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const oneMinuteTimer = window.setInterval(() => {
      setLiveCutoffTime(getDelayedLiveCutoffTime());
    }, 60_000);

    const dataRefreshTimer = window.setInterval(() => {
      loadCandles();
    }, 15 * 60_000);

    return () => {
      window.clearInterval(oneMinuteTimer);
      window.clearInterval(dataRefreshTimer);
    };
  }, [symbol, interval]);

  const applyMarketSelection = (selection: MarketSelection) => {
    setSymbol(selection.symbol);
    setInterval(selection.interval);
    loadCandles(selection);
  };
  const handleSelectInterval = (newInterval: string) => {
    setInterval(newInterval);

    loadCandles({
      symbol,
      interval: newInterval,
    });
  };

  const loadMoreHistoricalCandles = async () => {
    if (isLoadingMoreHistory || isLoading || candles.length === 0) {
      return;
    }

    const olderRange = getPreviousFiveDayRange(startDate);

    try {
      setIsLoadingMoreHistory(true);
      setStatus(`Loading older candles: ${olderRange.startDate} to ${olderRange.endDate}`);

      const olderCandles = await fetchCandles({
        symbol,
        interval,
        startDate: olderRange.startDate,
        endDate: olderRange.endDate,
      });

      setCandles((currentCandles) => mergeCandles(currentCandles, olderCandles));
      setStartDate(olderRange.startDate);

      if (olderCandles.length === 0) {
        setStatus(`No older candles found for ${olderRange.startDate} to ${olderRange.endDate}`);
      } else {
        setStatus(`Loaded ${olderCandles.length} older candles`);
      }
    } catch (error) {
      console.error(error);
      setStatus("Could not load older candles.");
    } finally {
      setIsLoadingMoreHistory(false);
    }
  };
  useEffect(() => {
    if (hasLoadedInitialCandles.current) {
      return;
    }

    hasLoadedInitialCandles.current = true;
    loadCandles();
  }, []);

  return (
    <main className="terminal-app">
      <TopStatsBar
        startingBalance={STARTING_BALANCE}
        openPnl={accountStats.openPnl}
        closedPnl={accountStats.closedPnl}
        totalPnl={accountStats.totalPnl}
      />

      <div className="terminal-body">
        <IconSidebar activeView={activeView} onSelectView={setActiveView} />

        <section className="main-workspace">
          {activeView === "trading" && (
            <TradingView
              symbol={symbol}
              interval={interval}
              candles={candles}
              trades={tradeLog}
              status={status}
              isLoading={isLoading}
              isLoadingMoreHistory={isLoadingMoreHistory}
              liveCutoffTime={liveCutoffTime}
              onRefresh={() => loadCandles()}
              onSelectInterval={handleSelectInterval}
              onLoadMoreHistorical={loadMoreHistoricalCandles}
              onApplyMarketSelection={applyMarketSelection}
              onAccountStatsChange={setAccountStats}
              onAddTradeLogEntry={addTradeLogEntry}
              onClearTradeLog={clearTradeLog}
            />
          )}

          {activeView === "metrics" && (
            <MetricsView 
              trades={tradeLog} 
            />
          )}

          {activeView === "news" && <NewsView />}
        </section>
      </div>
    </main>
  );
}

export default App;