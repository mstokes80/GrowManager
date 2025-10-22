package com.growmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Response DTO for dashboard metrics.
 * Contains aggregated statistics for the user's dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardMetricsResponse {

    /**
     * Environmental quality metrics for each grow.
     */
    private List<EnvironmentalQuality> environmentalQuality;

    /**
     * Plant stage distribution across all active grows.
     */
    private PlantStageDistribution plantStageDistribution;

    /**
     * Recent issues summary.
     */
    private IssueSummary issueSummary;

    /**
     * Recent activities across all grows (last 10).
     */
    private List<RecentActivity> recentActivities;

    /**
     * Environmental quality for a specific grow.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnvironmentalQuality {
        private String growId;
        private String growName;
        private Double currentTemperature;
        private Double currentHumidity;
        private Double currentCo2;
        private Integer currentLight;
        private LocalDateTime lastUpdated;
        private Map<String, String> alerts; // Key: parameter name, Value: alert level (warning/danger)
    }

    /**
     * Plant stage distribution.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlantStageDistribution {
        private Long seedlingCount;
        private Long vegetativeCount;
        private Long floweringCount;
        private Long harvestCount;
        private Long totalActive;
    }

    /**
     * Issue tracking summary.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IssueSummary {
        private Long totalIssues;
        private Long unresolvedIssues;
        private Long recentIssues; // Last 7 days
        private String trend; // "up", "down", "stable"
    }

    /**
     * Recent activity entry.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivity {
        private String id;
        private String type; // "feeding", "watering", "training", "observation", "environmental"
        private String growId;
        private String growName;
        private String plantId;
        private String plantTag;
        private String description;
        private LocalDateTime timestamp;
    }
}