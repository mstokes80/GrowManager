package com.growmanager.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for updating an existing harvest record.
 * Note: harvestDate and wetWeight are immutable and cannot be updated.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateHarvestRequest {

    @DecimalMin(value = "0.01", message = "Dry weight must be greater than 0")
    private BigDecimal dryWeight;

    @DecimalMin(value = "0.0", message = "THC percentage must be at least 0")
    @DecimalMax(value = "100.0", message = "THC percentage must not exceed 100")
    private BigDecimal thcPercent;

    @DecimalMin(value = "0.0", message = "CBD percentage must be at least 0")
    @DecimalMax(value = "100.0", message = "CBD percentage must not exceed 100")
    private BigDecimal cbdPercent;

    private String terpeneProfile;

    @Min(value = 1, message = "Quality rating must be at least 1")
    @Max(value = 10, message = "Quality rating must not exceed 10")
    private Integer qualityRating;

    @Size(max = 2000, message = "Notes must not exceed 2000 characters")
    private String notes;
}