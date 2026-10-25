package io.skyroute.api.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

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
        String phone = user.getPhone() != null ? user.getPhone() : SupabaseClaims.phone(jwt);
        rejectTakenPhone(user.getId(), phone);
        user.apply(
                email,
                user.getFirstName() != null ? user.getFirstName() : SupabaseClaims.firstName(jwt),
                user.getLastName() != null ? user.getLastName() : SupabaseClaims.lastName(jwt),
                phone,
                SupabaseClaims.avatarUrl(jwt),
                provider);
        try {
            return UserDTO.from(userRepository.saveAndFlush(user));
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException(conflict(e));
        }
    }

    public boolean phoneTaken(String raw) {
        String key = UpdateUserRequest.phoneKey(raw);
        return key != null && userRepository.phoneTaken(key);
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
        String phone = request.normalizedPhone();
        rejectTakenPhone(user.getId(), phone);
        user.updateDetails(email, phone);
        try {
            return UserDTO.from(userRepository.saveAndFlush(user));
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException(conflict(e));
        }
    }

    private void rejectTakenPhone(UUID id, String phone) {
        String key = UpdateUserRequest.phoneKey(phone);
        if (key != null && userRepository.phoneTakenByOther(key, id)) {
            throw new IllegalArgumentException("Phone number is already in use");
        }
    }

    private static String conflict(DataIntegrityViolationException e) {
        String message = e.getMostSpecificCause().getMessage();
        if (message != null && message.contains("phone")) return "Phone number is already in use";
        return "Email is already in use";
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
