package io.skyroute.api.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import io.skyroute.api.model.dto.request.SniperCondition;

public final class SniperEvaluator {

    private SniperEvaluator() {}

    public static boolean matches(List<SniperCondition> conditions, String matchMode, BigDecimal market, BigDecimal snapshot) {
        if (conditions == null || conditions.isEmpty() || market == null) return false;
        if ("ALL".equals(matchMode)) {
            return conditions.stream().allMatch(c -> hit(c, market, snapshot));
        }
        return conditions.stream().anyMatch(c -> hit(c, market, snapshot));
    }

    public static void assertArmable(List<SniperCondition> conditions, String matchMode, BigDecimal snapshot) {
        if (conditions == null || conditions.isEmpty()) {
            throw new IllegalArgumentException("At least one condition");
        }
        if (!"ANY".equals(matchMode) && !"ALL".equals(matchMode)) {
            throw new IllegalArgumentException("matchMode is ANY or ALL");
        }
        if (snapshot == null || snapshot.signum() <= 0) {
            throw new IllegalArgumentException("No live fare");
        }
        for (SniperCondition condition : conditions) {
            if (condition == null || condition.op() == null) {
                throw new IllegalArgumentException("Unknown condition");
            }
            switch (condition.op()) {
                case "LTE", "LT" -> {
                    positive(condition.amount(), "amount");
                    belowLive(condition.amount(), snapshot);
                }
                case "BETWEEN" -> {
                    positive(condition.min(), "min");
                    positive(condition.max(), "max");
                    if (condition.min().compareTo(condition.max()) >= 0) {
                        throw new IllegalArgumentException("min must be below max");
                    }
                    belowLive(condition.max(), snapshot);
                }
                case "PCT_BELOW" -> {
                    if (condition.pct() == null || condition.pct() < 1 || condition.pct() > 99) {
                        throw new IllegalArgumentException("pct is 1-99");
                    }
                    String basis = condition.basis() == null ? "SNAPSHOT" : condition.basis();
                    if ("USER".equals(basis)) {
                        positive(condition.amount(), "amount");
                        belowLive(threshold(condition.amount(), condition.pct()), snapshot);
                    } else if (!"SNAPSHOT".equals(basis)) {
                        throw new IllegalArgumentException("basis is SNAPSHOT or USER");
                    }
                }
                default -> throw new IllegalArgumentException("Unknown condition " + condition.op());
            }
        }
    }

    private static boolean hit(SniperCondition condition, BigDecimal market, BigDecimal snapshot) {
        return switch (condition.op()) {
            case "LTE" -> condition.amount() != null && market.compareTo(condition.amount()) <= 0;
            case "LT" -> condition.amount() != null && market.compareTo(condition.amount()) < 0;
            case "BETWEEN" -> condition.min() != null && condition.max() != null
                    && market.compareTo(condition.min()) >= 0
                    && market.compareTo(condition.max()) <= 0;
            case "PCT_BELOW" -> {
                if (condition.pct() == null) yield false;
                BigDecimal base = "USER".equals(condition.basis()) ? condition.amount() : snapshot;
                if (base == null) yield false;
                yield market.compareTo(threshold(base, condition.pct())) <= 0;
            }
            default -> false;
        };
    }

    static BigDecimal threshold(BigDecimal base, int pct) {
        return base.multiply(BigDecimal.valueOf(100L - pct))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private static void positive(BigDecimal value, String name) {
        if (value == null || value.signum() <= 0) {
            throw new IllegalArgumentException(name + " must be positive");
        }
    }

    private static void belowLive(BigDecimal target, BigDecimal snapshot) {
        if (target.compareTo(snapshot) >= 0) {
            throw new IllegalArgumentException("Target must be below the live fare of " + snapshot.toPlainString());
        }
    }
}
