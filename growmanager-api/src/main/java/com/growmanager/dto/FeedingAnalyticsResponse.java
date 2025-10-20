package com.growmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for feeding analytics.
 * Contains nutrient tracking, efficiency metrics, and pH/EC trends.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedingAnalyticsResponse {

    /**
     * Total nutrient input metrics.
     */
    private NutrientMetrics nutrientMetrics;

    /**
     * Efficiency calculations.
     */
    private EfficiencyMetrics efficiencyMetrics;

    /**
     * pH trend over time.
     */
    private List<TrendPoint> phTrend;

    /**
     * EC trend over time.
     */
    private List<TrendPoint> ecTrend;

    /**
     * Feeding schedule timeline.
     */
    private List<FeedingEventSummary> feedingTimeline;

    /**
     * Total nutrient input metrics.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NutrientMetrics {
        private Double totalEc;
        private Double avgEc;
        private Double avgPh;
        private Double totalWaterVolume;
        private Long feedingEventCount;
        private StageBreakdown vegetativeAvg;
        private StageBreakdown floweringAvg;
    }

    /**
     * Average values for a growth stage.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StageBreakdown {
        private Double avgEc;
        private Double avgPh;
        private Double avgWaterVolume;
        private Long eventCount;
    }

    /**
     * Feed efficiency and water use efficiency.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EfficiencyMetrics {
        private Double feedEfficiency; // Yield ÷ Total Nutrient Input
        private Double waterUseEfficiency; // Yield ÷ Total Water Used
        private String feedEfficiencyUnit; // e.g., "g/EC"
        private String waterEfficiencyUnit; // e.g., "g/L"
        private Double totalYield; // Total harvest yield used in calculations
    }

    /**
     * Single point in pH or EC trend.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendPoint {
        private LocalDateTime timestamp;
        private Double value;
        private Double variance; // For drift detection
        private String plantStage; // "vegetative", "flowering", etc.
    }

    /**
     * Summary of a feeding event for timeline display.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeedingEventSummary {
        private String id;
        private LocalDateTime timestamp;
        private String plantId;
        private String plantTag;
        private Double ec;
        private Double ph;
        private Double waterVolume;
        private String feedingType;
        private List<String> nutrients;
    }
}