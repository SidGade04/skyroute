package io.skyroute.api.controller;

import io.skyroute.api.model.dto.request.FlightSearchRequest;
import io.skyroute.api.model.dto.response.FlightSearchResponse;
import io.skyroute.api.model.dto.response.PaginatedResponse;
import io.skyroute.api.service.FlightSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/flights")
@CrossOrigin(origins = "*")
public class FlightController {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 10;

    private final FlightSearchService flightSearchService;

    public FlightController(FlightSearchService flightSearchService) {
        this.flightSearchService = flightSearchService;
    }

    @PostMapping("/search")
    public ResponseEntity<PaginatedResponse<FlightSearchResponse>> searchFlights(
            @RequestBody FlightSearchRequest request
    ) {
        List<FlightSearchResponse> results = flightSearchService.searchAndCalculate(request);

        int page = request.page() != null ? Math.max(request.page(), 0) : DEFAULT_PAGE;
        int size = request.size() != null ? Math.max(request.size(), 1) : DEFAULT_SIZE;
        int totalElements = results.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        int from = Math.min(page * size, totalElements);
        int to = Math.min(from + size, totalElements);

        return ResponseEntity.ok(new PaginatedResponse<>(
                results.subList(from, to),
                page,
                size,
                totalElements,
                totalPages
        ));
    }
}
