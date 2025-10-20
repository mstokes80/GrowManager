package com.growmanager.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Utility class for environmental calculations.
 * Provides methods for calculating VPD and other environmental metrics.
 */
public final class EnvironmentalCalculations {

    private EnvironmentalCalculations() {
        // Private constructor to prevent instantiation
    }

    /**
     * Industry-standard optimal temperature range for cannabis cultivation (°C).
     */
    public static final double OPTIMAL_TEMP_MIN = 20.0;
    public static final double OPTIMAL_TEMP_MAX = 26.0;

    /**
     * Industry-standard optimal humidity range for cannabis cultivation (%).
     * Vegetative: 60-70%
     * Flowering: 40-50%
     * Using middle ground: 50-60%
     */
    public static final double OPTIMAL_HUMIDITY_MIN = 50.0;
    public static final double OPTIMAL_HUMIDITY_MAX = 60.0;

    /**
     * Industry-standard optimal VPD range for cannabis cultivation (kPa).
     * Vegetative: 0.8-1.2 kPa
     * Flowering: 1.0-1.5 kPa
     * Using middle ground: 0.8-1.5 kPa
     */
    public static final double OPTIMAL_VPD_MIN = 0.8;
    public static final double OPTIMAL_VPD_MAX = 1.5;

    /**
     * Industry-standard optimal CO2 range for cannabis cultivation (ppm).
     */
    public static final double OPTIMAL_CO2_MIN = 1000.0;
    public static final double OPTIMAL_CO2_MAX = 1500.0;

    /**
     * Industry-standard optimal light intensity range for cannabis cultivation (PPFD).
     * Vegetative: 400-600 PPFD
     * Flowering: 600-1000 PPFD
     */
    public static final int OPTIMAL_LIGHT_MIN = 400;
    public static final int OPTIMAL_LIGHT_MAX = 1000;

    /**
     * Calculates Vapor Pressure Deficit (VPD) from temperature and relative humidity.
     * <p>
     * VPD is the difference between the amount of moisture in the air and how much
     * moisture the air can hold when saturated. It's a critical metric for plant health.
     * <p>
     * Formula: VPD = SVP × (1 - RH/100)
     * where SVP = 0.6108 × exp(17.27 × T / (T + 237.3))
     * <p>
     * This uses the Tetens formula for calculating Saturation Vapor Pressure (SVP).
     *
     * @param temperatureCelsius temperature in degrees Celsius
     * @param relativeHumidity   relative humidity as a percentage (0-100)
     * @return VPD in kilopascals (kPa), or null if inputs are null
     */
    public static BigDecimal calculateVpd(BigDecimal temperatureCelsius, BigDecimal relativeHumidity) {
        if (temperatureCelsius == null || relativeHumidity == null) {
            return null;
        }

        double temp = temperatureCelsius.doubleValue();
        double rh = relativeHumidity.doubleValue();

        // Validate inputs
        if (rh < 0.0 || rh > 100.0) {
            throw new IllegalArgumentException("Relative humidity must be between 0 and 100");
        }

        // Calculate Saturation Vapor Pressure (SVP) using Tetens formula
        // SVP = 0.6108 × exp(17.27 × T / (T + 237.3))
        double svp = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));

        // Calculate VPD
        // VPD = SVP × (1 - RH/100)
        double vpdValue = svp * (1 - rh / 100);

        return BigDecimal.valueOf(vpdValue).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calculates variance for a set of values.
     * <p>
     * Variance = sum((x - mean)^2) / n
     *
     * @param values the values to calculate variance for
     * @param mean   the mean of the values
     * @return the variance, or null if values is null or empty
     */
    public static Double calculateVariance(java.util.List<Double> values, double mean) {
        if (values == null || values.isEmpty()) {
            return null;
        }

        double sumSquaredDiff = values.stream()
                .mapToDouble(value -> Math.pow(value - mean, 2))
                .sum();

        return sumSquaredDiff / values.size();
    }

    /**
     * Calculates standard deviation for a set of values.
     * <p>
     * Standard Deviation = sqrt(variance)
     *
     * @param variance the variance
     * @return the standard deviation, or null if variance is null
     */
    public static Double calculateStandardDeviation(Double variance) {
        if (variance == null) {
            return null;
        }
        return Math.sqrt(variance);
    }

    /**
     * Calculates a stability score based on variance.
     * <p>
     * Stability score is a value from 0 to 100, where 100 is perfectly stable.
     * Lower variance means higher stability.
     * <p>
     * The score is calculated using an exponential decay function:
     * Score = 100 × e^(-variance / normalizer)
     * <p>
     * For temperature, a variance of 0 = 100 score, variance of 5 ≈ 60 score, variance of 10 ≈ 37 score
     *
     * @param variance   the variance to calculate stability from
     * @param normalizer a normalizing factor to scale the variance (higher = more lenient scoring)
     * @return stability score from 0 to 100, or null if variance is null
     */
    public static Double calculateStabilityScore(Double variance, double normalizer) {
        if (variance == null) {
            return null;
        }

        // Use exponential decay to convert variance to stability score
        // Higher variance = lower stability score
        double score = 100.0 * Math.exp(-variance / normalizer);

        // Round to 2 decimal places
        return BigDecimal.valueOf(score)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    /**
     * Checks if a temperature value is within the optimal range.
     *
     * @param temperature the temperature in Celsius
     * @return true if within optimal range, false otherwise
     */
    public static boolean isTemperatureOptimal(Double temperature) {
        if (temperature == null) {
            return false;
        }
        return temperature >= OPTIMAL_TEMP_MIN && temperature <= OPTIMAL_TEMP_MAX;
    }

    /**
     * Checks if a humidity value is within the optimal range.
     *
     * @param humidity the relative humidity percentage
     * @return true if within optimal range, false otherwise
     */
    public static boolean isHumidityOptimal(Double humidity) {
        if (humidity == null) {
            return false;
        }
        return humidity >= OPTIMAL_HUMIDITY_MIN && humidity <= OPTIMAL_HUMIDITY_MAX;
    }

    /**
     * Checks if a VPD value is within the optimal range.
     *
     * @param vpd the VPD in kPa
     * @return true if within optimal range, false otherwise
     */
    public static boolean isVpdOptimal(Double vpd) {
        if (vpd == null) {
            return false;
        }
        return vpd >= OPTIMAL_VPD_MIN && vpd <= OPTIMAL_VPD_MAX;
    }

    /**
     * Checks if a CO2 value is within the optimal range.
     *
     * @param co2 the CO2 concentration in ppm
     * @return true if within optimal range, false otherwise
     */
    public static boolean isCo2Optimal(Double co2) {
        if (co2 == null) {
            return false;
        }
        return co2 >= OPTIMAL_CO2_MIN && co2 <= OPTIMAL_CO2_MAX;
    }

    /**
     * Checks if a light intensity value is within the optimal range.
     *
     * @param light the light intensity in PPFD
     * @return true if within optimal range, false otherwise
     */
    public static boolean isLightOptimal(Integer light) {
        if (light == null) {
            return false;
        }
        return light >= OPTIMAL_LIGHT_MIN && light <= OPTIMAL_LIGHT_MAX;
    }
}