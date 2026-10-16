package io.skyroute.api.model.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
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

    /** Duffel: pass type OR age, never both. Under-18 → age; adults → type. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Passenger(
        String type,
        Integer age
    ) {
        public static Passenger adult() {
            return new Passenger("adult", null);
        }

        public static Passenger aged(int age) {
            return new Passenger(null, age);
        }
    }
}
