package io.skyroute.api.model.dto.request;

import java.util.List;

public record RendezvousRequest(
        List<Origin> origins,
        String departureDate,
        String returnDate,
        String cabinClass,
        String currency
) {
    public record Origin(String airport, Integer travelers) {}
}
