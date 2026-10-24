package io.skyroute.api.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.skyroute.api.exception.ResourceNotFoundException;
import io.skyroute.api.model.dto.UserDTO;
import io.skyroute.api.model.dto.request.UpdateUserRequest;
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
        String provider = user.getProvider() != null ? user.getProvider() : SupabaseClaims.provider(jwt);
        String email = !google(provider) && user.getEmail() != null ? user.getEmail() : SupabaseClaims.email(jwt);
        user.apply(
                email,
                user.getFirstName() != null ? user.getFirstName() : SupabaseClaims.firstName(jwt),
                user.getLastName() != null ? user.getLastName() : SupabaseClaims.lastName(jwt),
                user.getPhone() != null ? user.getPhone() : SupabaseClaims.phone(jwt),
                SupabaseClaims.avatarUrl(jwt),
                provider);
        return UserDTO.from(userRepository.save(user));
    }

    @Transactional
    public UserDTO update(Jwt jwt, UpdateUserRequest request) {
        UserEntity user = userRepository.findById(SupabaseClaims.id(jwt))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String email = user.getEmail();
        if (request.email() != null) {
            String next = request.normalizedEmail();
            if (google(user.getProvider()) && !next.equalsIgnoreCase(email)) {
                throw new IllegalArgumentException("Email is managed by Google");
            }
            if (!google(user.getProvider())) email = next;
        }
        user.updateDetails(email, request.normalizedPhone());
        try {
            return UserDTO.from(userRepository.saveAndFlush(user));
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Email is already in use");
        }
    }

    private static boolean google(String provider) {
        return provider != null && provider.equalsIgnoreCase("google");
    }

    public UserDTO me(Jwt jwt) {
        return userRepository.findById(SupabaseClaims.id(jwt))
                .map(UserDTO::from)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
