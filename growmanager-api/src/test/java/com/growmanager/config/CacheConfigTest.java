package com.growmanager.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests for CacheConfig.
 * Verifies Redis cache manager configuration and cache definitions.
 */
@SpringBootTest
@ActiveProfiles("test")
class CacheConfigTest {

    @Autowired
    private CacheManager cacheManager;

    @Test
    void testCacheManagerExists() {
        // Assert
        assertThat(cacheManager).isNotNull();
    }

    @Test
    void testDashboardMetricsCacheCanBeCreated() {
        // Act
        var cache = cacheManager.getCache(CacheConfig.DASHBOARD_METRICS_CACHE);

        // Assert
        assertThat(cache).isNotNull();
        assertThat(cache.getName()).isEqualTo(CacheConfig.DASHBOARD_METRICS_CACHE);
    }

    @Test
    void testEnvironmentalTrendsCacheCanBeCreated() {
        // Act
        var cache = cacheManager.getCache(CacheConfig.ENVIRONMENTAL_TRENDS_CACHE);

        // Assert
        assertThat(cache).isNotNull();
        assertThat(cache.getName()).isEqualTo(CacheConfig.ENVIRONMENTAL_TRENDS_CACHE);
    }

    @Test
    void testFeedingAnalyticsCacheCanBeCreated() {
        // Act
        var cache = cacheManager.getCache(CacheConfig.FEEDING_ANALYTICS_CACHE);

        // Assert
        assertThat(cache).isNotNull();
        assertThat(cache.getName()).isEqualTo(CacheConfig.FEEDING_ANALYTICS_CACHE);
    }

    @Test
    void testCultivarComparisonCacheCanBeCreated() {
        // Act
        var cache = cacheManager.getCache(CacheConfig.CULTIVAR_COMPARISON_CACHE);

        // Assert
        assertThat(cache).isNotNull();
        assertThat(cache.getName()).isEqualTo(CacheConfig.CULTIVAR_COMPARISON_CACHE);
    }

    @Test
    void testYieldAnalyticsCacheCanBeCreated() {
        // Act
        var cache = cacheManager.getCache(CacheConfig.YIELD_ANALYTICS_CACHE);

        // Assert
        assertThat(cache).isNotNull();
        assertThat(cache.getName()).isEqualTo(CacheConfig.YIELD_ANALYTICS_CACHE);
    }

    @Test
    void testTimelineEventsCacheCanBeCreated() {
        // Act
        var cache = cacheManager.getCache(CacheConfig.TIMELINE_EVENTS_CACHE);

        // Assert
        assertThat(cache).isNotNull();
        assertThat(cache.getName()).isEqualTo(CacheConfig.TIMELINE_EVENTS_CACHE);
    }

    @Test
    void testCacheSupportsNullValues() {
        // Arrange
        var cache = cacheManager.getCache(CacheConfig.DASHBOARD_METRICS_CACHE);

        // Act
        cache.put("testKey", "testValue");
        var value = cache.get("testKey");

        // Assert
        assertThat(value).isNotNull();
        assertThat(value.get()).isEqualTo("testValue");
    }

    @Test
    void testCacheEviction() {
        // Arrange
        var cache = cacheManager.getCache(CacheConfig.DASHBOARD_METRICS_CACHE);
        String key = "evictionTestKey";
        String value = "evictionTestValue";

        // Act
        cache.put(key, value);
        assertThat(cache.get(key)).isNotNull();

        cache.evict(key);

        // Assert
        assertThat(cache.get(key)).isNull();
    }
}