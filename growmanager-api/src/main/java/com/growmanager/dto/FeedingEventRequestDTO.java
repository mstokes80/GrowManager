package com.growmanager.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for creating and updating feeding events.
 * Includes validation annotations for all fields.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedingEventRequestDTO {

    @NotNull(message = "Feeding type is required")
    @Pattern(regexp = "^(watering|nutrients|foliar)$",
             message = "Feeding type must be one of: watering, nutrients, foliar")
    private String feedingType;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Amount must be greater than 0")
    @Positive(message = "Amount must be positive")
    private BigDecimal amountMl;

    @DecimalMin(value = "0.0", message = "EC level must be at least 0 mS/cm")
    @DecimalMax(value = "10.0", message = "EC level must not exceed 10 mS/cm")
    private BigDecimal ecLevel;

    @DecimalMin(value = "0.0", message = "pH level must be at least 0")
    @DecimalMax(value = "14.0", message = "pH level must not exceed 14")
    private BigDecimal phLevel;

    @Size(max = 1000, message = "Nutrient mix description must not exceed 1000 characters")
    private String nutrientMix;

    @Size(max = 2000, message = "Notes must not exceed 2000 characters")
    private String notes;

    private LocalDateTime fedAt;

    /**
     * If true, this feeding event will be applied to all plants in the same grow.
     * Creates duplicate events for each plant with the same data.
     */
    @Builder.Default
    private Boolean applyToAllPlants = false;
}