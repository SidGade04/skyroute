package io.skyroute.api.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.skyroute.api.exception.ResourceNotFoundException;
import io.skyroute.api.model.dto.request.FlightSearchRequest;
import io.skyroute.api.model.dto.request.SniperCondition;
import io.skyroute.api.model.dto.request.SniperRequest;
import io.skyroute.api.model.dto.response.FlightSearchResponse;
import io.skyroute.api.model.dto.response.SniperQuote;
import io.skyroute.api.model.dto.response.SniperResponse;
import io.skyroute.api.model.entity.SniperEntity;
import io.skyroute.api.model.entity.SniperNotificationEntity;
import io.skyroute.api.model.entity.UserEntity;
import io.skyroute.api.repository.SniperNotificationRepository;
import io.skyroute.api.repository.SniperRepository;
import io.skyroute.api.repository.UserRepository;
import io.skyroute.api.security.SupabaseClaims;

@Service
public class SniperService {

    private static final Logger log = LoggerFactory.getLogger(SniperService.class);
    private static final int MAX_DAYS = 14;
    private static final int MAX_ARMED = 5;
    // ponytail: one API process, no row lock. Cap is 20 route-windows per tick; upgrade is SKIP LOCKED.
    private static final int MAX_GROUPS = 20;
    private static final Set<String> STATUSES = Set.of(
            SniperEntity.ARMED, SniperEntity.TRIGGERED, SniperEntity.DISARMED, SniperEntity.EXPIRED);

    private final SniperRepository snipers;
    private final SniperNotificationRepository notifications;
    private final UserRepository users;
    private final FlightSearchService flights;
    private final FxService fx;
    private final SniperMailer mailer;
    private final ObjectMapper mapper;
    private final TransactionTemplate tx;

    public SniperService(
            SniperRepository snipers,
            SniperNotificationRepository notifications,
            UserRepository users,
            FlightSearchService flights,
            FxService fx,
            SniperMailer mailer,
            ObjectMapper mapper,
            PlatformTransactionManager transactions
    ) {
        this.snipers = snipers;
        this.notifications = notifications;
        this.users = users;
        this.flights = flights;
        this.fx = fx;
        this.mailer = mailer;
        this.mapper = mapper;
        this.tx = new TransactionTemplate(transactions);
    }

    public SniperQuote quote(SniperRequest request) {
        Route route = route(request);
        return cheapest(route);
    }

    public SniperResponse arm(Jwt jwt, SniperRequest request) {
        Route route = route(request);
        UUID userId = SupabaseClaims.id(jwt);
        UserEntity user = users.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (snipers.countByUserIdAndStatus(userId, SniperEntity.ARMED) >= MAX_ARMED) {
            throw new IllegalArgumentException("Five armed snipers is the cap");
        }
        String mode = mode(request.matchMode());
        SniperQuote quote = cheapest(route);
        SniperEvaluator.assertArmable(request.conditions(), mode, quote.price());
        SniperEntity saved = snipers.save(new SniperEntity(
                UUID.randomUUID(),
                userId,
                route.origin(),
                route.destination(),
                route.start(),
                route.end(),
                route.currency(),
                mode,
                write(request.conditions()),
                quote.price(),
                quote.date()
        ));
        mail(() -> mailer.sendArmed(saved, user, request.conditions()));
        return toResponse(saved);
    }

    public List<SniperResponse> list(Jwt jwt, String status) {
        UUID userId = SupabaseClaims.id(jwt);
        List<SniperEntity> rows;
        if (status == null || status.isBlank()) {
            rows = snipers.findByUserIdOrderByArmedAtDesc(userId);
        } else {
            String normalized = status.trim().toUpperCase();
            if (!STATUSES.contains(normalized)) throw new IllegalArgumentException("Unknown status");
            rows = snipers.findByUserIdAndStatusOrderByArmedAtDesc(userId, normalized);
        }
        return rows.stream().map(this::toResponse).toList();
    }

    public SniperResponse get(Jwt jwt, UUID id) {
        return toResponse(owned(jwt, id));
    }

    public SniperResponse disarm(Jwt jwt, UUID id) {
        SniperEntity sniper = owned(jwt, id);
        sniper.disarm();
        SniperEntity saved = snipers.save(sniper);
        users.findById(saved.getUserId()).ifPresent(user -> mail(() -> mailer.sendDisarmed(saved, user)));
        return toResponse(saved);
    }

    public void delete(Jwt jwt, UUID id) {
        SniperEntity sniper = owned(jwt, id);
        if (!SniperEntity.DISARMED.equals(sniper.getStatus())) {
            throw new IllegalArgumentException("Sniper is not disarmed");
        }
        tx.executeWithoutResult(s -> {
            notifications.deleteBySniperId(id);
            snipers.deleteById(id);
        });
    }

    public SniperResponse rearm(Jwt jwt, UUID id, SniperRequest request) {
        SniperEntity existing = owned(jwt, id);
        if (!SniperEntity.TRIGGERED.equals(existing.getStatus()) && !SniperEntity.DISARMED.equals(existing.getStatus())) {
            throw new IllegalArgumentException("Sniper cannot be rearmed");
        }
        if (existing.getWindowEnd().isBefore(LocalDate.now(ZoneOffset.UTC))) {
            throw new IllegalArgumentException("Window has expired");
        }
        if (snipers.countByUserIdAndStatus(existing.getUserId(), SniperEntity.ARMED) >= MAX_ARMED) {
            throw new IllegalArgumentException("Five armed snipers is the cap");
        }
        List<SniperCondition> conditions = request != null && request.conditions() != null
                ? request.conditions()
                : read(existing.getConditions());
        String mode = request != null && request.matchMode() != null && !request.matchMode().isBlank()
                ? mode(request.matchMode())
                : existing.getMatchMode();
        SniperQuote quote = cheapest(new Route(
                existing.getOrigin(), existing.getDestination(), existing.getWindowStart(), existing.getWindowEnd(), existing.getCurrency()));
        SniperEvaluator.assertArmable(conditions, mode, quote.price());
        String json = write(conditions);
        tx.executeWithoutResult(s -> {
            SniperEntity row = snipers.findById(existing.getId()).orElseThrow();
            row.rearm(quote.price(), quote.date(), json, mode);
            snipers.save(row);
            notifications.deleteBySniperId(row.getId());
        });
        SniperEntity saved = snipers.findById(existing.getId()).orElseThrow();
        users.findById(saved.getUserId()).ifPresent(user -> mail(() -> mailer.sendArmed(saved, user, conditions)));
        return toResponse(saved);
    }

    public void poll() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        tx.executeWithoutResult(s -> {
            for (SniperEntity sniper : snipers.findByStatus(SniperEntity.ARMED)) {
                if (sniper.getWindowEnd().isBefore(today)) {
                    sniper.expire();
                    snipers.save(sniper);
                }
            }
        });

        Map<String, List<SniperEntity>> groups = new LinkedHashMap<>();
        snipers.findByStatus(SniperEntity.ARMED).stream()
                .sorted(Comparator.comparing(SniperEntity::getLastPolledAt, Comparator.nullsFirst(Comparator.naturalOrder())))
                .forEach(sniper -> groups.computeIfAbsent(groupKey(sniper), key -> new ArrayList<>()).add(sniper));

        int seen = 0;
        for (List<SniperEntity> group : groups.values()) {
            if (seen++ >= MAX_GROUPS) break;
            SniperEntity first = group.get(0);
            try {
                SniperQuote quote = cheapest(new Route(
                        first.getOrigin(), first.getDestination(), first.getWindowStart(), first.getWindowEnd(), first.getCurrency()));
                for (SniperEntity sniper : group) apply(sniper.getId(), quote);
            } catch (RuntimeException e) {
                log.warn("sniper poll {}-{} failed: {}", first.getOrigin(), first.getDestination(), e.getMessage());
                for (SniperEntity sniper : group) noteError(sniper.getId(), e.getMessage());
            }
        }
        flushMail();
    }

    private void apply(UUID id, SniperQuote quote) {
        tx.executeWithoutResult(s -> {
            SniperEntity sniper = snipers.findById(id).orElse(null);
            if (sniper == null || !SniperEntity.ARMED.equals(sniper.getStatus())) return;
            boolean drop = quote.price().compareTo(sniper.getSnapshotPrice()) < 0
                    && SniperEvaluator.matches(read(sniper.getConditions()), sniper.getMatchMode(), quote.price(), sniper.getSnapshotPrice());
            if (drop) {
                sniper.trigger(quote.price(), quote.offerId(), quote.date());
                snipers.save(sniper);
                if (!notifications.existsBySniperId(id)) {
                    notifications.save(new SniperNotificationEntity(UUID.randomUUID(), id, sniper.getUserId()));
                }
            } else {
                sniper.markPolled(quote.price(), quote.offerId(), quote.date(), null);
                snipers.save(sniper);
            }
        });
    }

    private void noteError(UUID id, String message) {
        String error = message == null ? "poll failed" : message.substring(0, Math.min(message.length(), 500));
        tx.executeWithoutResult(s -> snipers.findById(id).ifPresent(sniper -> {
            if (SniperEntity.ARMED.equals(sniper.getStatus())) {
                sniper.markPolled(sniper.getLastPrice(), sniper.getLastOfferId(), null, error);
                snipers.save(sniper);
            }
        }));
    }

    private void mail(Runnable send) {
        if (!mailer.configured()) {
            log.info("sniper mail skipped, sniper.mail.resend-key is empty");
            return;
        }
        try {
            send.run();
        } catch (RuntimeException e) {
            log.warn("sniper mail failed: {}", e.getMessage());
        }
    }

    private void flushMail() {
        if (!mailer.configured()) {
            if (!notifications.findBySentAtIsNull().isEmpty()) {
                log.info("sniper mail waiting on sniper.mail.resend-key");
            }
            return;
        }
        for (SniperNotificationEntity notice : notifications.findBySentAtIsNull()) {
            try {
                SniperEntity sniper = snipers.findById(notice.getSniperId()).orElseThrow();
                UserEntity user = users.findById(notice.getUserId()).orElseThrow();
                mailer.sendHit(sniper, user, read(sniper.getConditions()));
                tx.executeWithoutResult(s -> notifications.findById(notice.getId()).ifPresent(row -> row.sent()));
            } catch (RuntimeException e) {
                log.warn("sniper mail {} failed: {}", notice.getSniperId(), e.getMessage());
                String error = e.getMessage() == null ? "mail failed" : e.getMessage().substring(0, Math.min(e.getMessage().length(), 500));
                tx.executeWithoutResult(s -> notifications.findById(notice.getId()).ifPresent(row -> row.fail(error)));
            }
        }
    }

    private SniperQuote cheapest(Route route) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate from = route.start().isBefore(today) ? today : route.start();
        if (from.isAfter(route.end())) throw new IllegalArgumentException("Window has expired");

        BigDecimal best = null;
        LocalDate bestDate = null;
        String offerId = null;
        for (LocalDate day = from; !day.isAfter(route.end()); day = day.plusDays(1)) {
            List<FlightSearchResponse> offers = flights.searchAndCalculate(new FlightSearchRequest(
                    route.origin(), route.destination(), day.toString(), null, 1, 0, 0, List.of(), "economy", null, null, null));
            for (FlightSearchResponse offer : offers) {
                if (offer.totalPrice() == null || offer.currency() == null) continue;
                BigDecimal price = fx.convert(offer.totalPrice(), offer.currency(), route.currency());
                if (best == null || price.compareTo(best) < 0) {
                    best = price;
                    bestDate = day;
                    offerId = offer.offerId();
                }
            }
        }
        if (best == null) throw new IllegalArgumentException("No fares in that window");
        return new SniperQuote(best, route.currency(), bestDate, offerId);
    }

    private Route route(SniperRequest request) {
        if (request == null) throw new IllegalArgumentException("Missing body");
        String origin = iata(request.origin(), "Origin");
        String destination = iata(request.destination(), "Destination");
        if (origin.equals(destination)) throw new IllegalArgumentException("Origin and destination are the same");
        if (request.windowStart() == null || request.windowEnd() == null) {
            throw new IllegalArgumentException("Window is required");
        }
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        if (request.windowStart().isBefore(today)) throw new IllegalArgumentException("Window starts today or later");
        if (request.windowEnd().isBefore(request.windowStart())) {
            throw new IllegalArgumentException("Window end is before the start");
        }
        if (ChronoUnit.DAYS.between(request.windowStart(), request.windowEnd()) > MAX_DAYS - 1) {
            throw new IllegalArgumentException("Window is 14 days max");
        }
        String currency = request.currency() == null ? "" : request.currency().trim().toUpperCase();
        if (!currency.matches("[A-Z]{3}")) throw new IllegalArgumentException("Currency is a 3-letter code");
        fx.requireCurrency(currency);
        return new Route(origin, destination, request.windowStart(), request.windowEnd(), currency);
    }

    private SniperEntity owned(Jwt jwt, UUID id) {
        return snipers.findByIdAndUserId(id, SupabaseClaims.id(jwt))
                .orElseThrow(() -> new ResourceNotFoundException("Sniper not found"));
    }

    private SniperResponse toResponse(SniperEntity sniper) {
        return new SniperResponse(
                sniper.getId(),
                sniper.getOrigin(),
                sniper.getDestination(),
                sniper.getWindowStart(),
                sniper.getWindowEnd(),
                sniper.getCurrency(),
                sniper.getMatchMode(),
                read(sniper.getConditions()),
                sniper.getSnapshotPrice(),
                sniper.getSnapshotDate(),
                sniper.getStatus(),
                sniper.getLastPrice(),
                sniper.getTriggeredPrice(),
                sniper.getCheapestDate(),
                sniper.getArmedAt(),
                sniper.getTriggeredAt()
        );
    }

    private List<SniperCondition> read(String json) {
        try {
            return mapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Stored sniper conditions are unreadable");
        }
    }

    private String write(List<SniperCondition> conditions) {
        try {
            return mapper.writeValueAsString(conditions);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Conditions are not valid");
        }
    }

    private static String groupKey(SniperEntity sniper) {
        return sniper.getOrigin() + "|" + sniper.getDestination() + "|"
                + sniper.getWindowStart() + "|" + sniper.getWindowEnd() + "|" + sniper.getCurrency();
    }

    private static String mode(String raw) {
        if (raw == null || raw.isBlank()) return "ANY";
        return raw.trim().toUpperCase();
    }

    private static String iata(String raw, String label) {
        if (raw == null) throw new IllegalArgumentException(label + " is a 3-letter IATA code");
        String code = raw.trim().toUpperCase();
        if (!code.matches("[A-Z]{3}")) throw new IllegalArgumentException(label + " is a 3-letter IATA code");
        return code;
    }

    private record Route(String origin, String destination, LocalDate start, LocalDate end, String currency) {}
}
