package io.skyroute.api.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import io.skyroute.api.model.dto.response.RendezvousResponse.Hub;
import io.skyroute.api.model.dto.response.RendezvousResponse.Leg;

public final class RendezvousRanker {

    // ponytail: cap 8; upgrade path is a priced second pass, not searching every airport
    public static final int HUB_CAP = 8;
    private static final double EARTH_KM = 6371.0;
    private static final Pattern ISO_DURATION = Pattern.compile("^P(?:(\\d+)D)?(?:T(?:(\\d+)H)?(?:(\\d+)M)?)?$");

    private RendezvousRanker() {}

    public record Geo(String iata, String city, double lat, double lon) {}

    public record LegQuote(String origin, int travelers, BigDecimal partyCost, int durationMinutes, String offerId) {}

    public record Candidate(String hub, String city, List<LegQuote> legs) {}

    public static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * EARTH_KM * Math.asin(Math.sqrt(a));
    }

    public static List<Geo> shortlist(List<Geo> origins, List<Geo> hubs, int cap) {
        return hubs.stream()
                .filter(hub -> origins.stream().noneMatch(o -> o.iata().equals(hub.iata())))
                .sorted(Comparator
                        .comparingDouble((Geo hub) -> origins.stream()
                                .mapToDouble(o -> haversineKm(o.lat(), o.lon(), hub.lat(), hub.lon()))
                                .sum())
                        .thenComparing(Geo::iata))
                .limit(cap)
                .toList();
    }

    /** Duffel slice duration. Null when the string is missing or not ISO-8601. */
    public static Integer parseIsoDuration(String iso) {
        if (iso == null) {
            return null;
        }
        Matcher m = ISO_DURATION.matcher(iso);
        if (!m.matches() || (m.group(1) == null && m.group(2) == null && m.group(3) == null)) {
            return null;
        }
        int days = m.group(1) == null ? 0 : Integer.parseInt(m.group(1));
        int hours = m.group(2) == null ? 0 : Integer.parseInt(m.group(2));
        int minutes = m.group(3) == null ? 0 : Integer.parseInt(m.group(3));
        return (days * 24 + hours) * 60 + minutes;
    }

    public static Integer outboundMinutes(String sliceDuration, List<String> segmentDurations) {
        Integer slice = parseIsoDuration(sliceDuration);
        if (slice != null) {
            return slice;
        }
        if (segmentDurations == null || segmentDurations.isEmpty()) {
            return null;
        }
        int sum = 0;
        for (String segment : segmentDurations) {
            Integer minutes = parseIsoDuration(segment);
            if (minutes == null) {
                return null;
            }
            sum += minutes;
        }
        return sum;
    }

    /**
     * Rates are quoted against {@code base}. Returns null when a needed rate is missing.
     * Divide uses scale 8; caller rounds the party cost to cents.
     */
    public static BigDecimal convert(BigDecimal amount, String from, String to, String base, Map<String, BigDecimal> rates) {
        if (amount == null || from == null || to == null || base == null) {
            return null;
        }
        if (from.equals(to)) {
            return amount;
        }
        BigDecimal inBase = from.equals(base) ? amount : divideByRate(amount, rates, from);
        if (inBase == null) {
            return null;
        }
        if (to.equals(base)) {
            return inBase;
        }
        BigDecimal rate = rates == null ? null : rates.get(to);
        return rate == null ? null : inBase.multiply(rate);
    }

    // ponytail: double stddev, scale 2. Upgrade path is BigDecimal if sigma must be exact cents.
    public static BigDecimal populationStddev(List<BigDecimal> values) {
        int n = values.size();
        double mean = values.stream().mapToDouble(BigDecimal::doubleValue).average().orElse(0);
        double sumSq = 0;
        for (BigDecimal value : values) {
            double d = value.doubleValue() - mean;
            sumSq += d * d;
        }
        return BigDecimal.valueOf(Math.sqrt(sumSq / n)).setScale(2, RoundingMode.HALF_UP);
    }

    /** Drops a hub with any missing leg. Sorted by total party cost, then IATA. */
    public static List<Hub> rank(List<Candidate> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return List.of();
        }
        List<Hub> hubs = new ArrayList<>();
        for (Candidate candidate : candidates) {
            Hub hub = score(candidate);
            if (hub != null) {
                hubs.add(hub);
            }
        }
        hubs.sort(Comparator.comparing(Hub::totalCost).thenComparing(Hub::hub));
        return List.copyOf(hubs);
    }

    private static Hub score(Candidate candidate) {
        if (candidate.legs() == null || candidate.legs().isEmpty()) {
            return null;
        }
        BigDecimal total = BigDecimal.ZERO;
        int durationSum = 0;
        List<BigDecimal> perPerson = new ArrayList<>();
        List<Leg> legs = new ArrayList<>();
        for (LegQuote quote : candidate.legs()) {
            if (quote == null || quote.partyCost() == null || quote.travelers() < 1) {
                return null;
            }
            BigDecimal cost = quote.partyCost().setScale(2, RoundingMode.HALF_UP);
            BigDecimal each = cost.divide(BigDecimal.valueOf(quote.travelers()), 2, RoundingMode.HALF_UP);
            perPerson.add(each);
            total = total.add(cost);
            durationSum += quote.durationMinutes();
            legs.add(new Leg(quote.origin(), quote.travelers(), cost, each, quote.durationMinutes(), quote.offerId()));
        }
        int avg = (int) Math.round(durationSum / (double) legs.size());
        return new Hub(candidate.hub(), candidate.city(), total, populationStddev(perPerson), avg, List.copyOf(legs));
    }

    private static BigDecimal divideByRate(BigDecimal amount, Map<String, BigDecimal> rates, String currency) {
        BigDecimal rate = rates == null ? null : rates.get(currency);
        if (rate == null) {
            return null;
        }
        return amount.divide(rate, 8, RoundingMode.HALF_UP);
    }
}
