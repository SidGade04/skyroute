package io.skyroute.api.service;

import java.util.List;
import java.util.Optional;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import io.skyroute.api.model.dto.AirportDTO;
import io.skyroute.api.repository.AirportRepository;

@Service
public class AirportService {

    private final AirportRepository airportRepository;

    public AirportService(AirportRepository airportRepository) {
        this.airportRepository = airportRepository;
    }

    public List<AirportDTO> findAll() {
        return airportRepository.findAll().stream().map(AirportDTO::from).toList();
    }

    public List<AirportDTO> autocomplete(String q, int limit) {
        int n = Math.min(Math.max(limit, 1), 20);
        if (q == null || q.isBlank()) {
            return findPopular(n);
        }
        return airportRepository.autocomplete(q.trim(), PageRequest.of(0, n))
                .stream()
                .map(AirportDTO::from)
                .toList();
    }

    @Cacheable(value = "popularAirports", key = "#limit")
    public List<AirportDTO> findPopular(int limit) {
        // ArrayList — ImmutableCollections from toList() fails Redis deserialize
        return new java.util.ArrayList<>(
                airportRepository.findPopular(PageRequest.of(0, Math.min(Math.max(limit, 1), 20)))
                        .stream()
                        .map(AirportDTO::from)
                        .toList()
        );
    }

    public Optional<AirportDTO> findByIata(String iata) {
        return airportRepository.findById(iata.toUpperCase()).map(AirportDTO::from);
    }

    public List<AirportDTO> findMajorHubs() {
        return airportRepository.findMajorHubs().stream().map(AirportDTO::from).toList();
    }
}
