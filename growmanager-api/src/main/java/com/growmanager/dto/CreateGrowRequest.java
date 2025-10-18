package com.growmanager.dto;

import com.growmanager.entity.Grow.EnvironmentType;
import com.growmanager.entity.Grow.LightingType;
import com.growmanager.entity.Grow.MediumType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO for creating a new grow.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGrowRequest {

    @NotBlank(message = "Grow name is required")
    @Size(max = 255, message = "Grow name must not exceed 255 characters")
    private String name;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private EnvironmentType environmentType;

    private String notes;

    private LightingType lightingType;

    private MediumType mediumType;

    @Size(max = 255, message = "Location must not exceed 255 characters")
    private String location;

    @DecimalMin(value = "-50.0", message = "Target minimum temperature must be at least -50°C")
    @DecimalMax(value = "100.0", message = "Target minimum temperature must not exceed 100°C")
    private BigDecimal targetTempMin;

    @DecimalMin(value = "-50.0", message = "Target maximum temperature must be at least -50°C")
    @DecimalMax(value = "100.0", message = "Target maximum temperature must not exceed 100°C")
    private BigDecimal targetTempMax;

    @DecimalMin(value = "0.0", message = "Target minimum humidity must be at least 0%")
    @DecimalMax(value = "100.0", message = "Target minimum humidity must not exceed 100%")
    private BigDecimal targetHumidityMin;

    @DecimalMin(value = "0.0", message = "Target maximum humidity must be at least 0%")
    @DecimalMax(value = "100.0", message = "Target maximum humidity must not exceed 100%")
    private BigDecimal targetHumidityMax;

    private LocalDate expectedHarvestDate;

    private List<String> tags;
}
