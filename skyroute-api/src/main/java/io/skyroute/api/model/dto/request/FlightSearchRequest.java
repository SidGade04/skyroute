package io.skyroute.api.model.dto.request;

import java.util.List;

public record FlightSearchRequest(
    String origin,
    String destination,
    String departureDate,
    String returnDate,
    int adults,
    Integer children,
    Integer infants,
    /** Each entry = one checked bag's weight in kg */
    List<Double> bags,
    String cabinClass,
    Integer page,
    Integer size,
    /** Owner airline name; null/blank = all */
    String airline
) {}
