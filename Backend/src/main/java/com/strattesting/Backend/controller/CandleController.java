package com.strattesting.Backend.controller;

import com.strattesting.Backend.model.Candle;
import com.strattesting.Backend.service.YahooFinanceService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class CandleController {

    private final YahooFinanceService yahooFinanceService;

    public CandleController(YahooFinanceService yahooFinanceService) {
        this.yahooFinanceService = yahooFinanceService;
    }

    @GetMapping("/api/candles")
    public List<Candle> getCandles(
            @RequestParam(defaultValue = "MES=F") String symbol,
            @RequestParam(defaultValue = "5m") String interval,
            @RequestParam(defaultValue = "2026-07-01") String startDate,
            @RequestParam(defaultValue = "2026-07-03") String endDate
    ) throws Exception {
        return yahooFinanceService.getCandles(symbol, interval, startDate, endDate);
    }
}