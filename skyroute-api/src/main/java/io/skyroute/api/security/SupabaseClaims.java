package io.skyroute.api.security;

import java.util.Map;
import java.util.UUID;

import org.springframework.security.oauth2.jwt.Jwt;

public final class SupabaseClaims {

    private SupabaseClaims() {}

    public static UUID id(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    public static String email(Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()) {
            email = text(meta(jwt), "email");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Token has no email");
        }
        return email;
    }

    public static String firstName(Jwt jwt) {
        Map<String, Object> meta = meta(jwt);
        if (text(meta, "given_name") != null || text(meta, "family_name") != null) {
            return text(meta, "given_name");
        }
        return split(displayName(meta))[0];
    }

    public static String lastName(Jwt jwt) {
        Map<String, Object> meta = meta(jwt);
        if (text(meta, "given_name") != null || text(meta, "family_name") != null) {
            return text(meta, "family_name");
        }
        return split(displayName(meta))[1];
    }

    public static String phone(Jwt jwt) {
        String phone = jwt.getClaimAsString("phone");
        if (phone == null || phone.isBlank()) phone = text(meta(jwt), "phone");
        return phone == null || phone.isBlank() ? null : phone;
    }

    public static String avatarUrl(Jwt jwt) {
        Map<String, Object> meta = meta(jwt);
        String url = text(meta, "avatar_url");
        return url != null ? url : text(meta, "picture");
    }

    public static String provider(Jwt jwt) {
        Object app = jwt.getClaim("app_metadata");
        if (app instanceof Map<?, ?> map && map.get("provider") != null) {
            return map.get("provider").toString();
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> meta(Jwt jwt) {
        Object value = jwt.getClaim("user_metadata");
        return value instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
    }

    private static String displayName(Map<String, Object> meta) {
        String name = text(meta, "full_name");
        return name != null ? name : text(meta, "name");
    }

    private static String[] split(String name) {
        if (name == null) return new String[] { null, null };
        int space = name.indexOf(' ');
        if (space < 0) return new String[] { name, null };
        String last = name.substring(space + 1).trim();
        return new String[] { name.substring(0, space), last.isEmpty() ? null : last };
    }

    private static String text(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        String text = value.toString();
        return text.isBlank() ? null : text;
    }
}
