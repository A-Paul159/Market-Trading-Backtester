package com.strattesting.Backend.controller;

import com.strattesting.Backend.model.ContractInfo;
import com.strattesting.Backend.service.YahooFinanceService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class ContractInfoController {

    private final YahooFinanceService yahooFinanceService;

    public ContractInfoController(YahooFinanceService yahooFinanceService) {
        this.yahooFinanceService = yahooFinanceService;
    }

    @GetMapping("/api/contract-info")
    public ContractInfo getContractInfo(
            @RequestParam(defaultValue = "MES=F") String symbol
    ) throws Exception {
        return yahooFinanceService.getContractInfo(symbol);
    }
}