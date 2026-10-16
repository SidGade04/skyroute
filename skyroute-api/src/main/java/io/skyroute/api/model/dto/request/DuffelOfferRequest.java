package io.skyroute.api.model.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record DuffelOfferRequest(
    @JsonProperty("data") Data data
) {
    public record Data(
        List<Slice> slices,
        List<Passenger> passengers,
        @JsonProperty("cabin_class") String cabinClass
    ) {}

    public record Slice(
        String origin,
        String destination,
        @JsonProperty("departure_date") String departureDate
    ) {}

    public record Passenger(
        String type
    ) {}
}