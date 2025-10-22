package com.growmanager.util;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for EnvironmentalCalculations utility class.
 * Tests VPD calculation formulas and statistical calculations.
 */
class EnvironmentalCalculationsTest {

    @Test
    void testCalculateVpd_StandardConditions() {
        // Given: Standard growing conditions (25°C, 60% RH)
        BigDecimal temperature = BigDecimal.valueOf(25.0);
        BigDecimal humidity = BigDecimal.valueOf(60.0);

        // When: Calculating VPD
        BigDecimal vpd = EnvironmentalCalculations.calculateVpd(temperature, humidity);

        // Then: VPD should be approximately 1.27 kPa
        // SVP at 25°C = 0.6108 × exp(17.27 × 25 / (25 + 237.3)) = 3.17 kPa
        // VPD = 3.17 × (1 - 60/100) = 1.27 kPa
        assertThat(vpd).isNotNull();
        assertThat(vpd.doubleValue()).isCloseTo(1.27, within(0.01));
    }

    @Test
    void testCalculateVpd_LowTemperature() {
        // Given: Low temperature (18°C, 70% RH)
        BigDecimal temperature = BigDecimal.valueOf(18.0);
        BigDecimal humidity = BigDecimal.valueOf(70.0);

        // When: Calculating VPD
        BigDecimal vpd = EnvironmentalCalculations.calculateVpd(temperature, humidity);

        // Then: VPD should be lower due to lower temperature
        // SVP at 18°C ≈ 2.06 kPa
        // VPD = 2.06 × (1 - 70/100) = 0.62 kPa
        assertThat(vpd).isNotNull();
        assertThat(vpd.doubleValue()).isCloseTo(0.62, within(0.01));
    }

    @Test
    void testCalculateVpd_HighTemperature() {
        // Given: High temperature (30°C, 50% RH)
        BigDecimal temperature = BigDecimal.valueOf(30.0);
        BigDecimal humidity = BigDecimal.valueOf(50.0);

        // When: Calculating VPD
        BigDecimal vpd = EnvironmentalCalculations.calculateVpd(temperature, humidity);

        // Then: VPD should be higher due to higher temperature
        // SVP at 30°C ≈ 4.24 kPa
        // VPD = 4.24 × (1 - 50/100) = 2.12 kPa
        assertThat(vpd).isNotNull();
        assertThat(vpd.doubleValue()).isCloseTo(2.12, within(0.01));
    }

    @Test
    void testCalculateVpd_HighHumidity() {
        // Given: High humidity (25°C, 80% RH)
        BigDecimal temperature = BigDecimal.valueOf(25.0);
        BigDecimal humidity = BigDecimal.valueOf(80.0);

        // When: Calculating VPD
        BigDecimal vpd = EnvironmentalCalculations.calculateVpd(temperature, humidity);

        // Then: VPD should be lower due to high humidity
        // SVP at 25°C = 3.17 kPa
        // VPD = 3.17 × (1 - 80/100) = 0.63 kPa
        assertThat(vpd).isNotNull();
        assertThat(vpd.doubleValue()).isCloseTo(0.63, within(0.01));
    }

    @Test
    void testCalculateVpd_LowHumidity() {
        // Given: Low humidity (25°C, 40% RH)
        BigDecimal temperature = BigDecimal.valueOf(25.0);
        BigDecimal humidity = BigDecimal.valueOf(40.0);

        // When: Calculating VPD
        BigDecimal vpd = EnvironmentalCalculations.calculateVpd(temperature, humidity);

        // Then: VPD should be higher due to low humidity
        // SVP at 25°C = 3.17 kPa
        // VPD = 3.17 × (1 - 40/100) = 1.90 kPa
        assertThat(vpd).isNotNull();
        assertThat(vpd.doubleValue()).isCloseTo(1.90, within(0.01));
    }

    @Test
    void testCalculateVpd_NullTemperature() {
        // Given: Null temperature
        BigDecimal temperature = null;
        BigDecimal humidity = BigDecimal.valueOf(60.0);

        // When: Calculating VPD
        BigDecimal vpd = EnvironmentalCalculations.calculateVpd(temperature, humidity);

        // Then: Should return null
        assertThat(vpd).isNull();
    }

    @Test
    void testCalculateVpd_NullHumidity() {
        // Given: Null humidity
        BigDecimal temperature = BigDecimal.valueOf(25.0);
        BigDecimal humidity = null;

        // When: Calculating VPD
        BigDecimal vpd = EnvironmentalCalculations.calculateVpd(temperature, humidity);

        // Then: Should return null
        assertThat(vpd).isNull();
    }

    @Test
    void testCalculateVpd_InvalidHumidity() {
        // Given: Humidity above 100%
        BigDecimal temperature = BigDecimal.valueOf(25.0);
        BigDecimal humidity = BigDecimal.valueOf(150.0);

        // When: Calculating VPD
        // Then: Should throw exception
        assertThatThrownBy(() -> EnvironmentalCalculations.calculateVpd(temperature, humidity))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Relative humidity must be between 0 and 100");
    }

    @Test
    void testCalculateVpd_NegativeHumidity() {
        // Given: Negative humidity
        BigDecimal temperature = BigDecimal.valueOf(25.0);
        BigDecimal humidity = BigDecimal.valueOf(-10.0);

        // When: Calculating VPD
        // Then: Should throw exception
        assertThatThrownBy(() -> EnvironmentalCalculations.calculateVpd(temperature, humidity))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Relative humidity must be between 0 and 100");
    }

    @Test
    void testCalculateVpd_ExtremeTemperatures() {
        // Given: Very cold temperature (0°C, 50% RH)
        BigDecimal coldTemp = BigDecimal.valueOf(0.0);
        BigDecimal humidity = BigDecimal.valueOf(50.0);

        // When: Calculating VPD for cold temp
        BigDecimal coldVpd = EnvironmentalCalculations.calculateVpd(coldTemp, humidity);

        // Then: Should still calculate (though not realistic for cannabis)
        assertThat(coldVpd).isNotNull();
        assertThat(coldVpd.doubleValue()).isGreaterThan(0.0);

        // Given: Very hot temperature (40°C, 50% RH)
        BigDecimal hotTemp = BigDecimal.valueOf(40.0);

        // When: Calculating VPD for hot temp
        BigDecimal hotVpd = EnvironmentalCalculations.calculateVpd(hotTemp, humidity);

        // Then: Should still calculate
        assertThat(hotVpd).isNotNull();
        assertThat(hotVpd.doubleValue()).isGreaterThan(coldVpd.doubleValue());
    }

    @Test
    void testCalculateVariance() {
        // Given: Values [20, 22, 24, 26, 28] with mean 24
        List<Double> values = Arrays.asList(20.0, 22.0, 24.0, 26.0, 28.0);
        double mean = 24.0;

        // When: Calculating variance
        Double variance = EnvironmentalCalculations.calculateVariance(values, mean);

        // Then: Variance should be 8.0
        // Variance = sum((x - mean)^2) / n
        // = ((20-24)^2 + (22-24)^2 + (24-24)^2 + (26-24)^2 + (28-24)^2) / 5
        // = (16 + 4 + 0 + 4 + 16) / 5 = 40 / 5 = 8.0
        assertThat(variance).isNotNull();
        assertThat(variance).isEqualTo(8.0, within(0.01));
    }

    @Test
    void testCalculateVariance_NullValues() {
        // Given: Null values
        List<Double> values = null;
        double mean = 24.0;

        // When: Calculating variance
        Double variance = EnvironmentalCalculations.calculateVariance(values, mean);

        // Then: Should return null
        assertThat(variance).isNull();
    }

    @Test
    void testCalculateVariance_EmptyList() {
        // Given: Empty list
        List<Double> values = Arrays.asList();
        double mean = 24.0;

        // When: Calculating variance
        Double variance = EnvironmentalCalculations.calculateVariance(values, mean);

        // Then: Should return null
        assertThat(variance).isNull();
    }

    @Test
    void testCalculateStandardDeviation() {
        // Given: Variance of 8.0
        Double variance = 8.0;

        // When: Calculating standard deviation
        Double stdDev = EnvironmentalCalculations.calculateStandardDeviation(variance);

        // Then: Standard deviation should be sqrt(8.0) ≈ 2.83
        assertThat(stdDev).isNotNull();
        assertThat(stdDev).isEqualTo(2.83, within(0.01));
    }

    @Test
    void testCalculateStandardDeviation_NullVariance() {
        // Given: Null variance
        Double variance = null;

        // When: Calculating standard deviation
        Double stdDev = EnvironmentalCalculations.calculateStandardDeviation(variance);

        // Then: Should return null
        assertThat(stdDev).isNull();
    }

    @Test
    void testCalculateStabilityScore_PerfectStability() {
        // Given: Zero variance (perfect stability)
        Double variance = 0.0;
        double normalizer = 5.0;

        // When: Calculating stability score
        Double score = EnvironmentalCalculations.calculateStabilityScore(variance, normalizer);

        // Then: Score should be 100 (perfect stability)
        assertThat(score).isNotNull();
        assertThat(score).isEqualTo(100.0, within(0.01));
    }

    @Test
    void testCalculateStabilityScore_ModerateVariance() {
        // Given: Moderate variance
        Double variance = 5.0;
        double normalizer = 5.0;

        // When: Calculating stability score
        Double score = EnvironmentalCalculations.calculateStabilityScore(variance, normalizer);

        // Then: Score should be approximately 36.8 (e^-1 ≈ 0.368)
        // Score = 100 × e^(-5/5) = 100 × e^-1 ≈ 36.8
        assertThat(score).isNotNull();
        assertThat(score).isCloseTo(36.79, within(0.1));
    }

    @Test
    void testCalculateStabilityScore_HighVariance() {
        // Given: High variance
        Double variance = 10.0;
        double normalizer = 5.0;

        // When: Calculating stability score
        Double score = EnvironmentalCalculations.calculateStabilityScore(variance, normalizer);

        // Then: Score should be low (e^-2 ≈ 0.135)
        // Score = 100 × e^(-10/5) = 100 × e^-2 ≈ 13.5
        assertThat(score).isNotNull();
        assertThat(score).isCloseTo(13.53, within(0.1));
    }

    @Test
    void testCalculateStabilityScore_NullVariance() {
        // Given: Null variance
        Double variance = null;
        double normalizer = 5.0;

        // When: Calculating stability score
        Double score = EnvironmentalCalculations.calculateStabilityScore(variance, normalizer);

        // Then: Should return null
        assertThat(score).isNull();
    }

    @Test
    void testIsTemperatureOptimal() {
        // Then: Values within range should be optimal
        assertThat(EnvironmentalCalculations.isTemperatureOptimal(22.0)).isTrue();
        assertThat(EnvironmentalCalculations.isTemperatureOptimal(24.0)).isTrue();
        assertThat(EnvironmentalCalculations.isTemperatureOptimal(26.0)).isTrue();
        assertThat(EnvironmentalCalculations.isTemperatureOptimal(20.0)).isTrue();

        // Values outside range should not be optimal
        assertThat(EnvironmentalCalculations.isTemperatureOptimal(19.9)).isFalse();
        assertThat(EnvironmentalCalculations.isTemperatureOptimal(26.1)).isFalse();
        assertThat(EnvironmentalCalculations.isTemperatureOptimal(30.0)).isFalse();
        assertThat(EnvironmentalCalculations.isTemperatureOptimal(15.0)).isFalse();

        // Null should not be optimal
        assertThat(EnvironmentalCalculations.isTemperatureOptimal(null)).isFalse();
    }

    @Test
    void testIsHumidityOptimal() {
        // Then: Values within range should be optimal
        assertThat(EnvironmentalCalculations.isHumidityOptimal(55.0)).isTrue();
        assertThat(EnvironmentalCalculations.isHumidityOptimal(50.0)).isTrue();
        assertThat(EnvironmentalCalculations.isHumidityOptimal(60.0)).isTrue();

        // Values outside range should not be optimal
        assertThat(EnvironmentalCalculations.isHumidityOptimal(49.9)).isFalse();
        assertThat(EnvironmentalCalculations.isHumidityOptimal(60.1)).isFalse();
        assertThat(EnvironmentalCalculations.isHumidityOptimal(70.0)).isFalse();
        assertThat(EnvironmentalCalculations.isHumidityOptimal(40.0)).isFalse();

        // Null should not be optimal
        assertThat(EnvironmentalCalculations.isHumidityOptimal(null)).isFalse();
    }

    @Test
    void testIsVpdOptimal() {
        // Then: Values within range should be optimal
        assertThat(EnvironmentalCalculations.isVpdOptimal(1.0)).isTrue();
        assertThat(EnvironmentalCalculations.isVpdOptimal(0.8)).isTrue();
        assertThat(EnvironmentalCalculations.isVpdOptimal(1.5)).isTrue();
        assertThat(EnvironmentalCalculations.isVpdOptimal(1.2)).isTrue();

        // Values outside range should not be optimal
        assertThat(EnvironmentalCalculations.isVpdOptimal(0.7)).isFalse();
        assertThat(EnvironmentalCalculations.isVpdOptimal(1.6)).isFalse();
        assertThat(EnvironmentalCalculations.isVpdOptimal(2.0)).isFalse();

        // Null should not be optimal
        assertThat(EnvironmentalCalculations.isVpdOptimal(null)).isFalse();
    }

    @Test
    void testIsCo2Optimal() {
        // Then: Values within range should be optimal
        assertThat(EnvironmentalCalculations.isCo2Optimal(1200.0)).isTrue();
        assertThat(EnvironmentalCalculations.isCo2Optimal(1000.0)).isTrue();
        assertThat(EnvironmentalCalculations.isCo2Optimal(1500.0)).isTrue();

        // Values outside range should not be optimal
        assertThat(EnvironmentalCalculations.isCo2Optimal(999.0)).isFalse();
        assertThat(EnvironmentalCalculations.isCo2Optimal(1501.0)).isFalse();
        assertThat(EnvironmentalCalculations.isCo2Optimal(800.0)).isFalse();

        // Null should not be optimal
        assertThat(EnvironmentalCalculations.isCo2Optimal(null)).isFalse();
    }

    @Test
    void testIsLightOptimal() {
        // Then: Values within range should be optimal
        assertThat(EnvironmentalCalculations.isLightOptimal(600)).isTrue();
        assertThat(EnvironmentalCalculations.isLightOptimal(400)).isTrue();
        assertThat(EnvironmentalCalculations.isLightOptimal(1000)).isTrue();

        // Values outside range should not be optimal
        assertThat(EnvironmentalCalculations.isLightOptimal(399)).isFalse();
        assertThat(EnvironmentalCalculations.isLightOptimal(1001)).isFalse();
        assertThat(EnvironmentalCalculations.isLightOptimal(300)).isFalse();

        // Null should not be optimal
        assertThat(EnvironmentalCalculations.isLightOptimal(null)).isFalse();
    }
}