package com.strattesting.Backend.model;

public class ContractInfo {

    private String symbol;
    private String currency;
    private String exchangeName;
    private String fullExchangeName;
    private String instrumentType;
    private String timezone;
    private String exchangeTimezoneName;
    private Integer gmtoffset;
    private Double regularMarketPrice;
    private Double chartPreviousClose;
    private Integer priceHint;
    private String dataGranularity;
    private String range;
    private String dataProvider;

    public ContractInfo(
            String symbol,
            String currency,
            String exchangeName,
            String fullExchangeName,
            String instrumentType,
            String timezone,
            String exchangeTimezoneName,
            Integer gmtoffset,
            Double regularMarketPrice,
            Double chartPreviousClose,
            Integer priceHint,
            String dataGranularity,
            String range,
            String dataProvider
    ) {
        this.symbol = symbol;
        this.currency = currency;
        this.exchangeName = exchangeName;
        this.fullExchangeName = fullExchangeName;
        this.instrumentType = instrumentType;
        this.timezone = timezone;
        this.exchangeTimezoneName = exchangeTimezoneName;
        this.gmtoffset = gmtoffset;
        this.regularMarketPrice = regularMarketPrice;
        this.chartPreviousClose = chartPreviousClose;
        this.priceHint = priceHint;
        this.dataGranularity = dataGranularity;
        this.range = range;
        this.dataProvider = dataProvider;
    }

    public String getSymbol() { return symbol; }
    public String getCurrency() { return currency; }
    public String getExchangeName() { return exchangeName; }
    public String getFullExchangeName() { return fullExchangeName; }
    public String getInstrumentType() { return instrumentType; }
    public String getTimezone() { return timezone; }
    public String getExchangeTimezoneName() { return exchangeTimezoneName; }
    public Integer getGmtoffset() { return gmtoffset; }
    public Double getRegularMarketPrice() { return regularMarketPrice; }
    public Double getChartPreviousClose() { return chartPreviousClose; }
    public Integer getPriceHint() { return priceHint; }
    public String getDataGranularity() { return dataGranularity; }
    public String getRange() { return range; }
    public String getDataProvider() { return dataProvider; }


    
}