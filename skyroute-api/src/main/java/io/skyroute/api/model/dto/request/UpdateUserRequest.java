package io.skyroute.api.model.dto.request;

public record UpdateUserRequest(String email, String phone) {

    public String normalizedEmail() {
        return email(email);
    }

    public String normalizedPhone() {
        return phone(phone);
    }

    static String email(String value) {
        if (value == null) return null;
        String trimmed = value.trim().toLowerCase();
        if (trimmed.isEmpty()) throw new IllegalArgumentException("Email is required");
        if (trimmed.length() > 320 || !trimmed.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) {
            throw new IllegalArgumentException("Enter a valid email");
        }
        return trimmed;
    }

    static String phone(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        if (trimmed.isEmpty()) return null;
        if (!trimmed.matches("\\+?[0-9][0-9 ]{3,30}")) {
            throw new IllegalArgumentException("Enter a phone number with digits only");
        }
        return trimmed;
    }

    public static String phoneKey(String value) {
        if (value == null) return null;
        String stripped = value.replace(" ", "").trim();
        return stripped.isEmpty() ? null : stripped;
    }
}
