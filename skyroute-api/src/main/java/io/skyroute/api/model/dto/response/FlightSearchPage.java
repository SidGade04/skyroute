package io.skyroute.api.model.dto.response;

import java.util.List;

public record FlightSearchPage(
    List<FlightSearchResponse> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    /** Airlines across all offers (pre-filter), for the airline dropdown */
    List<Airline> airlines
) {
    public record Airline(String name, String logoUrl) {}
}
