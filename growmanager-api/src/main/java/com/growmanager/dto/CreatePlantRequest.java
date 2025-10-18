package com.growmanager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.growmanager.entity.Plant;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for creating a new plant.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePlantRequest {

    @Size(max = 100, message = "Plant tag must not exceed 100 characters")
    @JsonProperty("plantTag")
    private String tag;

    private UUID cultivarId;

    private LocalDate plantedDate;

    @JsonProperty("stage")
    private Plant.PlantStage stage;

    @JsonProperty("healthStatus")
    private Plant.PlantStatus status;

    private String notes;
}
