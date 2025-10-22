package com.growmanager.dto;

import com.growmanager.entity.Harvest.WeightUnit;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for creating a new harvest record.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateHarvestRequest {

    @NotNull(message = "Harvest date is required")
    private LocalDate harvestDate;

    @NotNull(message = "Wet weight is required")
    @DecimalMin(value = "0.01", message = "Wet weight must be greater than 0")
    private BigDecimal wetWeight;

    @DecimalMin(value = "0.01", message = "Dry weight must be greater than 0")
    private BigDecimal dryWeight;

    @DecimalMin(value = "0.01", message = "Hash yield must be greater than 0")
    private BigDecimal hashYield;

    @NotNull(message = "Weight unit is required")
    private WeightUnit weightUnit;

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