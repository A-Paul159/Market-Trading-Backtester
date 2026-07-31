package com.strattesting.Backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "candles",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "unique_symbol_timestamp",
                        columnNames = {"symbol", "timestamp"}
                )
        }
)
public class CandleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String symbol;

    private LocalDateTime timestamp;

    private double open;

    private double high;

    private double low;

    private double close;

    private long volume;

    private String source;

    private LocalDateTime createdAt;

    public CandleEntity() {
    }

    public CandleEntity(
            String symbol,
            LocalDateTime timestamp,
            double open,
            double high,
            double low,
            double close,
            long volume,
            String source
    ) {
        this.symbol = symbol;
        this.timestamp = timestamp;
        this.open = open;
        this.high = high;
        this.low = low;
        this.close = close;
        this.volume = volume;
        this.source = source;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getSymbol() {
        return symbol;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public double getOpen() {
        return open;
    }

    public double getHigh() {
        return high;
    }

    public double getLow() {
        return low;
    }

    public double getClose() {
        return close;
    }

    public long getVolume() {
        return volume;
    }

    public String getSource() {
        return source;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}