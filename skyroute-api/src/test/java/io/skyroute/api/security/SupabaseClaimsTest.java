package io.skyroute.api.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

class SupabaseClaimsTest {

    @Test
    void readsGoogleMetadataFallbacks() {
        Jwt jwt = jwt(Map.of("name", "Ada Lovelace", "picture", "https://img", "phone", "+971501234567"), "a@b.com");
        assertEquals("a@b.com", SupabaseClaims.email(jwt));
        assertEquals("Ada", SupabaseClaims.firstName(jwt));
        assertEquals("Lovelace", SupabaseClaims.lastName(jwt));
        assertEquals("+971501234567", SupabaseClaims.phone(jwt));
        assertEquals("https://img", SupabaseClaims.avatarUrl(jwt));
        assertEquals("google", SupabaseClaims.provider(jwt));
    }

    @Test
    void rejectsTokenWithoutEmail() {
        Jwt jwt = jwt(Map.of(), null);
        assertThrows(IllegalArgumentException.class, () -> SupabaseClaims.email(jwt));
    }

    private static Jwt jwt(Map<String, String> metadata, String email) {
        Jwt.Builder builder = Jwt.withTokenValue("t")
                .header("alg", "ES256")
                .subject("11111111-1111-1111-1111-111111111111")
                .claim("user_metadata", metadata)
                .claim("app_metadata", Map.of("provider", "google"))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60));
        if (email != null) builder.claim("email", email);
        return builder.build();
    }
}
