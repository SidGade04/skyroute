package io.skyroute.api.model.dto;

import java.math.BigDecimal;
import java.util.Map;

public record FxRatesDTO(
    String base,
    String date,
    Map<String, BigDecimal> rates
) {}
