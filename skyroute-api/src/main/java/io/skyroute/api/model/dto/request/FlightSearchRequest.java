package io.skyroute.api.model.dto.request;

public record FlightSearchRequest(
    String origin,
    String destination,
    String departureDate,
    String returnDate,
    int adults,
    int baggageCount,
    double baggageWeightKg,
    String cabinClass 
) {}