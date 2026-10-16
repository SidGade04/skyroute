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
    List<FlightSliceDTO> slices
) {
    public record FlightSliceDTO(
        String originCode,
        String destinationCode,
        String departureTime,
        String arrivalTime,
        String duration
    ) {}
}