package io.skyroute.api.service;

import io.skyroute.api.model.dto.request.DuffelOfferRequest;
import io.skyroute.api.model.dto.request.FlightSearchRequest;
import io.skyroute.api.model.dto.response.DuffelRawResponse;
import io.skyroute.api.model.dto.response.FlightSearchResponse;
import io.skyroute.api.model.dto.response.FlightSearchResponse.FlightSliceDTO;
import io.skyroute.api.model.dto.response.FlightSearchResponse.PriceBreakdown;
import io.skyroute.api.model.dto.response.FlightSearchResponse.SegmentDTO;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class FlightSearchService {

    // ponytail: fixed ages until UI collects DOB; airlines bracket from these
    private static final int DEFAULT_CHILD_AGE = 7;
    private static final int DEFAULT_INFANT_AGE = 1;
    private static final double FALLBACK_BAG_FEE = 35.0;
    private static final double FALLBACK_INCLUDED_KG = 23.0;
    private static final double OVERWEIGHT_PER_KG = 10.0;

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

        int adults = Math.max(1, request.adults());
        int children = request.children() == null ? 0 : Math.max(0, request.children());
        int infants = request.infants() == null ? 0 : Math.max(0, Math.min(request.infants(), adults));

        List<DuffelOfferRequest.Passenger> passengers = new ArrayList<>();
        for (int i = 0; i < adults; i++) {
            passengers.add(DuffelOfferRequest.Passenger.adult());
        }
        for (int i = 0; i < children; i++) {
            passengers.add(DuffelOfferRequest.Passenger.aged(DEFAULT_CHILD_AGE));
        }
        for (int i = 0; i < infants; i++) {
            // age 1 → airline applies lap-infant / infant bracket (not a guessed fee)
            passengers.add(DuffelOfferRequest.Passenger.aged(DEFAULT_INFANT_AGE));
        }

        String cabinClass = request.cabinClass() == null || request.cabinClass().isBlank()
                ? "economy"
                : request.cabinClass();

        return new DuffelOfferRequest(
            new DuffelOfferRequest.Data(slices, passengers, cabinClass)
        );
    }

    private FlightSearchResponse mapToFlightSearchResponse(DuffelRawResponse.Offer offer, FlightSearchRequest request) {
        BigDecimal fare = offer.baseAmount() != null ? offer.baseAmount() : BigDecimal.ZERO;
        BigDecimal taxes = offer.taxAmount() != null ? offer.taxAmount() : BigDecimal.ZERO;
        BigDecimal offerTotal = offer.totalAmount() != null ? offer.totalAmount() : fare.add(taxes);
        String currency = offer.totalCurrency();

        int adults = Math.max(1, request.adults());
        int children = request.children() == null ? 0 : Math.max(0, request.children());
        int infants = request.infants() == null ? 0 : Math.max(0, Math.min(request.infants(), adults));
        int payingPax = adults + children;

        BagFeeResult bagFees = calculateBaggageFees(
                offer,
                request.bags(),
                request.cabinClass(),
                payingPax
        );

        boolean roundTrip = request.returnDate() != null && !request.returnDate().isBlank();
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
                        slice.duration(),
                        slice.segments().stream().map(s -> new SegmentDTO(
                            s.origin() != null ? s.origin().iataCode() : null,
                            s.destination() != null ? s.destination().iataCode() : null,
                            s.departingAt(),
                            s.arrivingAt(),
                            s.duration(),
                            s.marketingCarrier() != null && s.marketingCarrierFlightNumber() != null
                                ? s.marketingCarrier().iataCode() + s.marketingCarrierFlightNumber()
                                : null,
                            s.operatingCarrier() != null ? s.operatingCarrier().name() : null,
                            s.aircraft() != null ? s.aircraft().name() : null
                        )).toList()
                    );
                })
                .limit(roundTrip ? Long.MAX_VALUE : 1)
                .toList();

        // Offer total is for all pax; Duffel does not expose per-pax amounts on search offers
        String infantNote = infants > 0
                ? "Infant priced by airline from age " + DEFAULT_INFANT_AGE + " (included in fare/taxes)"
                : null;
        if (children > 0) {
            String childNote = "Child priced by airline from age " + DEFAULT_CHILD_AGE + " (included in fare/taxes)";
            infantNote = infantNote == null ? childNote : childNote + ". " + infantNote;
        }

        BigDecimal total = offerTotal.add(bagFees.fee());
        PriceBreakdown breakdown = new PriceBreakdown(
                fare,
                taxes,
                bagFees.fee(),
                total,
                adults,
                children,
                infants,
                bagFees.includedBags(),
                bagFees.extraBags(),
                infantNote
        );

        return new FlightSearchResponse(
            offer.id(),
            offer.owner() != null ? offer.owner().name() : "Unknown Airline",
            offer.owner() != null ? offer.owner().logoSymbolUrl() : null,
            offerTotal,
            bagFees.fee(),
            total,
            currency,
            slices,
            breakdown
        );
    }

    private record BagFeeResult(BigDecimal fee, int includedBags, int extraBags) {}

    /**
     * bags[] = total checked bags the party is taking (not "extra only").
     * Charge piece fee only for bags beyond fare-included allowance; overweight on any bag.
     */
    private BagFeeResult calculateBaggageFees(
            DuffelRawResponse.Offer offer,
            List<Double> bags,
            String cabinClass,
            int payingPax
    ) {
        int includedBags = resolveIncludedCheckedBags(offer, cabinClass, payingPax);
        if (bags == null || bags.isEmpty()) {
            return new BagFeeResult(BigDecimal.ZERO, includedBags, 0);
        }

        BigDecimal unitFee = BigDecimal.valueOf(FALLBACK_BAG_FEE);
        double includedKg = includedWeightKg(cabinClass);

        if (offer.availableServices() != null) {
            var bagService = offer.availableServices().stream()
                    .filter(s -> "baggage".equalsIgnoreCase(s.type()))
                    .findFirst();
            if (bagService.isPresent()) {
                if (bagService.get().totalAmount() != null) {
                    unitFee = bagService.get().totalAmount();
                }
                Integer maxKg = bagService.get().maximumWeightKg();
                if (maxKg == null && bagService.get().metadata() != null) {
                    maxKg = bagService.get().metadata().maximumWeightKg();
                }
                if (maxKg != null && maxKg > 0) {
                    includedKg = maxKg.doubleValue();
                }
            }
        }

        BigDecimal total = BigDecimal.ZERO;
        int bagIndex = 0;
        for (Double weight : bags) {
            if (weight == null || weight <= 0) {
                continue;
            }
            boolean extra = bagIndex >= includedBags;
            if (extra) {
                total = total.add(unitFee);
            }
            double overweight = Math.max(0, weight - includedKg);
            if (overweight > 0) {
                total = total.add(BigDecimal.valueOf(overweight * OVERWEIGHT_PER_KG));
            }
            bagIndex++;
        }

        int extraBags = Math.max(0, bagIndex - includedBags);
        return new BagFeeResult(total, includedBags, extraBags);
    }

    /** Prefer Duffel passenger baggages; else cabin-class fallback × paying pax. */
    private int resolveIncludedCheckedBags(DuffelRawResponse.Offer offer, String cabinClass, int payingPax) {
        int fromOffer = 0;
        if (offer.passengers() != null) {
            for (var passenger : offer.passengers()) {
                if (passenger.baggages() == null) continue;
                for (var bag : passenger.baggages()) {
                    if ("checked".equalsIgnoreCase(bag.type()) && bag.quantity() != null) {
                        fromOffer += bag.quantity();
                    }
                }
            }
        }
        if (fromOffer > 0) {
            return fromOffer;
        }
        return cabinIncludedPerPax(cabinClass) * Math.max(1, payingPax);
    }

    private static int cabinIncludedPerPax(String cabinClass) {
        if (cabinClass == null) return 0;
        return switch (cabinClass.toLowerCase()) {
            case "first", "business" -> 2;
            case "premium_economy" -> 1;
            default -> 0;
        };
    }

    private static double includedWeightKg(String cabinClass) {
        if (cabinClass == null) return FALLBACK_INCLUDED_KG;
        return switch (cabinClass.toLowerCase()) {
            case "first", "business" -> 32.0;
            default -> FALLBACK_INCLUDED_KG;
        };
    }
}
