import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  CrosshairMode,
  createSeriesMarkers,
  type CandlestickData,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
  type WhitespaceData,
} from "lightweight-charts";
import type { Candle } from "../types/Candle";
import type { ChartSettings } from "../types/ChartSettings";
import { parseCandleTime } from "../utils/candleTime";

type TradeMarker = {
  timestamp: string;
  side: "BUY" | "SELL" | "FLATTEN";
  quantity: number;
  price: number;
};

type PositionLine = {
  price: number;
  direction: "long" | "short";
  quantity: number;
};

type RiskOrderLines = {
  stopLossPrice: number;
  takeProfitPrice: number;
};

type RiskHandleCoordinates = {
  stopLossY: number | null;
  takeProfitY: number | null;
};

type CandleChartProps = {
  candles: Candle[];
  visibleUntilIndex?: number;
  shouldFitContent?: boolean;
  tradeMarkers?: TradeMarker[];
  positionLine?: PositionLine | null;
  riskOrderLines?: RiskOrderLines | null;
  onChangeRiskOrderLines?: (lines: RiskOrderLines) => void;
  onLoadMoreHistorical?: () => void;
  canLoadMoreHistorical?: boolean;
  chartSettings?: ChartSettings;
  chartResetKey?: string;
};

type ChartDataPoint = CandlestickData<Time> | WhitespaceData<Time>;

function CandleChart({
  candles,
  visibleUntilIndex,
  shouldFitContent = true,
  tradeMarkers = [],
  positionLine = null,
  riskOrderLines = null,
  onChangeRiskOrderLines,
  onLoadMoreHistorical,
  canLoadMoreHistorical = false,
  chartSettings,
  chartResetKey,
}: CandleChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const averageEntryLineRef = useRef<IPriceLine | null>(null);
  const stopLossLineRef = useRef<IPriceLine | null>(null);
  const takeProfitLineRef = useRef<IPriceLine | null>(null);
  const activeRiskDragRef = useRef<"stopLoss" | "takeProfit" | null>(null);

  const [riskHandleCoordinates, setRiskHandleCoordinates] =
    useState<RiskHandleCoordinates>({
      stopLossY: null,
      takeProfitY: null,
    });
  const markerSeriesRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const previousChartResetKeyRef = useRef<string | undefined>(chartResetKey);
  const previousCandleCountRef = useRef(0);
  const previousFirstTimestampRef = useRef<string | null>(null);
  const previousLastTimestampRef = useRef<string | null>(null);
  const hasFitInitialContentRef = useRef(false);
  const lastHistoricalRequestKeyRef = useRef<string | null>(null);

  const crosshairMode = chartSettings?.crosshairMode ?? "magnet";

  const updateRiskHandleCoordinates = () => {
  const candleSeries = candleSeriesRef.current;
    if (!candleSeries || !riskOrderLines) {
        setRiskHandleCoordinates({
        stopLossY: null,
        takeProfitY: null,
        });
        return;
    }
    setRiskHandleCoordinates({
        stopLossY: candleSeries.priceToCoordinate(riskOrderLines.stopLossPrice),
        takeProfitY: candleSeries.priceToCoordinate(riskOrderLines.takeProfitPrice),
    });
  };

  // Update when chart is resized
  useEffect(() => {
    const container = chartContainerRef.current;

    if (!container) {
      return;
    }

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        textColor: "#cbd5e1",
        background: { color: "#020617" },
        attributionLogo: false,
      },
      crosshair: {
        mode: getLightweightCrosshairMode(crosshairMode),
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.12)" },
        horzLines: { color: "rgba(148, 163, 184, 0.12)" },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.2)",
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "rgba(148, 163, 184, 0.2)",
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries);
    const markerSeries = createSeriesMarkers(candleSeries, [] as SeriesMarker<Time>[]);

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    markerSeriesRef.current = markerSeries;

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      markerSeriesRef.current = null;
      averageEntryLineRef.current = null;
      stopLossLineRef.current = null;
      takeProfitLineRef.current = null;
      averageEntryLineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;

    if (!chart) {
      return;
    }

    chart.applyOptions({
      crosshair: {
        mode: getLightweightCrosshairMode(crosshairMode),
      },
    });
    updateRiskHandleCoordinates();
  }, [crosshairMode]);

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;

    if (!chart || !candleSeries || candles.length === 0) {
      return;
    }

    const previousCandleCount = previousCandleCountRef.current;
    const previousFirstTimestamp = previousFirstTimestampRef.current;
    const previousLastTimestamp = previousLastTimestampRef.current;
    const chartResetKeyChanged = previousChartResetKeyRef.current !== chartResetKey;

    const newFirstTimestamp = candles[0]?.timestamp ?? null;
    const newLastTimestamp = candles[candles.length - 1]?.timestamp ?? null;

    const previousVisibleRange = chart.timeScale().getVisibleLogicalRange();

    const candlesWerePrepended =
        previousFirstTimestamp !== null &&
        newFirstTimestamp !== null &&
        previousFirstTimestamp !== newFirstTimestamp &&
        candles.length > previousCandleCount;

    const candlesWereAppended =
        previousLastTimestamp !== null &&
        newLastTimestamp !== null &&
        previousLastTimestamp !== newLastTimestamp &&
        candles.length > previousCandleCount &&
        !candlesWerePrepended;

    const addedCandleCount = candles.length - previousCandleCount;

    const chartData: ChartDataPoint[] = candles.map((candle, index) => {
      const time = Math.floor(parseCandleTime(candle.timestamp).getTime() / 1000) as Time;

      if (visibleUntilIndex !== undefined && index > visibleUntilIndex) {
        return { time };
      }

      return {
        time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      };
    });

    candleSeries.setData(chartData);

    if (chartResetKeyChanged) {
        chart.timeScale().fitContent();
        hasFitInitialContentRef.current = true;
    } else if (candlesWerePrepended && previousVisibleRange) {
        chart.timeScale().setVisibleLogicalRange({
            from: previousVisibleRange.from + addedCandleCount,
            to: previousVisibleRange.to + addedCandleCount,
        });
    } else if (candlesWereAppended && previousVisibleRange) {
        chart.timeScale().setVisibleLogicalRange(previousVisibleRange);
    } else if (shouldFitContent && !hasFitInitialContentRef.current) {
        chart.timeScale().fitContent();
        hasFitInitialContentRef.current = true;
    }

    previousCandleCountRef.current = candles.length;
    previousFirstTimestampRef.current = newFirstTimestamp;
    previousLastTimestampRef.current = newLastTimestamp;
    previousChartResetKeyRef.current = chartResetKey;
  }, [candles, visibleUntilIndex, shouldFitContent, chartResetKey]);

  // Load more historical candles when the user scrolls to the left
  useEffect(() => {
    const chart = chartRef.current;

    if (!chart || !onLoadMoreHistorical) {
      return;
    }

    const handleVisibleRangeChange = () => {
      if (!canLoadMoreHistorical) {
        return;
      }

      const logicalRange = chart.timeScale().getVisibleLogicalRange();

      if (!logicalRange) {
        return;
      }

      const firstLoadedCandleTimestamp = candles[0]?.timestamp;

      if (!firstLoadedCandleTimestamp) {
        return;
      }

      const isNearOldestCandles = logicalRange.from < 10;

      if (!isNearOldestCandles) {
        return;
      }

      if (lastHistoricalRequestKeyRef.current === firstLoadedCandleTimestamp) {
        return;
      }

      lastHistoricalRequestKeyRef.current = firstLoadedCandleTimestamp;
      onLoadMoreHistorical();
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
    chart.timeScale().subscribeVisibleLogicalRangeChange(updateRiskHandleCoordinates);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(updateRiskHandleCoordinates);
    };
  }, [candles, onLoadMoreHistorical, canLoadMoreHistorical]);

  //Buy/Sell/Flatten markers
  useEffect(() => {
    const markerSeries = markerSeriesRef.current;

    if (!markerSeries) {
        return;
    }

    const markers: SeriesMarker<Time>[] = tradeMarkers
        .map((marker) => {
        const time = Math.floor(
            parseCandleTime(marker.timestamp).getTime() / 1000
        ) as Time;

        if (marker.side === "BUY") {
            return {
            time,
            position: "belowBar" as const,
            shape: "arrowUp" as const,
            color: "#22c55e",
            text: `B ${marker.quantity}`,
            };
        }

        if (marker.side === "SELL") {
            return {
            time,
            position: "aboveBar" as const,
            shape: "arrowDown" as const,
            color: "#ef4444",
            text: `S ${marker.quantity}`,
            };
        }

        return {
            time,
            position: "aboveBar" as const,
            shape: "circle" as const,
            color: "#e5e7eb",
            text: `F ${marker.quantity}`,
        };
        })
        .sort((a, b) => Number(a.time) - Number(b.time));

    markerSeries.setMarkers(markers);
    }, [tradeMarkers]);

    // Average Position line
    useEffect(() => {
        const candleSeries = candleSeriesRef.current;

        if (!candleSeries) {
            return;
        }

        if (averageEntryLineRef.current) {
            candleSeries.removePriceLine(averageEntryLineRef.current);
            averageEntryLineRef.current = null;
        }

        if (!positionLine) {
            return;
        }

        const isLong = positionLine.direction === "long";

        averageEntryLineRef.current = candleSeries.createPriceLine({
            price: positionLine.price,
            color: isLong ? "#22c55e" : "#ef4444",
            lineWidth: 2,
            lineStyle: 2,
            axisLabelVisible: true,
            title: isLong
            ? `AVG LONG ${positionLine.quantity}`
            : `AVG SHORT ${Math.abs(positionLine.quantity)}`,
        });
    }, [positionLine]);

    // Risk Order Lines (Stop Loss and Take Profit)
    useEffect(() => {
        const candleSeries = candleSeriesRef.current;

        if (!candleSeries) {
            return;
        }

        if (stopLossLineRef.current) {
            candleSeries.removePriceLine(stopLossLineRef.current);
            stopLossLineRef.current = null;
        }

        if (takeProfitLineRef.current) {
            candleSeries.removePriceLine(takeProfitLineRef.current);
            takeProfitLineRef.current = null;
        }

        if (!riskOrderLines) {
            setRiskHandleCoordinates({
            stopLossY: null,
            takeProfitY: null,
            });
            return;
        }

        stopLossLineRef.current = candleSeries.createPriceLine({
            price: riskOrderLines.stopLossPrice,
            color: "#ef4444",
            lineWidth: 2,
            lineStyle: 2,
            axisLabelVisible: true,
            title: "",
        });

        takeProfitLineRef.current = candleSeries.createPriceLine({
            price: riskOrderLines.takeProfitPrice,
            color: "#22c55e",
            lineWidth: 2,
            lineStyle: 2,
            axisLabelVisible: true,
            title: "",
        });

        updateRiskHandleCoordinates();
    }, [riskOrderLines]);

    // Handle dragging of risk order lines
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            const activeDrag = activeRiskDragRef.current;
            const container = chartContainerRef.current;
            const candleSeries = candleSeriesRef.current;

            if (!activeDrag || !container || !candleSeries || !riskOrderLines) {
            return;
            }

            const containerRect = container.getBoundingClientRect();
            const y = event.clientY - containerRect.top;
            const price = candleSeries.coordinateToPrice(y);

            if (price === null) {
            return;
            }

            if (activeDrag === "stopLoss") {
            onChangeRiskOrderLines?.({
                ...riskOrderLines,
                stopLossPrice: price,
            });
            }

            if (activeDrag === "takeProfit") {
            onChangeRiskOrderLines?.({
                ...riskOrderLines,
                takeProfitPrice: price,
            });
            }
        };

        const handleMouseUp = () => {
            activeRiskDragRef.current = null;
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [riskOrderLines, onChangeRiskOrderLines]);

  return (
    <div ref={chartContainerRef} className="chart-container">
        {riskOrderLines && riskHandleCoordinates.stopLossY !== null && (
        <button
            className="risk-order-handle stop-loss"
            type="button"
            style={{ top: riskHandleCoordinates.stopLossY }}
            onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            activeRiskDragRef.current = "stopLoss";
            }}
        >
            SL {riskOrderLines.stopLossPrice.toFixed(2)}
        </button>
        )}

        {riskOrderLines && riskHandleCoordinates.takeProfitY !== null && (
        <button
            className="risk-order-handle take-profit"
            type="button"
            style={{ top: riskHandleCoordinates.takeProfitY }}
            onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            activeRiskDragRef.current = "takeProfit";
            }}
        >
            TP {riskOrderLines.takeProfitPrice.toFixed(2)}
        </button>
        )}
    </div>
  );
}

function getLightweightCrosshairMode(mode: string) {
  switch (mode) {
    case "normal":
      return CrosshairMode.Normal;
    case "magnet":
      return CrosshairMode.Magnet;
    case "hidden":
      return CrosshairMode.Hidden;
    default:
      return CrosshairMode.Magnet;
  }
}

export default CandleChart;