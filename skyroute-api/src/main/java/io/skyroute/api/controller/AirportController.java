package io.skyroute.api.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.skyroute.api.exception.ResourceNotFoundException;
import io.skyroute.api.model.dto.AirportDTO;
import io.skyroute.api.service.AirportService;

@RestController
@RequestMapping("/api/v1/airports")
public class AirportController {

    private final AirportService airportService;

    public AirportController(AirportService airportService) {
        this.airportService = airportService;
    }

    @GetMapping
    public List<AirportDTO> all() {
        return airportService.findAll();
    }

    @GetMapping("/autocomplete")
    public List<AirportDTO> autocomplete(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(defaultValue = "10") int limit) {
        return airportService.autocomplete(q, limit);
    }

    @GetMapping("/popular")
    public List<AirportDTO> popular(@RequestParam(defaultValue = "10") int limit) {
        return airportService.findPopular(limit);
    }

    @GetMapping("/hubs")
    public List<AirportDTO> majorHubs() {
        return airportService.findMajorHubs();
    }

    @GetMapping("/{iata:[A-Za-z]{3}}")
    public AirportDTO byIata(@PathVariable String iata) {
        return airportService.findByIata(iata)
                .orElseThrow(() -> new ResourceNotFoundException("Airport not found: " + iata));
    }
}
