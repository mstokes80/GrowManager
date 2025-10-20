package com.growmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Response DTO for cultivar comparison analytics.
 * Supports comparing 2-4 cultivars across multiple metrics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CultivarComparisonResponse {

    /**
     * List of cultivar comparisons (2-4 cultivars).
     */
    private List<CultivarMetrics> cultivars;

    /**
     * Best performer indicators.
     */
    private BestPerformers bestPerformers;

    /**
     * Metrics for a single cultivar.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CultivarMetrics {
        private String cultivarId;
        private String cultivarName;
        private String type; // "indica", "sativa", "hybrid"
        private PerformanceMetrics performance;
        private EnvironmentalPreferences environmentalPreferences;
        private QualityMetrics quality;
        private Integer totalGrows;
        private Integer totalPlants;
    }

    /**
     * Performance metrics for a cultivar.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PerformanceMetrics {
        private Double avgYieldPerPlant; // grams
        private Double avgYieldPerSqFt; // grams per square foot
        private Double successRate; // percentage (0-100)
        private Double easeOfGrowthScore; // 0-100, based on issues
        private Integer avgDaysToHarvest;
        private Double wetToDryRatio;
    }

    /**
     * Optimal environmental conditions for a cultivar.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnvironmentalPreferences {
        private Double optimalTemperature;
        private Double optimalHumidity;
        private Double optimalVpd;
        private Integer optimalCo2;
        private Integer optimalLight;
    }

    /**
     * Quality metrics for a cultivar.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QualityMetrics {
        private Double avgPotency; // percentage THC/CBD
        private Double avgQualityScore; // 0-10 rating
        private String dominantTerpene;
        private Map<String, Integer> defectCounts; // defect type -> count
    }

    /**
     * Best performing cultivar in each category.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BestPerformers {
        private String highestYield; // cultivar ID
        private String fastestGrowth; // cultivar ID
        private String easiestToGrow; // cultivar ID
        private String highestQuality; // cultivar ID
    }
}