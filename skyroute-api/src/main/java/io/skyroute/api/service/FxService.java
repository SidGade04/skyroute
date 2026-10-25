package io.skyroute.api.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import io.skyroute.api.model.dto.FxRatesDTO;

@Service
public class FxService {

    private record Raw(boolean success, String base, String date, Map<String, BigDecimal> rates, Map<String, Object> error) {}

    private final RestClient fxRestClient;

    public FxService(RestClient fxRestClient) {
        this.fxRestClient = fxRestClient;
    }

    // provider returns 200 + success:false on errors; throwing keeps failures out of the cache
    @Cacheable(cacheNames = "fxRates", key = "'latest'")
    public FxRatesDTO getLatest() {
        Raw raw = fxRestClient.get()
                .uri("/latest?access_key={key}")
                .retrieve()
                .body(Raw.class);
        if (raw == null || !raw.success() || raw.rates() == null) {
            throw new IllegalStateException("FX rates fetch failed: " + (raw == null ? "empty body" : raw.error()));
        }
        // HashMap — immutable maps don't round-trip through the Redis serializer
        return new FxRatesDTO(raw.base(), raw.date(), new HashMap<>(raw.rates()));
    }

    public BigDecimal convert(BigDecimal amount, String from, String to) {
        if (from.equalsIgnoreCase(to)) return amount.setScale(2, RoundingMode.HALF_UP);
        FxRatesDTO fx = getLatest();
        return amount.multiply(rate(fx, to)).divide(rate(fx, from), 2, RoundingMode.HALF_UP);
    }

    public void requireCurrency(String code) {
        FxRatesDTO fx = getLatest();
        rate(fx, code);
    }

    private static BigDecimal rate(FxRatesDTO fx, String code) {
        if (code.equalsIgnoreCase(fx.base())) return BigDecimal.ONE;
        BigDecimal rate = fx.rates().get(code.toUpperCase());
        if (rate == null || rate.signum() == 0) {
            throw new IllegalArgumentException("Unknown currency " + code);
        }
        return rate;
    }
}
