package io.skyroute.api.controller;

import io.skyroute.api.model.dto.request.FlightSearchRequest;
import io.skyroute.api.model.dto.request.RendezvousRequest;
import io.skyroute.api.model.dto.response.FlightSearchPage;
import io.skyroute.api.model.dto.response.FlightSearchResponse;
import io.skyroute.api.model.dto.response.RendezvousResponse;
import io.skyroute.api.service.FlightSearchService;
import io.skyroute.api.service.RendezvousService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/flights")
@CrossOrigin(origins = "*")
public class FlightController {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 10;

    private final FlightSearchService flightSearchService;
    private final RendezvousService rendezvousService;

    public FlightController(FlightSearchService flightSearchService, RendezvousService rendezvousService) {
        this.flightSearchService = flightSearchService;
        this.rendezvousService = rendezvousService;
    }

    @PostMapping("/search")
    public ResponseEntity<FlightSearchPage> searchFlights(
            @RequestBody FlightSearchRequest request
    ) {
        List<FlightSearchResponse> all = flightSearchService.searchAndCalculate(request);

        Map<String, FlightSearchPage.Airline> byName = new LinkedHashMap<>();
        all.forEach(o -> byName.putIfAbsent(o.airlineName(), new FlightSearchPage.Airline(o.airlineName(), o.airlineLogoUrl())));
        List<FlightSearchPage.Airline> airlines = byName.values().stream()
                .sorted(Comparator.comparing(FlightSearchPage.Airline::name))
                .toList();

        String airline = request.airline();
        List<FlightSearchResponse> results = airline == null || airline.isBlank()
                ? all
                : all.stream().filter(o -> airline.equals(o.airlineName())).toList();

        int page = request.page() != null ? Math.max(request.page(), 0) : DEFAULT_PAGE;
        int size = request.size() != null ? Math.max(request.size(), 1) : DEFAULT_SIZE;
        int totalElements = results.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        int from = Math.min(page * size, totalElements);
        int to = Math.min(from + size, totalElements);

        return ResponseEntity.ok(new FlightSearchPage(
                results.subList(from, to),
                page,
                size,
                totalElements,
                totalPages,
                airlines
        ));
    }

    @PostMapping("/rendezvous")
    public ResponseEntity<RendezvousResponse> rendezvous(@RequestBody RendezvousRequest request) {
        return ResponseEntity.ok(rendezvousService.search(request));
    }
}
