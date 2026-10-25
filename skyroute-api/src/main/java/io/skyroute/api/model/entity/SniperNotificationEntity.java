package io.skyroute.api.model.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sniper_notifications", schema = "skyroute")
public class SniperNotificationEntity {

    @Id
    @Column(nullable = false)
    private UUID id;

    @Column(name = "sniper_id", nullable = false)
    private UUID sniperId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column
    private String error;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected SniperNotificationEntity() {}

    public SniperNotificationEntity(UUID id, UUID sniperId, UUID userId) {
        this.id = id;
        this.sniperId = sniperId;
        this.userId = userId;
        this.createdAt = Instant.now();
    }

    public void sent() {
        this.sentAt = Instant.now();
        this.error = null;
    }

    public void fail(String error) {
        this.error = error;
    }

    public UUID getId() { return id; }
    public UUID getSniperId() { return sniperId; }
    public UUID getUserId() { return userId; }
}
