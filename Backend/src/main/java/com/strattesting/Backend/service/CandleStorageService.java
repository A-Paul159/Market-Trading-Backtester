package com.strattesting.Backend.service;

import com.strattesting.Backend.entity.CandleEntity;
import com.strattesting.Backend.model.Candle;
import com.strattesting.Backend.repository.CandleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class CandleStorageService {

    private final CandleRepository candleRepository;

    public CandleStorageService(CandleRepository candleRepository) {
        this.candleRepository = candleRepository;
    }

    public void saveCandles(List<Candle> candles, String source) {
        for (Candle candle : candles) {
            LocalDateTime timestamp = LocalDateTime.parse(candle.getTimestamp());

            boolean alreadyExists = candleRepository.existsBySymbolAndTimestamp(
                    candle.getSymbol(),
                    timestamp
            );

            if (!alreadyExists) {
                CandleEntity entity = new CandleEntity(
                        candle.getSymbol(),
                        timestamp,
                        candle.getOpen(),
                        candle.getHigh(),
                        candle.getLow(),
                        candle.getClose(),
                        candle.getVolume(),
                        source
                );

                candleRepository.save(entity);
            }
        }
    }

    public List<Candle> getCandlesFromDatabase(
            String symbol,
            String startDate,
            String endDate
    ) {
        LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00");
        LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59");

        return candleRepository
                .findBySymbolAndTimestampBetweenOrderByTimestampAsc(symbol, start, end)
                .stream()
                .map(entity -> new Candle(
                        entity.getSymbol(),
                        entity.getTimestamp().toString(),
                        entity.getOpen(),
                        entity.getHigh(),
                        entity.getLow(),
                        entity.getClose(),
                        entity.getVolume()
                ))
                .toList();
    }

    public List<DateRange> getMissingDateRanges(
            String symbol,
            String startDate,
            String endDate
    ) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);

        List<LocalDate> missingDays = new ArrayList<>();

        LocalDate currentDate = start;

        while (!currentDate.isAfter(end)) {
            if (!hasCandlesForDate(symbol, currentDate)) {
                missingDays.add(currentDate);
            }

            currentDate = currentDate.plusDays(1);
        }

        return groupMissingDaysIntoRanges(missingDays);
    }

    private boolean hasCandlesForDate(String symbol, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        return candleRepository.existsBySymbolAndTimestampBetween(
                symbol,
                startOfDay,
                endOfDay
        );
    }

    private List<DateRange> groupMissingDaysIntoRanges(List<LocalDate> missingDays) {
        List<DateRange> ranges = new ArrayList<>();

        if (missingDays.isEmpty()) {
            return ranges;
        }

        LocalDate rangeStart = missingDays.get(0);
        LocalDate previousDay = missingDays.get(0);

        for (int i = 1; i < missingDays.size(); i++) {
            LocalDate currentDay = missingDays.get(i);

            boolean isConsecutive = currentDay.equals(previousDay.plusDays(1));

            if (!isConsecutive) {
                ranges.add(new DateRange(rangeStart, previousDay));
                rangeStart = currentDay;
            }

            previousDay = currentDay;
        }

        ranges.add(new DateRange(rangeStart, previousDay));

        return ranges;
    }

    public record DateRange(LocalDate startDate, LocalDate endDate) {
    }
}