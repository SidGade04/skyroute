package io.skyroute.api.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import io.skyroute.api.model.dto.response.RendezvousResponse.Hub;
import io.skyroute.api.service.RendezvousRanker.Candidate;
import io.skyroute.api.service.RendezvousRanker.Geo;
import io.skyroute.api.service.RendezvousRanker.LegQuote;

class RendezvousRankerTest {

    @Test
    void ranksByTotalAndKeepsSplitMetrics() {
        Candidate aaa = candidate("AAA", "A",
                quote("DXB", 1, "200", 600),
                quote("LHR", 1, "200", 600),
                quote("JFK", 1, "800", 600));
        Candidate bbb = candidate("BBB", "B",
                quote("DXB", 1, "450", 200),
                quote("LHR", 1, "450", 200),
                quote("JFK", 1, "450", 900));

        List<Hub> hubs = RendezvousRanker.rank(List.of(bbb, aaa));

        assertEquals(List.of("AAA", "BBB"), hubs.stream().map(Hub::hub).toList());
        assertEquals(new BigDecimal("1200.00"), hubs.get(0).totalCost());
        assertEquals(new BigDecimal("282.84"), hubs.get(0).variance());
        assertEquals(600, hubs.get(0).avgDurationMinutes());
        assertEquals(new BigDecimal("1350.00"), hubs.get(1).totalCost());
        assertEquals(new BigDecimal("0.00"), hubs.get(1).variance());
        assertEquals(433, hubs.get(1).avgDurationMinutes());
    }

    @Test
    void sigmaUsesPerPersonCost() {
        Candidate hub = candidate("IST", "Istanbul",
                quote("DXB", 2, "290", 270),
                quote("LHR", 1, "310", 230),
                quote("JFK", 1, "640", 620));

        Hub scored = RendezvousRanker.rank(List.of(hub)).get(0);

        assertEquals(new BigDecimal("1240.00"), scored.totalCost());
        assertEquals(new BigDecimal("145.00"), scored.perOrigin().get(0).perPerson());
        assertEquals(new BigDecimal("205.79"), scored.variance());
        assertEquals(373, scored.avgDurationMinutes());
    }

    @Test
    void dropsHubWithMissingLeg() {
        Candidate kept = candidate("AAA", "A", quote("DXB", 1, "200", 60), quote("LHR", 1, "200", 60));
        Candidate dropped = new Candidate("ZZZ", "Z", Arrays.asList(quote("DXB", 1, "10", 10), null));

        List<Hub> hubs = RendezvousRanker.rank(List.of(dropped, kept));

        assertEquals(List.of("AAA"), hubs.stream().map(Hub::hub).toList());
    }

    @Test
    void shortlistPicksCentralHubAndSkipsOrigins() {
        Geo dxb = new Geo("DXB", "Dubai", 0, 0);
        Geo lhr = new Geo("LHR", "London", 0, 10);
        Geo mid = new Geo("IST", "Istanbul", 0, 5);
        Geo far = new Geo("SYD", "Sydney", 0, 80);
        Geo origin = new Geo("DXB", "Dubai", 0, 0);

        List<Geo> picked = RendezvousRanker.shortlist(List.of(dxb, lhr), List.of(far, origin, mid), 1);

        assertEquals(List.of("IST"), picked.stream().map(Geo::iata).toList());
    }

    @Test
    void parsesIsoDurations() {
        assertEquals(510, RendezvousRanker.parseIsoDuration("PT8H30M"));
        assertEquals(45, RendezvousRanker.parseIsoDuration("PT45M"));
        assertEquals(1560, RendezvousRanker.parseIsoDuration("P1DT2H"));
        assertNull(RendezvousRanker.parseIsoDuration(null));
        assertNull(RendezvousRanker.parseIsoDuration("PT"));
        assertEquals(510, RendezvousRanker.outboundMinutes(null, List.of("PT4H", "PT4H30M")));
    }

    @Test
    void convertsViaBaseRate() {
        Map<String, BigDecimal> rates = Map.of("USD", new BigDecimal("1.08"));

        assertEquals(new BigDecimal("9.25925926"), RendezvousRanker.convert(new BigDecimal("10"), "USD", "EUR", "EUR", rates));
        assertEquals(new BigDecimal("10.80"), RendezvousRanker.convert(new BigDecimal("10"), "EUR", "USD", "EUR", rates));
        assertEquals(new BigDecimal("10"), RendezvousRanker.convert(new BigDecimal("10"), "USD", "USD", "EUR", rates));
        assertNull(RendezvousRanker.convert(new BigDecimal("10"), "GBP", "USD", "EUR", rates));
    }

    private static Candidate candidate(String hub, String city, LegQuote... legs) {
        return new Candidate(hub, city, List.of(legs));
    }

    private static LegQuote quote(String origin, int travelers, String cost, int minutes) {
        return new LegQuote(origin, travelers, new BigDecimal(cost), minutes, "off_" + origin);
    }
}
