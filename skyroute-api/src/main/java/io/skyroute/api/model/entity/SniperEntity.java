package io.skyroute.api.model.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "snipers", schema = "skyroute")
public class SniperEntity {

    public static final String ARMED = "ARMED";
    public static final String TRIGGERED = "TRIGGERED";
    public static final String DISARMED = "DISARMED";
    public static final String EXPIRED = "EXPIRED";

    @Id
    @Column(nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 3)
    private String origin;

    @Column(nullable = false, length = 3)
    private String destination;

    @Column(name = "window_start", nullable = false)
    private LocalDate windowStart;

    @Column(name = "window_end", nullable = false)
    private LocalDate windowEnd;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "match_mode", nullable = false, length = 8)
    private String matchMode;

    @Column(nullable = false, columnDefinition = "text")
    private String conditions;

    @Column(name = "snapshot_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal snapshotPrice;

    @Column(name = "snapshot_date")
    private LocalDate snapshotDate;

    @Column(nullable = false, length = 16)
    private String status;

    @Column(name = "last_price", precision = 12, scale = 2)
    private BigDecimal lastPrice;

    @Column(name = "last_offer_id")
    private String lastOfferId;

    @Column(name = "last_polled_at")
    private Instant lastPolledAt;

    @Column(name = "last_error")
    private String lastError;

    @Column(name = "triggered_price", precision = 12, scale = 2)
    private BigDecimal triggeredPrice;

    @Column(name = "triggered_offer_id")
    private String triggeredOfferId;

    @Column(name = "triggered_at")
    private Instant triggeredAt;

    @Column(name = "cheapest_date")
    private LocalDate cheapestDate;

    @Column(name = "armed_at", nullable = false)
    private Instant armedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SniperEntity() {}

    public SniperEntity(
            UUID id,
            UUID userId,
            String origin,
            String destination,
            LocalDate windowStart,
            LocalDate windowEnd,
            String currency,
            String matchMode,
            String conditions,
            BigDecimal snapshotPrice,
            LocalDate snapshotDate
    ) {
        this.id = id;
        this.userId = userId;
        this.origin = origin;
        this.destination = destination;
        this.windowStart = windowStart;
        this.windowEnd = windowEnd;
        this.currency = currency;
        this.matchMode = matchMode;
        this.conditions = conditions;
        this.snapshotPrice = snapshotPrice;
        this.snapshotDate = snapshotDate;
        this.cheapestDate = snapshotDate;
        this.status = ARMED;
        Instant now = Instant.now();
        this.armedAt = now;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void markPolled(BigDecimal price, String offerId, LocalDate date, String error) {
        this.lastPrice = price;
        this.lastOfferId = offerId;
        if (date != null) this.cheapestDate = date;
        this.lastError = error;
        this.lastPolledAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void trigger(BigDecimal price, String offerId, LocalDate date) {
        if (!ARMED.equals(status)) return;
        this.status = TRIGGERED;
        this.triggeredPrice = price;
        this.triggeredOfferId = offerId;
        this.triggeredAt = Instant.now();
        markPolled(price, offerId, date, null);
    }

    public void expire() {
        this.status = EXPIRED;
        this.updatedAt = Instant.now();
    }

    public void disarm() {
        if (!ARMED.equals(status)) {
            throw new IllegalArgumentException("Sniper is not armed");
        }
        this.status = DISARMED;
        this.updatedAt = Instant.now();
    }

    public void rearm(BigDecimal snapshotPrice, LocalDate snapshotDate, String conditions, String matchMode) {
        if (!TRIGGERED.equals(status) && !DISARMED.equals(status)) {
            throw new IllegalArgumentException("Sniper cannot be rearmed");
        }
        this.status = ARMED;
        this.snapshotPrice = snapshotPrice;
        this.snapshotDate = snapshotDate;
        this.cheapestDate = snapshotDate;
        this.conditions = conditions;
        this.matchMode = matchMode;
        this.triggeredPrice = null;
        this.triggeredOfferId = null;
        this.triggeredAt = null;
        this.lastError = null;
        Instant now = Instant.now();
        this.armedAt = now;
        this.updatedAt = now;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getOrigin() { return origin; }
    public String getDestination() { return destination; }
    public LocalDate getWindowStart() { return windowStart; }
    public LocalDate getWindowEnd() { return windowEnd; }
    public String getCurrency() { return currency; }
    public String getMatchMode() { return matchMode; }
    public String getConditions() { return conditions; }
    public BigDecimal getSnapshotPrice() { return snapshotPrice; }
    public LocalDate getSnapshotDate() { return snapshotDate; }
    public String getStatus() { return status; }
    public BigDecimal getLastPrice() { return lastPrice; }
    public String getLastOfferId() { return lastOfferId; }
    public Instant getLastPolledAt() { return lastPolledAt; }
    public String getLastError() { return lastError; }
    public BigDecimal getTriggeredPrice() { return triggeredPrice; }
    public String getTriggeredOfferId() { return triggeredOfferId; }
    public Instant getTriggeredAt() { return triggeredAt; }
    public LocalDate getCheapestDate() { return cheapestDate; }
    public Instant getArmedAt() { return armedAt; }
}
