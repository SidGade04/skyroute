package io.skyroute.api.model.dto;

import java.time.Instant;
import java.util.UUID;

import io.skyroute.api.model.entity.UserEntity;

public record UserDTO(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String phone,
        String avatarUrl,
        String provider,
        Instant createdAt
) {
    public static UserDTO from(UserEntity e) {
        return new UserDTO(
                e.getId(), e.getEmail(), e.getFirstName(), e.getLastName(), e.getPhone(),
                e.getAvatarUrl(), e.getProvider(), e.getCreatedAt());
    }
}
