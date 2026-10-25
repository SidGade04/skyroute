package io.skyroute.api.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import io.skyroute.api.model.entity.SniperEntity;

public interface SniperRepository extends JpaRepository<SniperEntity, UUID> {

    List<SniperEntity> findByUserIdOrderByArmedAtDesc(UUID userId);

    List<SniperEntity> findByUserIdAndStatusOrderByArmedAtDesc(UUID userId, String status);

    Optional<SniperEntity> findByIdAndUserId(UUID id, UUID userId);

    long countByUserIdAndStatus(UUID userId, String status);

    List<SniperEntity> findByStatus(String status);
}
