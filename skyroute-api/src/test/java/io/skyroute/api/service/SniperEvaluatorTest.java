package io.skyroute.api.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;

import io.skyroute.api.model.dto.request.SniperCondition;

class SniperEvaluatorTest {

    private static final BigDecimal LIVE = new BigDecimal("1000");

    @Test
    void priceConditions() {
        SniperCondition ceiling = new SniperCondition("LTE", new BigDecimal("700"), null, null, null, null);
        SniperCondition strict = new SniperCondition("LT", new BigDecimal("700"), null, null, null, null);
        SniperCondition band = new SniperCondition("BETWEEN", null, new BigDecimal("600"), new BigDecimal("700"), null, null);

        assertTrue(SniperEvaluator.matches(List.of(ceiling), "ANY", new BigDecimal("700"), LIVE));
        assertFalse(SniperEvaluator.matches(List.of(ceiling), "ANY", new BigDecimal("701"), LIVE));
        assertFalse(SniperEvaluator.matches(List.of(strict), "ANY", new BigDecimal("700"), LIVE));
        assertTrue(SniperEvaluator.matches(List.of(band), "ANY", new BigDecimal("600"), LIVE));
        assertTrue(SniperEvaluator.matches(List.of(band), "ANY", new BigDecimal("700"), LIVE));
        assertFalse(SniperEvaluator.matches(List.of(band), "ANY", new BigDecimal("599"), LIVE));

        SniperEvaluator.assertArmable(List.of(ceiling, strict, band), "ANY", LIVE);
        assertThrows(IllegalArgumentException.class, () -> SniperEvaluator.assertArmable(List.of(ceiling), "ANY", new BigDecimal("700")));
        assertThrows(IllegalArgumentException.class, () -> SniperEvaluator.assertArmable(
                List.of(new SniperCondition("BETWEEN", null, new BigDecimal("600"), LIVE, null, null)), "ANY", LIVE));
    }

    @Test
    void percentAndMatchMode() {
        SniperCondition snapshot = new SniperCondition("PCT_BELOW", null, null, null, 30, "SNAPSHOT");
        SniperCondition user = new SniperCondition("PCT_BELOW", new BigDecimal("1000"), null, null, 30, "USER");
        BigDecimal market = new BigDecimal("700");

        assertTrue(SniperEvaluator.matches(List.of(snapshot), "ANY", market, LIVE));
        assertFalse(SniperEvaluator.matches(List.of(snapshot), "ANY", new BigDecimal("701"), LIVE));
        assertTrue(SniperEvaluator.matches(List.of(user), "ANY", market, LIVE));
        assertTrue(SniperEvaluator.matches(List.of(snapshot, user), "ALL", market, LIVE));
        assertFalse(SniperEvaluator.matches(List.of(snapshot, user), "ALL", new BigDecimal("701"), LIVE));
        assertFalse(SniperEvaluator.matches(List.of(snapshot, user), "ANY", new BigDecimal("701"), LIVE));

        SniperEvaluator.assertArmable(List.of(snapshot), "ANY", LIVE);
        SniperEvaluator.assertArmable(List.of(user), "ANY", new BigDecimal("800"));
        assertThrows(IllegalArgumentException.class, () -> SniperEvaluator.assertArmable(List.of(user), "ANY", new BigDecimal("700")));
        assertThrows(IllegalArgumentException.class, () -> SniperEvaluator.assertArmable(
                List.of(new SniperCondition("PCT_BELOW", null, null, null, 0, "SNAPSHOT")), "ANY", LIVE));
        assertThrows(IllegalArgumentException.class, () -> SniperEvaluator.assertArmable(
                List.of(new SniperCondition("GTE", new BigDecimal("1"), null, null, null, null)), "ANY", LIVE));
        assertThrows(IllegalArgumentException.class, () -> SniperEvaluator.assertArmable(List.of(), "ANY", LIVE));
    }
}
