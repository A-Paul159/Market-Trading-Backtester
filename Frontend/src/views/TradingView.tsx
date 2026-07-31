import { useEffect, useMemo, useRef, useState } from "react";
import CandleChart from "../components/CandleChart";
import ChartToolRail from "../components/ChartToolRail";
import ChartTopBar from "../components/ChartTopBar";
import ReplayControls, { type ReplayPosition } from "../components/ReplayControls";
import SymbolSearchModal, {
  type MarketSelection,
} from "../components/SymbolSearchModal";
import TradeControls, { type Position } from "../components/TradeControls";
import type { Candle } from "../types/Candle";
import type { ChartSettings, CrosshairModeSetting } from "../types/ChartSettings";
import { parseCandleTime } from "../utils/candleTime";
import type { TradeLogEntry } from "../components/TradeLog";

type AccountStats = {
  openPnl: number;
  closedPnl: number;
  totalPnl: number;
};

type RiskOrderLines = {
  stopLossPrice: number;
  takeProfitPrice: number;
  createdAtCandleTimestamp: string;
};

type TradingViewProps = {
  symbol: string;
  interval: string;
  isLoadingMoreHistory: boolean;
  liveCutoffTime: Date;
  onLoadMoreHistorical: () => void;
  candles: Candle[];
  status: string;
  isLoading: boolean;
  trades: TradeLogEntry[];
  onAddTradeLogEntry: (trade: TradeLogEntry) => void;
  onClearTradeLog: () => void;
  onRefresh: () => void;
  onSelectInterval: (interval: string) => void;
  onApplyMarketSelection: (selection: MarketSelection) => void;
  onAccountStatsChange: (stats: AccountStats) => void;
};

function TradingView({
  symbol,
  interval,
  isLoadingMoreHistory,
  onLoadMoreHistorical,
  candles,
  status,
  isLoading,
  liveCutoffTime,
  trades,
  onAddTradeLogEntry,
  onClearTradeLog,
  onRefresh,
  onSelectInterval,
  onApplyMarketSelection,
  onAccountStatsChange,
}: TradingViewProps) {
  // Modal state
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);

  // Chart tool state
  const [activeChartTool, setActiveChartTool] = useState<string | null>(null);
  const [chartSettings, setChartSettings] = useState<ChartSettings>({
    crosshairMode: "magnet",
  });

  // Delayed-live trading state
  const [livePosition, setLivePosition] = useState<Position>({
    quantity: 0,
    averagePrice: null,
  });
  const [liveRealizedPnl, setLiveRealizedPnl] = useState(0);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [riskOrderLines, setRiskOrderLines] =
    useState<RiskOrderLines | null>(null);

  const lastAutoCloseKeyRef = useRef<string | null>(null);

  // Replay state
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [position, setPosition] = useState<ReplayPosition>({
    quantity: 0,
    averagePrice: 0,
  });
  const [realizedPnl, setRealizedPnl] = useState(0);

  const pointValue = getPointValue(symbol);
  const feePerContract = pointValue * 0.1;

  // Delayed-live candles
  const liveCandles = useMemo(() => {
    return candles.filter(
      (candle) =>
        parseCandleTime(candle.timestamp).getTime() <= liveCutoffTime.getTime()
    );
  }, [candles, liveCutoffTime]);

  const latestVisibleCandle = liveCandles[liveCandles.length - 1];
  const currentTradePrice = latestVisibleCandle?.close ?? null;

  // Delayed-live P/L
  const liveUnrealizedPnl =
    currentTradePrice !== null && livePosition.averagePrice !== null
      ? (currentTradePrice - livePosition.averagePrice) *
        livePosition.quantity *
        pointValue
      : 0;

  const liveTotalPnl = liveRealizedPnl + liveUnrealizedPnl;

  // Replay P/L
  const currentCandle = candles[replayIndex];

  const unrealizedPnl =
    currentCandle && position.quantity !== 0
      ? (currentCandle.close - position.averagePrice) *
        position.quantity *
        pointValue
      : 0;

  const totalPnl = realizedPnl + unrealizedPnl;

  const tradeMarkers = useMemo(() => {
    return trades
      .filter((trade) => trade.symbol === symbol)
      .map((trade) => ({
        timestamp: trade.candleTimestamp,
        side: trade.side,
        quantity: trade.quantity,
        price: trade.fillPrice,
      }));
  }, [trades, symbol]);

  const positionLine =
    livePosition.averagePrice !== null && livePosition.quantity !== 0
      ? {
          price: livePosition.averagePrice,
          direction:
            livePosition.quantity > 0 ? ("long" as const) : ("short" as const),
          quantity: livePosition.quantity,
        }
      : null;

  useEffect(() => {
    onAccountStatsChange({
      openPnl: liveUnrealizedPnl,
      closedPnl: liveRealizedPnl,
      totalPnl: liveTotalPnl,
    });
  }, [liveUnrealizedPnl, liveRealizedPnl, liveTotalPnl, onAccountStatsChange]);

  useEffect(() => {
    resetReplayState();
    resetLiveTradingState();
    onClearTradeLog();
  }, [symbol, interval]);

  useEffect(() => {
    if (!isReplayMode) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        stepForward();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isReplayMode, replayIndex, candles.length]);

  // Auto close when SL/TP is hit
  useEffect(() => {
    if (
      !latestVisibleCandle ||
      !riskOrderLines ||
      livePosition.quantity === 0 ||
      livePosition.averagePrice === null
    ) {
      return;
    }

    if (latestVisibleCandle.timestamp === riskOrderLines.createdAtCandleTimestamp) {
      return;
    }

    const isLong = livePosition.quantity > 0;

    const stopLossHit = isLong
      ? latestVisibleCandle.low <= riskOrderLines.stopLossPrice
      : latestVisibleCandle.high >= riskOrderLines.stopLossPrice;

    const takeProfitHit = isLong
      ? latestVisibleCandle.high >= riskOrderLines.takeProfitPrice
      : latestVisibleCandle.low <= riskOrderLines.takeProfitPrice;

    if (!stopLossHit && !takeProfitHit) {
      return;
    }

    const exitPrice = stopLossHit
      ? riskOrderLines.stopLossPrice
      : riskOrderLines.takeProfitPrice;

    const autoCloseKey = `${symbol}-${latestVisibleCandle.timestamp}-${exitPrice}-${livePosition.quantity}`;

    if (lastAutoCloseKeyRef.current === autoCloseKey) {
      return;
    }

    lastAutoCloseKeyRef.current = autoCloseKey;

    const grossPnl =
      (exitPrice - livePosition.averagePrice) *
      livePosition.quantity *
      pointValue;

    const exitSide = isLong ? "SELL" : "BUY";

    const netRealizedPnl = addTradeLogEntry(
      exitSide,
      Math.abs(livePosition.quantity),
      exitPrice,
      0,
      grossPnl,
      latestVisibleCandle.timestamp
    );

    setLiveRealizedPnl((current) => current + netRealizedPnl);

    setLivePosition({
      quantity: 0,
      averagePrice: null,
    });

    setRiskOrderLines(null);
  }, [latestVisibleCandle, riskOrderLines, livePosition, pointValue, symbol]);

  // Chart tools
  const handleSelectChartTool = (toolId: string) => {
    setActiveChartTool((currentTool) =>
      currentTool === toolId ? null : toolId
    );
  };

  const handleChangeCrosshairMode = (mode: CrosshairModeSetting) => {
    setChartSettings((currentSettings) => ({
      ...currentSettings,
      crosshairMode: mode,
    }));
  };

  // Symbol / market selection
  const handleApplyMarketSelection = (selection: MarketSelection) => {
    onApplyMarketSelection(selection);
    setIsSymbolModalOpen(false);
  };

  // Fees calculation
  const calculateFees = (quantity: number) => {
    return quantity * feePerContract;
  };

  // Trade log
  const addTradeLogEntry = (
    side: "BUY" | "SELL" | "FLATTEN",
    quantity: number,
    fillPrice: number,
    positionAfter: number,
    grossRealizedPnl: number,
    candleTimestamp: string
  ) => {
    const fees = calculateFees(quantity);
    const netRealizedPnl = grossRealizedPnl - fees;

    onAddTradeLogEntry({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      candleTimestamp,
      symbol,
      side,
      quantity,
      fillPrice,
      positionAfter,
      fees,
      grossRealizedPnl,
      realizedPnl: netRealizedPnl,
    });

    return netRealizedPnl;
  };

  const createDefaultRiskOrderLines = (
    entryPrice: number,
    direction: "long" | "short",
    createdAtCandleTimestamp: string
  ) => {
    lastAutoCloseKeyRef.current = null;

    if (direction === "long") {
      setRiskOrderLines({
        stopLossPrice: entryPrice - 20,
        takeProfitPrice: entryPrice + 40,
        createdAtCandleTimestamp,
      });
      return;
    }

    setRiskOrderLines({
      stopLossPrice: entryPrice + 20,
      takeProfitPrice: entryPrice - 40,
      createdAtCandleTimestamp,
    });
  };

  const updateRiskOrderLines = (lines: {
    stopLossPrice: number;
    takeProfitPrice: number;
  }) => {
    setRiskOrderLines((currentLines) => {
      if (!currentLines) {
        return null;
      }

      return {
        ...currentLines,
        stopLossPrice: lines.stopLossPrice,
        takeProfitPrice: lines.takeProfitPrice,
      };
    });
  };

  // Delayed-live trading
  const handleLiveBuy = () => {
    if (currentTradePrice === null || !latestVisibleCandle) {
      return;
    }

    const currentPosition = livePosition;

    if (currentPosition.quantity >= 0) {
      const newQuantity = currentPosition.quantity + orderQuantity;

      const newAveragePrice =
        currentPosition.averagePrice === null
          ? currentTradePrice
          : (currentPosition.averagePrice * currentPosition.quantity +
              currentTradePrice * orderQuantity) /
            newQuantity;

      setLivePosition({
        quantity: newQuantity,
        averagePrice: newAveragePrice,
      });

      createDefaultRiskOrderLines(
        newAveragePrice,
        "long",
        latestVisibleCandle.timestamp
      );

      const netRealizedPnl = addTradeLogEntry(
        "BUY",
        orderQuantity,
        currentTradePrice,
        newQuantity,
        0,
        latestVisibleCandle.timestamp
      );

      setLiveRealizedPnl((current) => current + netRealizedPnl);
      return;
    }

    const closingQuantity = Math.min(
      Math.abs(currentPosition.quantity),
      orderQuantity
    );

    const grossRealizedAmount =
      (currentPosition.averagePrice! - currentTradePrice) *
      closingQuantity *
      pointValue;

    const newQuantity = currentPosition.quantity + orderQuantity;

    const netRealizedPnl = addTradeLogEntry(
      "BUY",
      orderQuantity,
      currentTradePrice,
      newQuantity,
      grossRealizedAmount,
      latestVisibleCandle.timestamp
    );

    setLiveRealizedPnl((current) => current + netRealizedPnl);

    if (newQuantity === 0) {
      setLivePosition({
        quantity: 0,
        averagePrice: null,
      });

      setRiskOrderLines(null);
      return;
    }

    if (newQuantity > 0) {
      setLivePosition({
        quantity: newQuantity,
        averagePrice: currentTradePrice,
      });

      createDefaultRiskOrderLines(
        currentTradePrice,
        "long",
        latestVisibleCandle.timestamp
      );

      return;
    }

    setLivePosition({
      quantity: newQuantity,
      averagePrice: currentPosition.averagePrice,
    });
  };

  const handleLiveSell = () => {
    if (currentTradePrice === null || !latestVisibleCandle) {
      return;
    }

    const currentPosition = livePosition;

    if (currentPosition.quantity <= 0) {
      const newQuantity = currentPosition.quantity - orderQuantity;
      const oldSize = Math.abs(currentPosition.quantity);
      const newSize = Math.abs(newQuantity);

      const newAveragePrice =
        currentPosition.averagePrice === null
          ? currentTradePrice
          : (currentPosition.averagePrice * oldSize +
              currentTradePrice * orderQuantity) /
            newSize;

      setLivePosition({
        quantity: newQuantity,
        averagePrice: newAveragePrice,
      });

      createDefaultRiskOrderLines(
        newAveragePrice,
        "short",
        latestVisibleCandle.timestamp
      );

      const netRealizedPnl = addTradeLogEntry(
        "SELL",
        orderQuantity,
        currentTradePrice,
        newQuantity,
        0,
        latestVisibleCandle.timestamp
      );

      setLiveRealizedPnl((current) => current + netRealizedPnl);
      return;
    }

    const closingQuantity = Math.min(currentPosition.quantity, orderQuantity);

    const grossRealizedAmount =
      (currentTradePrice - currentPosition.averagePrice!) *
      closingQuantity *
      pointValue;

    const newQuantity = currentPosition.quantity - orderQuantity;

    const netRealizedPnl = addTradeLogEntry(
      "SELL",
      orderQuantity,
      currentTradePrice,
      newQuantity,
      grossRealizedAmount,
      latestVisibleCandle.timestamp
    );

    setLiveRealizedPnl((current) => current + netRealizedPnl);

    if (newQuantity === 0) {
      setLivePosition({
        quantity: 0,
        averagePrice: null,
      });

      setRiskOrderLines(null);
      return;
    }

    if (newQuantity < 0) {
      setLivePosition({
        quantity: newQuantity,
        averagePrice: currentTradePrice,
      });

      createDefaultRiskOrderLines(
        currentTradePrice,
        "short",
        latestVisibleCandle.timestamp
      );

      return;
    }

    setLivePosition({
      quantity: newQuantity,
      averagePrice: currentPosition.averagePrice,
    });
  };

  const handleLiveFlatten = () => {
    if (
      currentTradePrice === null ||
      !latestVisibleCandle ||
      livePosition.averagePrice === null ||
      livePosition.quantity === 0
    ) {
      return;
    }

    const grossPnl =
      (currentTradePrice - livePosition.averagePrice) *
      livePosition.quantity *
      pointValue;

    const netRealizedPnl = addTradeLogEntry(
      "FLATTEN",
      Math.abs(livePosition.quantity),
      currentTradePrice,
      0,
      grossPnl,
      latestVisibleCandle.timestamp
    );

    setLiveRealizedPnl((current) => current + netRealizedPnl);

    setLivePosition({
      quantity: 0,
      averagePrice: null,
    });

    setRiskOrderLines(null);
  };

  const resetLiveTradingState = () => {
    setLivePosition({
      quantity: 0,
      averagePrice: null,
    });

    setLiveRealizedPnl(0);
    setRiskOrderLines(null);
    lastAutoCloseKeyRef.current = null;
  };

  // Replay controls
  const toggleReplayMode = () => {
    setIsReplayMode((current) => !current);
    resetReplayState();
  };

  const stepForward = () => {
    setReplayIndex((current) => Math.min(current + 1, candles.length - 1));
  };

  const stepBack = () => {
    setReplayIndex((current) => Math.max(current - 1, 0));
  };

  const resetReplay = () => {
    resetReplayState();
  };

  const resetReplayState = () => {
    setReplayIndex(0);
    setPosition({
      quantity: 0,
      averagePrice: 0,
    });
    setRealizedPnl(0);
  };

  const buy = () => {
    executeTrade(1);
  };

  const sell = () => {
    executeTrade(-1);
  };

  const closePosition = () => {
    if (!currentCandle || position.quantity === 0) {
      return;
    }

    const pnl =
      (currentCandle.close - position.averagePrice) *
      position.quantity *
      pointValue;

    setRealizedPnl((current) => current + pnl);
    setPosition({
      quantity: 0,
      averagePrice: 0,
    });
  };

  const executeTrade = (tradeDirection: 1 | -1) => {
    if (!currentCandle) {
      return;
    }

    const tradePrice = currentCandle.close;

    setPosition((currentPosition) => {
      if (currentPosition.quantity === 0) {
        return {
          quantity: tradeDirection,
          averagePrice: tradePrice,
        };
      }

      const currentDirection = Math.sign(currentPosition.quantity);

      if (currentDirection === tradeDirection) {
        const currentSize = Math.abs(currentPosition.quantity);
        const newSize = currentSize + 1;

        const newAveragePrice =
          (currentPosition.averagePrice * currentSize + tradePrice) / newSize;

        return {
          quantity: currentPosition.quantity + tradeDirection,
          averagePrice: newAveragePrice,
        };
      }

      const closedPnl =
        (tradePrice - currentPosition.averagePrice) *
        currentDirection *
        pointValue;

      setRealizedPnl((current) => current + closedPnl);

      const newQuantity = currentPosition.quantity + tradeDirection;

      if (newQuantity === 0) {
        return {
          quantity: 0,
          averagePrice: 0,
        };
      }

      return {
        quantity: newQuantity,
        averagePrice: currentPosition.averagePrice,
      };
    });
  };

  return (
    <section className="view trading-view">
      <ChartTopBar
        symbol={symbol}
        interval={interval}
        status={
          isLoadingMoreHistory
            ? "Loading older candles..."
            : `${status} • Delayed to ${formatTime(liveCutoffTime)}`
        }
        isLoading={isLoading}
        isReplayMode={isReplayMode}
        onOpenSymbolModal={() => setIsSymbolModalOpen(true)}
        onRefresh={onRefresh}
        onSelectInterval={onSelectInterval}
        onToggleReplayMode={toggleReplayMode}
      />

      <section className="trading-terminal-panel">
        <ChartToolRail
          activeChartTool={activeChartTool}
          chartSettings={chartSettings}
          onSelectChartTool={handleSelectChartTool}
          onChangeCrosshairMode={handleChangeCrosshairMode}
        />

        <div className="chart-and-order-layout">
          <div className="chart-stage">
            {isReplayMode && candles.length > 0 && (
              <ReplayControls
                currentCandle={currentCandle}
                replayIndex={replayIndex}
                totalCandles={candles.length}
                position={position}
                realizedPnl={realizedPnl}
                unrealizedPnl={unrealizedPnl}
                totalPnl={totalPnl}
                onStepBack={stepBack}
                onStepForward={stepForward}
                onBuy={buy}
                onSell={sell}
                onClosePosition={closePosition}
                onResetReplay={resetReplay}
              />
            )}

            {liveCandles.length > 0 ? (
              <CandleChart
                candles={liveCandles}
                tradeMarkers={tradeMarkers}
                positionLine={positionLine}
                riskOrderLines={riskOrderLines}
                onChangeRiskOrderLines={updateRiskOrderLines}
                visibleUntilIndex={isReplayMode ? replayIndex : undefined}
                shouldFitContent={!isReplayMode}
                onLoadMoreHistorical={onLoadMoreHistorical}
                canLoadMoreHistorical={
                  !isReplayMode && !isLoading && !isLoadingMoreHistory
                }
                chartSettings={chartSettings}
                chartResetKey={`${symbol}-${interval}`}
              />
            ) : (
              <section className="terminal-empty-state">
                <h2>No delayed candles available yet</h2>
                <p>
                  The chart is waiting for candles at least 30 minutes behind
                  real time.
                </p>
              </section>
            )}
          </div>

          {!isReplayMode && (
            <div className="order-side-panel">
              <TradeControls
                symbol={symbol}
                currentPrice={currentTradePrice}
                position={livePosition}
                realizedPnl={liveRealizedPnl}
                unrealizedPnl={liveUnrealizedPnl}
                totalPnl={liveTotalPnl}
                orderQuantity={orderQuantity}
                onChangeOrderQuantity={setOrderQuantity}
                onBuy={handleLiveBuy}
                onSell={handleLiveSell}
                onFlatten={handleLiveFlatten}
              />
            </div>
          )}
        </div>
      </section>

      {isSymbolModalOpen && (
        <SymbolSearchModal
          symbol={symbol}
          interval={interval}
          onClose={() => setIsSymbolModalOpen(false)}
          onApply={handleApplyMarketSelection}
        />
      )}
    </section>
  );
}

function getPointValue(symbol: string) {
  switch (symbol) {
    case "MES=F":
      return 5;
    case "MNQ=F":
      return 2;
    case "ES=F":
      return 50;
    case "NQ=F":
      return 20;
    case "MGC=F":
      return 10;
    case "GC=F":
      return 100;
    case "CL=F":
      return 1000;
    default:
      return 1;
  }
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default TradingView;