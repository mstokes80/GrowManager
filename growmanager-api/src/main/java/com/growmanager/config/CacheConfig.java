package com.growmanager.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

/**
 * Redis cache configuration for analytics caching.
 * Configures cache manager with 15-minute TTL for analytics queries.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Cache name constants for analytics.
     */
    public static final String DASHBOARD_METRICS_CACHE = "dashboardMetrics";
    public static final String ENVIRONMENTAL_TRENDS_CACHE = "environmentalTrends";
    public static final String FEEDING_ANALYTICS_CACHE = "feedingAnalytics";
    public static final String CULTIVAR_COMPARISON_CACHE = "cultivarComparison";
    public static final String YIELD_ANALYTICS_CACHE = "yieldAnalytics";
    public static final String TIMELINE_EVENTS_CACHE = "timelineEvents";

    /**
     * Default TTL for analytics caches (15 minutes).
     */
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(15);

    /**
     * Configures Redis cache manager with proper serialization.
     * Uses JSON serialization for complex DTOs.
     *
     * @param connectionFactory Redis connection factory
     * @return configured cache manager
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // Configure ObjectMapper for JSON serialization
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        // Activate default typing with NON_FINAL to handle polymorphic types
        // Use WRAPPER_ARRAY to avoid conflicts with @class property
        objectMapper.activateDefaultTyping(
                objectMapper.getPolymorphicTypeValidator(),
                ObjectMapper.DefaultTyping.NON_FINAL,
                com.fasterxml.jackson.annotation.JsonTypeInfo.As.WRAPPER_ARRAY
        );

        // Create default cache configuration
        RedisCacheConfiguration cacheConfiguration = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(DEFAULT_TTL)
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new StringRedisSerializer()
                        )
                )
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new GenericJackson2JsonRedisSerializer(objectMapper)
                        )
                )
                .disableCachingNullValues();

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(cacheConfiguration)
                .build();
    }
}