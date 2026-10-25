package io.skyroute.api.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import io.skyroute.api.model.entity.SniperNotificationEntity;

public interface SniperNotificationRepository extends JpaRepository<SniperNotificationEntity, UUID> {

    List<SniperNotificationEntity> findBySentAtIsNull();

    boolean existsBySniperId(UUID sniperId);

    void deleteBySniperId(UUID sniperId);
}
