package io.skyroute.api.model.dto.request;

import java.math.BigDecimal;

public record SniperCondition(
        String op,
        BigDecimal amount,
        BigDecimal min,
        BigDecimal max,
        Integer pct,
        String basis
) {}
