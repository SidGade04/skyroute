package io.skyroute.api.config;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

import io.skyroute.api.model.dto.AirportDTO;

class RedisCacheConfigTest {

    @Test
    void parsesRenderRedisUrl() {
        LettuceConnectionFactory factory = (LettuceConnectionFactory) RedisCacheConfig.fromUrl(
                "rediss://default:s3cret@red-abc.internal:6379/2");
        assertEquals("red-abc.internal", factory.getHostName());
        assertEquals(6379, factory.getPort());
        assertEquals(2, factory.getDatabase());
        assertEquals("default", factory.getStandaloneConfiguration().getUsername());
        assertArrayEquals("s3cret".toCharArray(), factory.getStandaloneConfiguration().getPassword().get());
        assertTrue(factory.getClientConfiguration().isUseSsl());
    }

    @Test
    void cacheMapperRoundTripsFinalRecords() {
        GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer(RedisCacheConfig.cacheMapper());
        var airports = new ArrayList<AirportDTO>();
        airports.add(new AirportDTO("DXB", "Dubai", "Dubai International Airport", "AE"));
        byte[] bytes = serializer.serialize(airports);
        assertEquals(airports, serializer.deserialize(bytes));
        assertTrue(new String(bytes, StandardCharsets.UTF_8).contains(AirportDTO.class.getName()));
    }
}
