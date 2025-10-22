package com.growmanager.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for light equipment used in grows.
 * Represents lighting fixtures with their wattage specifications.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LightEquipmentDTO {

    @NotBlank(message = "Light name is required")
    private String name;

    @NotNull(message = "Wattage is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Wattage must be greater than 0")
    private BigDecimal wattage;
}