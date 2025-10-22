package com.growmanager.dto;

import com.growmanager.entity.Grow.EnvironmentType;
import com.growmanager.entity.Grow.GrowStatus;
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
 * DTO for updating an existing grow.
 * Note: start_date cannot be updated after creation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGrowRequest {

    @Size(max = 255, message = "Grow name must not exceed 255 characters")
    private String name;

    private LocalDate endDate;

    private GrowStatus status;

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

    @DecimalMin(value = "0.0", message = "Canopy square footage must be at least 0")
    @DecimalMax(value = "10000.0", message = "Canopy square footage must not exceed 10000")
    private BigDecimal canopySquareFt;

    private LocalDate vegetativeDate;

    private LocalDate flowerDate;

    private List<LightEquipmentDTO> lights;

    @Size(max = 1, message = "Temperature unit must be a single character")
    private String tempUom;

    private List<String> tags;

    // Organic growing fields
    private Boolean isOrganic;

    @Size(max = 255, message = "Soil source must not exceed 255 characters")
    private String soilSource;

    @Size(max = 100, message = "Soil texture must not exceed 100 characters")
    private String soilTexture;

    @DecimalMin(value = "0.0", message = "Organic matter percent must be at least 0%")
    @DecimalMax(value = "100.0", message = "Organic matter percent must not exceed 100%")
    private BigDecimal organicMatterPercent;

    @Size(max = 255, message = "Base nutrient profile must not exceed 255 characters")
    private String baseNutrientProfile;

    @Min(value = 0, message = "Soil reused cycles must be at least 0")
    private Integer soilReusedCycles;

    private Boolean mycorrhizaeAdded;

    private List<String> microbeInoculants;

    @Size(max = 255, message = "Cover crop type must not exceed 255 characters")
    private String coverCropType;

    @Size(max = 255, message = "Mulch type must not exceed 255 characters")
    private String mulchType;

    private Boolean compostReused;
}
