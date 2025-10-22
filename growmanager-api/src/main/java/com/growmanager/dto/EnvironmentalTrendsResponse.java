package com.growmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for environmental trends analytics.
 * Contains time-series data for environmental parameters with statistical summaries.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnvironmentalTrendsResponse {

    /**
     * Time-series data points.
     */
    private List<DataPoint> dataPoints;

    /**
     * Statistical summary for the time range.
     */
    private StatisticalSummary summary;

    /**
     * Stage-based comparison if requested.
     */
    private StageComparison stageComparison;

    /**
     * Single data point in the time series.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataPoint {
        private LocalDateTime timestamp;
        private Double temperature;
        private Double temperatureMin;
        private Double temperatureMax;
        private Double humidity;
        private Double humidityMin;
        private Double humidityMax;
        private Double vpd; // Vapor Pressure Deficit
        private Double co2;
        private Integer light;
        private Double soilMoisture; // Soil moisture in kPa
        private String aggregationLevel; // "hourly", "daily", "weekly", "monthly"
    }

    /**
     * Statistical summary for environmental parameters.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatisticalSummary {
        private ParameterStats temperature;
        private ParameterStats humidity;
        private ParameterStats vpd;
        private ParameterStats co2;
        private ParameterStats light;
        private ParameterStats soilMoisture;
        private Integer daysOutOfRange;
        private Double stabilityScore; // 0-100, based on variance
    }

    /**
     * Statistics for a single parameter.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParameterStats {
        private Double min;
        private Double max;
        private Double average;
        private Double variance;
        private Double standardDeviation;
        private OptimalRange optimalRange;
    }

    /**
     * Optimal range for a parameter.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptimalRange {
        private Double min;
        private Double max;
        private String unit;
    }

    /**
     * Comparison between vegetative and flowering stages.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StageComparison {
        private StageAverages vegetative;
        private StageAverages flowering;
    }

    /**
     * Average environmental parameters for a growth stage.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StageAverages {
        private Double avgTemperature;
        private Double avgHumidity;
        private Double avgVpd;
        private Double avgCo2;
        private Integer avgLight;
        private Double avgSoilMoisture;
        private Long dataPointCount;
    }
}