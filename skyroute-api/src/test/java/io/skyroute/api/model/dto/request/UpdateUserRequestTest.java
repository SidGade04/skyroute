package io.skyroute.api.model.dto.request;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class UpdateUserRequestTest {

    @Test
    void normalizesPhoneAndClearsBlank() {
        assertEquals("+971 50 123 4567", UpdateUserRequest.phone(" +971 50 123 4567 "));
        assertNull(UpdateUserRequest.phone("  "));
        assertThrows(IllegalArgumentException.class, () -> UpdateUserRequest.phone("call me"));
        assertEquals("a@b.com", UpdateUserRequest.email(" A@b.com "));
        assertThrows(IllegalArgumentException.class, () -> UpdateUserRequest.email("not-an-email"));
    }
}
