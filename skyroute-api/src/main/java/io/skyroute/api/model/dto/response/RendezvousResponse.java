package io.skyroute.api.model.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record RendezvousResponse(
        String currency,
        String departureDate,
        String returnDate,
        List<Hub> hubs
) {
    public record Hub(
            String hub,
            String city,
            BigDecimal totalCost,
            BigDecimal variance,
            int avgDurationMinutes,
            List<Leg> perOrigin
    ) {}

    public record Leg(
            String origin,
            int travelers,
            BigDecimal cost,
            BigDecimal perPerson,
            int durationMinutes,
            String offerId
    ) {}
}
