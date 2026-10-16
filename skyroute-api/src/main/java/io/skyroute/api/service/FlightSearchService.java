package io.skyroute.api.service;

import io.skyroute.api.model.dto.request.DuffelOfferRequest;
import io.skyroute.api.model.dto.request.FlightSearchRequest;
import io.skyroute.api.model.dto.response.DuffelRawResponse;
import io.skyroute.api.model.dto.response.FlightSearchResponse;
import io.skyroute.api.model.dto.response.FlightSearchResponse.FlightSliceDTO;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class FlightSearchService {

    private final DuffelClientService duffelClient;

    public FlightSearchService(DuffelClientService duffelClient) {
        this.duffelClient = duffelClient;
    }

    public List<FlightSearchResponse> searchAndCalculate(FlightSearchRequest request) {
        DuffelOfferRequest payload = buildDuffelPayload(request);
        DuffelRawResponse response = duffelClient.fetchOffers(payload);

        if (response == null || response.data() == null || response.data().offers() == null) {
            return List.of();
        }

        return response.data().offers().stream()
                .map(offer -> mapToFlightSearchResponse(offer, request))
                .toList();
    }

    private DuffelOfferRequest buildDuffelPayload(FlightSearchRequest request) {
        List<DuffelOfferRequest.Slice> slices = new ArrayList<>();

        slices.add(new DuffelOfferRequest.Slice(
            request.origin(),
            request.destination(),
            request.departureDate()
        ));

        if (request.returnDate() != null && !request.returnDate().isBlank()) {
            slices.add(new DuffelOfferRequest.Slice(
                request.destination(),
                request.origin(),
                request.returnDate()
            ));
        }

        int adultCount = Math.max(1, request.adults());
        List<DuffelOfferRequest.Passenger> passengers = new ArrayList<>();
        for (int i = 0; i < adultCount; i++) {
            passengers.add(new DuffelOfferRequest.Passenger("adult"));
        }

        String cabinClass = request.cabinClass() == null || request.cabinClass().isBlank()
                ? "economy"
                : request.cabinClass();

        return new DuffelOfferRequest(
            new DuffelOfferRequest.Data(slices, passengers, cabinClass)
        );
    }

    private FlightSearchResponse mapToFlightSearchResponse(DuffelRawResponse.Offer offer, FlightSearchRequest request) {
        BigDecimal basePrice = offer.totalAmount();
        String currency = offer.totalCurrency();

        // Extra Baggage calculation logic
        BigDecimal calculatedBaggageFee = BigDecimal.ZERO;
        if (request.baggageCount() > 0 && offer.availableServices() != null) {
            var bagService = offer.availableServices().stream()
                    .filter(s -> "baggage".equalsIgnoreCase(s.type()))
                    .findFirst();

            if (bagService.isPresent()) {
                calculatedBaggageFee = bagService.get().totalAmount()
                        .multiply(BigDecimal.valueOf(request.baggageCount()));
            } else {
                calculatedBaggageFee = BigDecimal.valueOf(request.baggageCount() * 35.0);
            }
        }

        // Weight fee logic (e.g., $10/kg over 23kg standard limit)
        if (request.baggageWeightKg() > 23.0) {
            double overweightKg = request.baggageWeightKg() - 23.0;
            calculatedBaggageFee = calculatedBaggageFee.add(BigDecimal.valueOf(overweightKg * 10.0));
        }

        List<FlightSliceDTO> slices = offer.slices() == null ? List.of() : offer.slices().stream()
                .filter(slice -> slice.segments() != null && !slice.segments().isEmpty())
                .map(slice -> {
                    var firstSegment = slice.segments().get(0);
                    var lastSegment = slice.segments().get(slice.segments().size() - 1);
                    return new FlightSliceDTO(
                        slice.origin() != null ? slice.origin().iataCode() : null,
                        slice.destination() != null ? slice.destination().iataCode() : null,
                        firstSegment.departingAt(),
                        lastSegment.arrivingAt(),
                        slice.duration()
                    );
                }).toList();

        BigDecimal safeBase = basePrice != null ? basePrice : BigDecimal.ZERO;

        return new FlightSearchResponse(
            offer.id(),
            offer.owner() != null ? offer.owner().name() : "Unknown Airline",
            offer.owner() != null ? offer.owner().logoSymbolUrl() : null,
            safeBase,
            calculatedBaggageFee,
            safeBase.add(calculatedBaggageFee),
            currency,
            slices
        );
    }
}