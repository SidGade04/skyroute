package io.skyroute.api.service;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.skyroute.api.exception.ResourceNotFoundException;
import io.skyroute.api.model.dto.UserDTO;
import io.skyroute.api.model.entity.UserEntity;
import io.skyroute.api.repository.UserRepository;
import io.skyroute.api.security.SupabaseClaims;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public UserDTO sync(Jwt jwt) {
        UserEntity user = userRepository.findById(SupabaseClaims.id(jwt))
                .orElseGet(() -> new UserEntity(SupabaseClaims.id(jwt)));
        user.apply(
                SupabaseClaims.email(jwt),
                SupabaseClaims.firstName(jwt),
                SupabaseClaims.lastName(jwt),
                SupabaseClaims.phone(jwt),
                SupabaseClaims.avatarUrl(jwt),
                SupabaseClaims.provider(jwt));
        return UserDTO.from(userRepository.save(user));
    }

    public UserDTO me(Jwt jwt) {
        return userRepository.findById(SupabaseClaims.id(jwt))
                .map(UserDTO::from)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
