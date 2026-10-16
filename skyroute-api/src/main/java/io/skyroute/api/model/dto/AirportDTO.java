package io.skyroute.api.model.dto;

import io.skyroute.api.model.entity.AirportEntity;

public record AirportDTO(
    String iata,
    String city,
    String name,
    String country
) {
    public static AirportDTO from(AirportEntity e) {
        return new AirportDTO(e.getIata(), e.getCity(), e.getName(), e.getCountry());
    }
}
