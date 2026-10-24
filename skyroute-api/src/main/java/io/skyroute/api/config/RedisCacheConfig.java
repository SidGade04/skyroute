package io.skyroute.api.config;

import java.time.Duration;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.cache.interceptor.LoggingCacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import io.lettuce.core.RedisCredentials;
import io.lettuce.core.RedisURI;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Configuration
public class RedisCacheConfig implements CachingConfigurer {

    // ponytail: Render injects REDIS_URL; Boot only reads spring.data.redis.* so cache was dialing localhost and 500ing
    @Bean
    @ConditionalOnProperty("REDIS_URL")
    public RedisConnectionFactory redisConnectionFactory(@Value("${REDIS_URL}") String url) {
        return fromUrl(url);
    }

    static RedisConnectionFactory fromUrl(String url) {
        RedisURI uri = RedisURI.create(url);
        RedisStandaloneConfiguration standalone = new RedisStandaloneConfiguration(uri.getHost(), uri.getPort());
        standalone.setDatabase(uri.getDatabase());
        RedisCredentials credentials = uri.getCredentialsProvider().resolveCredentials().block();
        if (credentials != null && credentials.hasUsername()) {
            standalone.setUsername(credentials.getUsername());
        }
        if (credentials != null && credentials.hasPassword()) {
            standalone.setPassword(credentials.getPassword());
        }
        LettuceClientConfiguration.LettuceClientConfigurationBuilder client = LettuceClientConfiguration.builder();
        if (uri.isSsl()) {
            client.useSsl();
        }
        return new LettuceConnectionFactory(standalone, client.build());
    }

    @Override
    public CacheErrorHandler errorHandler() {
        // log and continue — a down cache must not fail search
        return new LoggingCacheErrorHandler(true);
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaults = baseConfig().entryTtl(Duration.ofHours(24));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaults)
                .withInitialCacheConfigurations(Map.of(
                        "popularAirports", defaults,
                        "fxRates", baseConfig().entryTtl(Duration.ofHours(24)),
                        // ponytail: fares stale fast; bump when offer expiry is modeled
                        "duffelOffers", baseConfig().entryTtl(Duration.ofMinutes(5))
                ))
                .build();
    }

    private static RedisCacheConfiguration baseConfig() {
        return RedisCacheConfiguration.defaultCacheConfig()
                .disableCachingNullValues()
                .serializeKeysWith(SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer(cacheMapper())));
    }

    // ponytail: records are final, so NON_FINAL drops @class and Redis reads fail. Same coverage as deprecated EVERYTHING.
    static ObjectMapper cacheMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        ObjectMapper.DefaultTypeResolverBuilder typer = new ObjectMapper.DefaultTypeResolverBuilder(
                ObjectMapper.DefaultTyping.NON_FINAL,
                LaissezFaireSubTypeValidator.instance) {
            @Override
            public boolean useForType(JavaType t) {
                return !t.isPrimitive();
            }
        };
        typer.withSettings(JsonTypeInfo.Value.construct(
                JsonTypeInfo.Id.CLASS,
                JsonTypeInfo.As.PROPERTY,
                null,
                null,
                false,
                null));
        mapper.setDefaultTyping(typer);
        return mapper;
    }
}
