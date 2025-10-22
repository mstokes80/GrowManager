package com.growmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Response DTO for yield and production analytics.
 * Contains yield metrics, production efficiency, and quality tracking.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class YieldAnalyticsResponse {

    /**
     * Overall yield metrics.
     */
    private YieldMetrics yieldMetrics;

    /**
     * Production efficiency calculations.
     */
    private ProductionEfficiency productionEfficiency;

    /**
     * Quality distribution across harvests.
     */
    private QualityTracking qualityTracking;

    /**
     * Yield trend over time.
     */
    private List<YieldTrendPoint> yieldTrend;

    /**
     * Top performing grows/plants.
     */
    private List<TopPerformer> topPerformers;

    /**
     * Overall yield metrics.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class YieldMetrics {
        private Double totalYield; // Total grams across all harvests
        private Double avgYieldPerPlant;
        private Double avgYieldPerCultivar;
        private Double avgYieldPerGrow;
        private Double avgWetWeight;
        private Double avgDryWeight;
        private Double avgWetToDryRatio;
        private Double totalHashYield; // Total hash yield in grams
        private Double avgHashYieldPerPlant; // Average hash yield per plant
        private Double avgHashYieldPercentage; // Hash yield as % of wet weight
        private Integer totalHarvests;
        private Integer totalPlantsHarvested;
    }

    /**
     * Production efficiency metrics.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductionEfficiency {
        private Double gramsPerWatt; // Yield ÷ Light wattage
        private Double successRate; // Percentage of plants reaching harvest
        private Integer avgDaysToHarvest;
        private Double yieldPerSqFt; // Average yield per square foot
        private String trend; // "improving", "stable", "declining"
    }

    /**
     * Quality tracking across harvests.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QualityTracking {
        private Double avgPotency;
        private QualityDistribution qualityDistribution;
        private Integer defectCount;
        private List<String> commonDefects;
    }

    /**
     * Distribution of quality scores.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QualityDistribution {
        private Integer excellent; // 9-10 rating
        private Integer good; // 7-8 rating
        private Integer average; // 5-6 rating
        private Integer poor; // 0-4 rating
    }

    /**
     * Single point in yield trend over time.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class YieldTrendPoint {
        private LocalDate harvestDate;
        private String growId;
        private String growName;
        private String cultivarId;
        private String cultivarName;
        private Double totalYield;
        private Integer plantCount;
        private Double avgYieldPerPlant;
    }

    /**
     * Top performing grow or plant.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopPerformer {
        private String id; // Grow ID or Plant ID
        private String type; // "grow" or "plant"
        private String name; // Grow name or plant tag
        private String cultivarName;
        private Double yield;
        private Double quality;
        private LocalDate harvestDate;
    }
}