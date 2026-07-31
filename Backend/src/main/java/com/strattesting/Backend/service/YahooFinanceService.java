package com.strattesting.Backend.service;

import com.strattesting.Backend.model.ContractInfo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.strattesting.Backend.model.Candle;
import org.springframework.stereotype.Service;


import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
public class YahooFinanceService {

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final CandleStorageService candleStorageService;

    public YahooFinanceService(CandleStorageService candleStorageService) {
        this.candleStorageService = candleStorageService;

}
    public ContractInfo getContractInfo(String symbol) throws Exception {
        String encodedSymbol = URLEncoder.encode(symbol, StandardCharsets.UTF_8);

        String url = "https://query1.finance.yahoo.com/v8/finance/chart/"
                + encodedSymbol
                + "?range=1d&interval=1m";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", "Mozilla/5.0")
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(
                request,
                HttpResponse.BodyHandlers.ofString()
        );

        String body = response.body();

        System.out.println("Yahoo contract info status: " + response.statusCode());
        System.out.println("Yahoo contract info body starts with: "
                + body.substring(0, Math.min(body.length(), 200)));

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new RuntimeException(
                    "Yahoo returned status " + response.statusCode() + " for symbol: " + symbol
            );
        }

        if (body == null || !body.trim().startsWith("{")) {
            throw new RuntimeException(
                    "Yahoo did not return JSON for symbol: " + symbol
                            + ". Response started with: "
                            + body.substring(0, Math.min(body.length(), 100))
            );
        }

        JsonNode root = objectMapper.readTree(body);

        JsonNode result = root
                .path("chart")
                .path("result")
                .path(0);

        if (result.isMissingNode() || result.isNull()) {
            throw new RuntimeException("Yahoo did not return contract info for symbol: " + symbol);
        }

        JsonNode meta = result.path("meta");

        return new ContractInfo(
                getText(meta, "symbol"),
                getText(meta, "currency"),
                getText(meta, "exchangeName"),
                getText(meta, "fullExchangeName"),
                getText(meta, "instrumentType"),
                getText(meta, "timezone"),
                getText(meta, "exchangeTimezoneName"),
                getInteger(meta, "gmtoffset"),
                getDouble(meta, "regularMarketPrice"),
                getDouble(meta, "chartPreviousClose"),
                getInteger(meta, "priceHint"),
                getText(meta, "dataGranularity"),
                getText(meta, "range"),
                "Yahoo Finance"
        );
    }

    public List<Candle> getCandles(
            String symbol,
            String interval,
            String startDate,
            String endDate
    ) throws IOException, InterruptedException {

        List<CandleStorageService.DateRange> missingRanges =
                candleStorageService.getMissingDateRanges(symbol, startDate, endDate);
        
        LocalDate today = LocalDate.now(ZoneId.of("America/New_York"));

        boolean requestIncludesToday =
                !LocalDate.parse(startDate).isAfter(today)
                        && !LocalDate.parse(endDate).isBefore(today);

        if (requestIncludesToday) {
            missingRanges.add(new CandleStorageService.DateRange(today, today));
        }

        if (missingRanges.isEmpty()) {
            System.out.println("Database already has requested range. Skipping Yahoo fetch.");
        } else {
            System.out.println("Missing ranges found: " + missingRanges.size());

            for (CandleStorageService.DateRange range : missingRanges) {
                System.out.println("Fetching missing range: " + range.startDate() + " to " + range.endDate());

                List<Candle> fetchedCandles = fetchYahooOneMinuteCandlesInChunks(
                        symbol,
                        range.startDate().toString(),
                        range.endDate().toString()
                );

                candleStorageService.saveCandles(fetchedCandles, "YAHOO");
            }
        }

        List<Candle> databaseCandles = candleStorageService.getCandlesFromDatabase(
                symbol,
                startDate,
                endDate
        );

        if (interval.equals("1m")) {
            return databaseCandles;
        }

        return aggregateCandles(databaseCandles, interval);
    }

    private List<Candle> fetchYahooOneMinuteCandlesInChunks(
            String symbol,
            String startDate,
            String endDate
    ) throws InterruptedException {

        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        List<Candle> allCandles = new ArrayList<>();
        LocalDate chunkStart = start;
        while (!chunkStart.isAfter(end)) {
            LocalDate chunkEnd = chunkStart.plusDays(6);

            if (chunkEnd.isAfter(end)) {
                chunkEnd = end;
            }
            System.out.println("Fetching 1m chunk: " + chunkStart + " to " + chunkEnd);
            try {
                List<Candle> chunkCandles = fetchYahooOneMinuteCandles(
                        symbol,
                        chunkStart.toString(),
                        chunkEnd.toString()
                );
                allCandles.addAll(chunkCandles);
                System.out.println("Fetched " + chunkCandles.size() + " candles");
            } catch (IOException error) {
                System.out.println("Failed to fetch chunk " + chunkStart + " to " + chunkEnd);
                System.out.println(error.getMessage());
            }
            chunkStart = chunkEnd.plusDays(1);
        }
        return allCandles;
    }

    private List<Candle> fetchYahooOneMinuteCandles(
            String symbol,
            String startDate,
            String endDate
    ) throws IOException, InterruptedException {

        long period1 = LocalDate.parse(startDate)
                .atStartOfDay(ZoneId.of("America/New_York"))
                .toEpochSecond();

        long period2 = LocalDate.parse(endDate)
                .plusDays(1)
                .atStartOfDay(ZoneId.of("America/New_York"))
                .toEpochSecond();

        String encodedSymbol = URLEncoder.encode(symbol, StandardCharsets.UTF_8);

        String url = "https://query1.finance.yahoo.com/v8/finance/chart/"
                + encodedSymbol
                + "?interval=1m"
                + "&period1=" + period1
                + "&period2=" + period2
                + "&includePrePost=true";

        System.out.println("Yahoo URL: " + url);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", "Mozilla/5.0")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(
                request,
                HttpResponse.BodyHandlers.ofString()
        );

        if (response.statusCode() != 200) {
            throw new IOException("Yahoo request failed with status: " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());

        JsonNode chart = root.path("chart");

        JsonNode error = chart.path("error");
        if (!error.isMissingNode() && !error.isNull()) {
            throw new IOException("Yahoo returned error: " + error.toString());
        }

        JsonNode results = chart.path("result");

        if (!results.isArray() || results.isEmpty()) {
            throw new IOException("No chart result found from Yahoo. Response: " + root.toString());
        }

        JsonNode result = results.get(0);

        JsonNode timestamps = result.path("timestamp");
        JsonNode quote = result.path("indicators").path("quote").get(0);

        if (quote == null || quote.isMissingNode()) {
            throw new IOException("No quote data found from Yahoo.");
        }

        JsonNode opens = quote.path("open");
        JsonNode highs = quote.path("high");
        JsonNode lows = quote.path("low");
        JsonNode closes = quote.path("close");
        JsonNode volumes = quote.path("volume");

        List<Candle> candles = new ArrayList<>();

        for (int i = 0; i < timestamps.size(); i++) {
            if (
                    opens.get(i).isNull()
                            || highs.get(i).isNull()
                            || lows.get(i).isNull()
                            || closes.get(i).isNull()
            ) {
                continue;
            }

            long unixTime = timestamps.get(i).asLong();

            String timestamp = java.time.Instant.ofEpochSecond(unixTime)
                    .atZone(ZoneId.of("America/New_York"))
                    .toLocalDateTime()
                    .toString();

            long volume = volumes.get(i).isNull() ? 0L : volumes.get(i).asLong();

            candles.add(new Candle(
                    symbol,
                    timestamp,
                    opens.get(i).asDouble(),
                    highs.get(i).asDouble(),
                    lows.get(i).asDouble(),
                    closes.get(i).asDouble(),
                    volume
            ));
        }

        return candles;
    }

    private List<Candle> aggregateCandles(List<Candle> candles, String requestedInterval) {
        if (candles.isEmpty()) {
            return candles;
        }

        List<Candle> aggregated = new ArrayList<>();

        Candle firstCandleInBucket = null;
        LocalDateTime currentBucketStart = null;

        double open = 0;
        double high = 0;
        double low = 0;
        double close = 0;
        long volume = 0;

        for (Candle candle : candles) {
            LocalDateTime candleTime = LocalDateTime.parse(candle.getTimestamp());
            LocalDateTime bucketStart = getBucketStart(candleTime, requestedInterval);

            boolean isNewBucket = currentBucketStart == null || !bucketStart.equals(currentBucketStart);

            if (isNewBucket) {
                if (firstCandleInBucket != null) {
                    aggregated.add(new Candle(
                            firstCandleInBucket.getSymbol(),
                            currentBucketStart.toString(),
                            open,
                            high,
                            low,
                            close,
                            volume
                    ));
                }

                firstCandleInBucket = candle;
                currentBucketStart = bucketStart;

                open = candle.getOpen();
                high = candle.getHigh();
                low = candle.getLow();
                close = candle.getClose();
                volume = candle.getVolume();
            } else {
                high = Math.max(high, candle.getHigh());
                low = Math.min(low, candle.getLow());
                close = candle.getClose();
                volume += candle.getVolume();
            }
        }

        if (firstCandleInBucket != null) {
            aggregated.add(new Candle(
                    firstCandleInBucket.getSymbol(),
                    currentBucketStart.toString(),
                    open,
                    high,
                    low,
                    close,
                    volume
            ));
        }

        return aggregated;
    }

    private LocalDateTime getBucketStart(LocalDateTime time, String requestedInterval) {
        return switch (requestedInterval) {
            case "2m" -> floorToMinuteBucket(time, 2);
            case "3m" -> floorToMinuteBucket(time, 3);
            case "5m" -> floorToMinuteBucket(time, 5);
            case "10m" -> floorToMinuteBucket(time, 10);
            case "15m" -> floorToMinuteBucket(time, 15);
            case "30m" -> floorToMinuteBucket(time, 30);
            case "60m", "1h" -> floorToMinuteBucket(time, 60);
            case "4h" -> floorToMinuteBucket(time, 240);
            case "1d" -> time.toLocalDate().atStartOfDay();
            case "1wk" -> floorToWeekBucket(time);
            case "1mo" -> floorToMonthBucket(time);
            default -> floorToMinuteBucket(time, 5);
        };
    }

    private LocalDateTime floorToMinuteBucket(LocalDateTime time, int targetMinutes) {
        int minuteOfDay = time.getHour() * 60 + time.getMinute();
        int flooredMinuteOfDay = (minuteOfDay / targetMinutes) * targetMinutes;

        int hour = flooredMinuteOfDay / 60;
        int minute = flooredMinuteOfDay % 60;

        return time
                .withHour(hour)
                .withMinute(minute)
                .withSecond(0)
                .withNano(0);
    }

    private LocalDateTime floorToWeekBucket(LocalDateTime time) {
        LocalDate date = time.toLocalDate();

        while (date.getDayOfWeek() != DayOfWeek.MONDAY) {
            date = date.minusDays(1);
        }

        return date.atStartOfDay();
    }

    private LocalDateTime floorToMonthBucket(LocalDateTime time) {
        return time
                .withDayOfMonth(1)
                .withHour(0)
                .withMinute(0)
                .withSecond(0)
                .withNano(0);
    }
    private String getText(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);

        if (value.isMissingNode() || value.isNull()) {
            return null;
        }

        return value.asText();
    }

    private Double getDouble(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);

        if (value.isMissingNode() || value.isNull()) {
            return null;
        }

        return value.asDouble();
    }

    private Integer getInteger(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);

        if (value.isMissingNode() || value.isNull()) {
            return null;
        }

        return value.asInt();
    }



}