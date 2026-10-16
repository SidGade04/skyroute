package io.skyroute.api.controller;

import io.skyroute.api.model.dto.request.FlightSearchRequest;
import io.skyroute.api.model.dto.response.FlightSearchResponse;
import io.skyroute.api.service.FlightSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/flights")
@CrossOrigin(origins = "*")
public class FlightController {

    private final FlightSearchService flightSearchService;

    public FlightController(FlightSearchService flightSearchService) {
        this.flightSearchService = flightSearchService;
    }

    @PostMapping("/search")
    public ResponseEntity<List<FlightSearchResponse>> searchFlights(
            @RequestBody FlightSearchRequest request
    ) {
        List<FlightSearchResponse> results = flightSearchService.searchAndCalculate(request);
        return ResponseEntity.ok(results);
    }
}