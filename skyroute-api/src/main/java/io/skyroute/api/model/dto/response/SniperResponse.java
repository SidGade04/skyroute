package io.skyroute.api.model.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import io.skyroute.api.model.dto.request.SniperCondition;

public record SniperResponse(
        UUID id,
        String origin,
        String destination,
        LocalDate windowStart,
        LocalDate windowEnd,
        String currency,
        String matchMode,
        List<SniperCondition> conditions,
        BigDecimal snapshotPrice,
        LocalDate snapshotDate,
        String status,
        BigDecimal lastPrice,
        BigDecimal triggeredPrice,
        LocalDate cheapestDate,
        Instant armedAt,
        Instant triggeredAt
) {}
