package io.skyroute.api.model.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record FlightSearchResponse(
    String offerId,
    String airlineName,
    String airlineLogoUrl,
    BigDecimal basePrice,
    BigDecimal baggageFees,
    BigDecimal totalPrice,
    String currency,
    List<FlightSliceDTO> slices,
    PriceBreakdown breakdown
) {
    public record FlightSliceDTO(
        String originCode,
        String destinationCode,
        String departureTime,
        String arrivalTime,
        String duration
    ) {}

    public record PriceBreakdown(
        BigDecimal fare,
        BigDecimal taxes,
        BigDecimal baggageFees,
        BigDecimal total,
        int adults,
        int children,
        int infants,
        int includedBags,
        int extraBags,
        String infantNote
    ) {}
}
