package io.skyroute.api.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.Semaphore;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import io.skyroute.api.exception.DuffelApiException;
import io.skyroute.api.model.dto.FxRatesDTO;
import io.skyroute.api.model.dto.request.DuffelOfferRequest;
import io.skyroute.api.model.dto.request.RendezvousRequest;
import io.skyroute.api.model.dto.response.DuffelRawResponse;
import io.skyroute.api.model.dto.response.RendezvousResponse;
import io.skyroute.api.model.entity.AirportEntity;
import io.skyroute.api.repository.AirportRepository;
import io.skyroute.api.service.RendezvousRanker.Candidate;
import io.skyroute.api.service.RendezvousRanker.Geo;
import io.skyroute.api.service.RendezvousRanker.LegQuote;

@Service
public class RendezvousService {

    private static final Logger log = LoggerFactory.getLogger(RendezvousService.class);
    private static final Set<String> CABINS = Set.of("economy", "premium_economy", "business", "first");
    // ponytail: 8 in-flight Duffel calls; virtual threads wait on the semaphore
    private static final int DUFFEL_PARALLELISM = 8;

    private final DuffelClientService duffelClient;
    private final AirportRepository airports;
    private final FxService fxService;

    public RendezvousService(DuffelClientService duffelClient, AirportRepository airports, FxService fxService) {
        this.duffelClient = duffelClient;
        this.airports = airports;
        this.fxService = fxService;
    }

    public RendezvousResponse search(RendezvousRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("body is required");
        }
        LocalDate departure = parseDate(request.departureDate(), "departureDate");
        if (departure.isBefore(LocalDate.now(ZoneOffset.UTC))) {
            throw new IllegalArgumentException("departureDate is in the past");
        }
        String returnDate = blankToNull(request.returnDate());
        if (returnDate != null && parseDate(returnDate, "returnDate").isBefore(departure)) {
            throw new IllegalArgumentException("returnDate is before departureDate");
        }
        String cabin = cabin(request.cabinClass());
        List<OriginIn> origins = normalizeOrigins(request.origins());
        FxRatesDTO fx = fxService.getLatest();
        String currency = currency(request.currency(), fx);

        List<Geo> originGeos = origins.stream().map(OriginIn::geo).toList();
        List<Geo> pool = airports.findMajorHubs().stream()
                .map(a -> new Geo(a.getIata(), a.getCity(), a.getLat(), a.getLon()))
                .toList();
        List<Geo> hubs = RendezvousRanker.shortlist(originGeos, pool, RendezvousRanker.HUB_CAP);
        if (hubs.isEmpty()) {
            throw new IllegalArgumentException("No major hubs available for these origins");
        }

        String departureDate = departure.toString();
        log.info("rendezvous origins={} hubs={} calls={}", origins.size(), hubs.size(), hubs.size() * origins.size());
        List<LegOutcome> outcomes = fetchAll(origins, hubs, departureDate, returnDate, cabin, currency, fx);

        DuffelApiException firstDuffelError = null;
        int duffelFailedHubs = 0;
        List<Candidate> complete = new ArrayList<>();
        for (Geo hub : hubs) {
            LegQuote[] legs = new LegQuote[origins.size()];
            boolean duffelFailed = false;
            for (LegOutcome outcome : outcomes) {
                if (!outcome.hub().equals(hub.iata())) {
                    continue;
                }
                if (outcome.error() != null) {
                    duffelFailed = true;
                    if (firstDuffelError == null) {
                        firstDuffelError = outcome.error();
                    }
                } else if (outcome.quote() != null) {
                    legs[outcome.originIndex()] = outcome.quote();
                }
            }
            if (duffelFailed) {
                duffelFailedHubs++;
                continue;
            }
            boolean missing = false;
            for (LegQuote leg : legs) {
                if (leg == null) {
                    missing = true;
                    break;
                }
            }
            if (!missing) {
                complete.add(new Candidate(hub.iata(), hub.city(), List.of(legs)));
            }
        }
        if (complete.isEmpty() && duffelFailedHubs == hubs.size()) {
            throw firstDuffelError;
        }
        return new RendezvousResponse(currency, departureDate, returnDate, RendezvousRanker.rank(complete));
    }

    private List<LegOutcome> fetchAll(
            List<OriginIn> origins,
            List<Geo> hubs,
            String departureDate,
            String returnDate,
            String cabin,
            String currency,
            FxRatesDTO fx
    ) {
        Semaphore permits = new Semaphore(DUFFEL_PARALLELISM);
        List<Future<LegOutcome>> futures = new ArrayList<>();
        try (ExecutorService exec = Executors.newVirtualThreadPerTaskExecutor()) {
            for (Geo hub : hubs) {
                for (int i = 0; i < origins.size(); i++) {
                    OriginIn origin = origins.get(i);
                    int originIndex = i;
                    futures.add(exec.submit(() -> fetchLeg(origin, originIndex, hub, departureDate, returnDate, cabin, currency, fx, permits)));
                }
            }
        }
        List<LegOutcome> outcomes = new ArrayList<>(futures.size());
        for (Future<LegOutcome> future : futures) {
            try {
                outcomes.add(future.get());
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("rendezvous interrupted", ex);
            } catch (ExecutionException ex) {
                if (ex.getCause() instanceof RuntimeException runtime) {
                    throw runtime;
                }
                throw new IllegalStateException(ex.getCause());
            }
        }
        return outcomes;
    }

    private LegOutcome fetchLeg(
            OriginIn origin,
            int originIndex,
            Geo hub,
            String departureDate,
            String returnDate,
            String cabin,
            String currency,
            FxRatesDTO fx,
            Semaphore permits
    ) {
        try {
            permits.acquire();
            try {
                DuffelRawResponse response = duffelClient.fetchOffers(
                        payload(origin.iata(), hub.iata(), departureDate, returnDate, origin.travelers(), cabin));
                return new LegOutcome(hub.iata(), originIndex, cheapest(response, origin, currency, fx), null);
            } finally {
                permits.release();
            }
        } catch (DuffelApiException ex) {
            return new LegOutcome(hub.iata(), originIndex, null, ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("rendezvous interrupted", ex);
        }
    }

    private static DuffelOfferRequest payload(String origin, String hub, String departureDate, String returnDate, int travelers, String cabin) {
        List<DuffelOfferRequest.Slice> slices = new ArrayList<>();
        slices.add(new DuffelOfferRequest.Slice(origin, hub, departureDate));
        if (returnDate != null) {
            slices.add(new DuffelOfferRequest.Slice(hub, origin, returnDate));
        }
        List<DuffelOfferRequest.Passenger> passengers = new ArrayList<>();
        for (int i = 0; i < travelers; i++) {
            passengers.add(DuffelOfferRequest.Passenger.adult());
        }
        return new DuffelOfferRequest(new DuffelOfferRequest.Data(slices, passengers, cabin));
    }

    /** Party total is Duffel's total_amount. Do not multiply by travelers again. */
    private static LegQuote cheapest(DuffelRawResponse response, OriginIn origin, String currency, FxRatesDTO fx) {
        if (response == null || response.data() == null || response.data().offers() == null) {
            return null;
        }
        LegQuote best = null;
        for (DuffelRawResponse.Offer offer : response.data().offers()) {
            if (offer.totalAmount() == null || offer.totalCurrency() == null) {
                continue;
            }
            Integer minutes = outboundMinutes(offer);
            if (minutes == null) {
                continue;
            }
            BigDecimal party = RendezvousRanker.convert(offer.totalAmount(), offer.totalCurrency(), currency, fx.base(), fx.rates());
            if (party == null) {
                continue;
            }
            party = party.setScale(2, RoundingMode.HALF_UP);
            if (best == null || party.compareTo(best.partyCost()) < 0) {
                best = new LegQuote(origin.iata(), origin.travelers(), party, minutes, offer.id());
            }
        }
        return best;
    }

    private static Integer outboundMinutes(DuffelRawResponse.Offer offer) {
        if (offer.slices() == null || offer.slices().isEmpty()) {
            return null;
        }
        DuffelRawResponse.OfferSlice slice = offer.slices().get(0);
        List<String> segments = slice.segments() == null
                ? List.of()
                : slice.segments().stream().map(DuffelRawResponse.Segment::duration).toList();
        return RendezvousRanker.outboundMinutes(slice.duration(), segments);
    }

    private List<OriginIn> normalizeOrigins(List<RendezvousRequest.Origin> raw) {
        if (raw == null || raw.size() < 2 || raw.size() > 10) {
            throw new IllegalArgumentException("origins must contain 2 to 10 airports");
        }
        List<OriginIn> origins = new ArrayList<>();
        for (RendezvousRequest.Origin origin : raw) {
            if (origin == null) {
                throw new IllegalArgumentException("origin is required");
            }
            String iata = iata(origin.airport());
            if (origins.stream().anyMatch(o -> o.iata().equals(iata))) {
                throw new IllegalArgumentException("Duplicate airport " + iata);
            }
            if (origin.travelers() == null || origin.travelers() < 1 || origin.travelers() > 9) {
                throw new IllegalArgumentException("travelers must be 1 to 9");
            }
            AirportEntity airport = airports.findById(iata)
                    .orElseThrow(() -> new IllegalArgumentException("Unknown airport " + iata));
            origins.add(new OriginIn(iata, origin.travelers(), new Geo(iata, airport.getCity(), airport.getLat(), airport.getLon())));
        }
        return origins;
    }

    private static String iata(String raw) {
        if (raw == null) {
            throw new IllegalArgumentException("airport is required");
        }
        String code = raw.trim().toUpperCase(Locale.ROOT);
        if (!code.matches("[A-Z]{3}")) {
            throw new IllegalArgumentException("Invalid airport " + raw.trim());
        }
        return code;
    }

    private static LocalDate parseDate(String raw, String field) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
        try {
            return LocalDate.parse(raw.trim());
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(field + " must be yyyy-MM-dd");
        }
    }

    private static String cabin(String raw) {
        if (raw == null || raw.isBlank()) {
            return "economy";
        }
        String cabin = raw.trim().toLowerCase(Locale.ROOT);
        if (!CABINS.contains(cabin)) {
            throw new IllegalArgumentException("Invalid cabinClass");
        }
        return cabin;
    }

    private static String currency(String raw, FxRatesDTO fx) {
        String currency = raw == null || raw.isBlank() ? "USD" : raw.trim().toUpperCase(Locale.ROOT);
        if (!currency.matches("[A-Z]{3}")) {
            throw new IllegalArgumentException("Invalid currency");
        }
        boolean known = currency.equals(fx.base()) || (fx.rates() != null && fx.rates().containsKey(currency));
        if (!known) {
            throw new IllegalArgumentException("Unsupported currency " + currency);
        }
        return currency;
    }

    private static String blankToNull(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return raw.trim();
    }

    private record OriginIn(String iata, int travelers, Geo geo) {}

    private record LegOutcome(String hub, int originIndex, LegQuote quote, DuffelApiException error) {}
}
