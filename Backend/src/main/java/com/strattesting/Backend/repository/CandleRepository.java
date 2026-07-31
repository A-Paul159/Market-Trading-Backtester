package com.strattesting.Backend.repository;

import com.strattesting.Backend.entity.CandleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface CandleRepository extends JpaRepository<CandleEntity, Long> {

    List<CandleEntity> findBySymbolAndTimestampBetweenOrderByTimestampAsc(
            String symbol,
            LocalDateTime start,
            LocalDateTime end
    );

    boolean existsBySymbolAndTimestamp(String symbol, LocalDateTime timestamp);

    boolean existsBySymbolAndTimestampBetween(
            String symbol,
            LocalDateTime start,
            LocalDateTime end
    );
}