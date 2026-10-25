package io.skyroute.api.model.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SniperQuote(
        BigDecimal price,
        String currency,
        LocalDate date,
        String offerId
) {}
