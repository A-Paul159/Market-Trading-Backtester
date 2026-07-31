# Strat Testing App

Strat Testing App is a full-stack trading simulator built to test trading ideas with interactive charts, historical candle data, simulated trade execution, trade logs, fees, and risk-management tools.

This project is designed as a portfolio/resume project and is not connected to a real brokerage account. All trades are simulated.

---

## Features

### Interactive Trading Chart

- Candlestick chart using Lightweight Charts
- Delayed-live chart mode
- Multiple symbols supported through Yahoo Finance data
- Multiple timeframes
- Infinite historical scrolling
- Chart trade markers for Buy, Sell, and Flatten executions
- Average entry price line
- Draggable stop loss and take profit lines

### Simulated Trading

- Buy simulated contracts
- Sell simulated contracts
- Flatten open positions
- Select order quantity
- Supports long and short simulated positions
- Tracks average entry price
- Tracks open P/L
- Tracks closed P/L
- Tracks account balance and equity
- Applies simulated fees/commissions per trade

### Risk Management Tools

- Average entry line appears after entering a trade
- Green average line for long positions
- Red average line for short positions
- Stop loss line
- Take profit line
- Draggable SL/TP handles
- SL/TP levels visually update on the chart

### Trade Logging

- Logs every simulated execution
- Records symbol
- Records trade side
- Records quantity
- Records fill price
- Records position after trade
- Records fees
- Records gross realized P/L
- Records net realized P/L
- Trade log is accessible from the Metrics view

### Backend Data System

- Spring Boot backend
- Yahoo Finance candle data fetching
- PostgreSQL candle storage
- Missing-range detection
- Stores candles locally to reduce repeated data fetching
- Flyway migration support

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Lightweight Charts
- Axios
- CSS

### Backend

- Java 17
- Spring Boot
- Maven
- Spring Data JPA
- PostgreSQL
- Flyway
- Yahoo Finance data fetching

### Database

- PostgreSQL

---

## Project Structure

```text
Strat_Testing_App/
├── Backend/
│   ├── src/
│   ├── pom.xml
│   ├── mvnw
│   └── mvnw.cmd
│
├── Frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── README.md
└── .gitignore