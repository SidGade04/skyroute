package io.skyroute.api.model.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record DuffelRawResponse(
        @JsonProperty("data") DuffelData data) {

    // ponytail: only offers are mapped; request-level slices/passengers ignored
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DuffelData(
            String id,
            List<Offer> offers) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Offer(
            String id,
            @JsonProperty("total_amount") BigDecimal totalAmount,
            @JsonProperty("total_currency") String totalCurrency,
            @JsonProperty("tax_amount") BigDecimal taxAmount,
            @JsonProperty("base_amount") BigDecimal baseAmount,
            Owner owner,
            List<OfferSlice> slices,
            List<Passenger> passengers,
            @JsonProperty("available_services") List<AvailableService> availableServices) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Owner(
            String id,
            String name,
            @JsonProperty("iata_code") String iataCode,
            @JsonProperty("logo_symbol_url") String logoSymbolUrl) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OfferSlice(
            String id,
            AirportLocation origin,
            AirportLocation destination,
            String duration,
            List<Segment> segments) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Segment(
            String id,
            @JsonProperty("departing_at") String departingAt,
            @JsonProperty("arriving_at") String arrivingAt,
            AirportLocation origin,
            AirportLocation destination,
            @JsonProperty("operating_carrier") OperatingCarrier operatingCarrier,
            Aircraft aircraft,
            String duration) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AirportLocation(
            String id,
            String name,
            @JsonProperty("iata_code") String iataCode,
            @JsonProperty("city_name") String cityName) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OperatingCarrier(
            String name,
            @JsonProperty("iata_code") String iataCode,
            @JsonProperty("logo_symbol_url") String logoSymbolUrl) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Aircraft(
            String id,
            String name,
            @JsonProperty("iata_code") String iataCode) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Passenger(
            String id,
            String type,
            List<BaggageAllowance> baggages) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record BaggageAllowance(
            String type, // "checked" or "carry_on"
            Integer quantity) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AvailableService(
            String id,
            String type, // typically "baggage"
            @JsonProperty("total_amount") BigDecimal totalAmount,
            @JsonProperty("total_currency") String totalCurrency,
            @JsonProperty("maximum_weight_kg") Integer maximumWeightKg,
            BaggageMetadata metadata) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record BaggageMetadata(
            String type, // "checked" or "carry_on"
            @JsonProperty("maximum_weight_kg") Integer maximumWeightKg) {
    }
}