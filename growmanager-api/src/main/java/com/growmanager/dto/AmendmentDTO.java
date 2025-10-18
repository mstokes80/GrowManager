package com.growmanager.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for soil amendments used in feeding events.
 * Represents organic inputs like kelp meal, dolomite lime, etc.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AmendmentDTO {

    @NotBlank(message = "Amendment name is required")
    private String name;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotBlank(message = "Unit is required")
    @Pattern(
        regexp = "^(teaspoons|tablespoons|cups|grams|kilograms|ounces|pounds|milliliters|liters)$",
        message = "Unit must be one of: teaspoons, tablespoons, cups, grams, kilograms, ounces, pounds, milliliters, liters"
    )
    private String unit;
}