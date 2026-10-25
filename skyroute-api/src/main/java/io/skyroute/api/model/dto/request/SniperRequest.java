package io.skyroute.api.model.dto.request;

import java.time.LocalDate;
import java.util.List;

public record SniperRequest(
        String origin,
        String destination,
        LocalDate windowStart,
        LocalDate windowEnd,
        String currency,
        String matchMode,
        List<SniperCondition> conditions
) {}
