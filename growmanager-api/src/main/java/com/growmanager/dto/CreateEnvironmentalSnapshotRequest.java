package com.growmanager.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for creating a new environmental snapshot.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEnvironmentalSnapshotRequest {

    private LocalDateTime timestamp;

    @DecimalMin(value = "-50.0", message = "Temperature must be at least -50°C")
    @DecimalMax(value = "100.0", message = "Temperature must not exceed 100°C")
    private BigDecimal temperature;

    @DecimalMin(value = "0.0", message = "Humidity must be at least 0%")
    @DecimalMax(value = "100.0", message = "Humidity must not exceed 100%")
    private BigDecimal humidity;

    @DecimalMin(value = "0.0", message = "CO2 must be at least 0 ppm")
    @DecimalMax(value = "5000.0", message = "CO2 must not exceed 5000 ppm")
    private BigDecimal co2;

    @DecimalMin(value = "0.0", message = "Light intensity must be at least 0 PPFD")
    @DecimalMax(value = "2000.0", message = "Light intensity must not exceed 2000 PPFD")
    private BigDecimal lightIntensity;

    @DecimalMin(value = "0.0", message = "Soil moisture must be at least 0 kPa")
    @DecimalMax(value = "200.0", message = "Soil moisture must not exceed 200 kPa")
    private BigDecimal soilMoisture;

    private String notes;
}
