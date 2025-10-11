package com.growmanager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.growmanager.entity.Plant.PlantStage;
import com.growmanager.entity.Plant.PlantStatus;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for updating an existing plant.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePlantRequest {

    @Size(max = 100, message = "Plant tag must not exceed 100 characters")
    @JsonProperty("plantTag")
    private String tag;

    private UUID cultivarId;

    @JsonProperty("stage")
    private PlantStage stage;

    @JsonProperty("healthStatus")
    private PlantStatus status;

    private LocalDate plantedDate;

    private String notes;
}
