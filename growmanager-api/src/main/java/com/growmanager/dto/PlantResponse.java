package com.growmanager.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.growmanager.entity.Plant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for plant response.
 * Contains plant information for API responses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PlantResponse {

    private UUID id;
    private UUID growId;
    private UUID cultivarId;
    private String cultivarName;

    @JsonProperty("plantTag")
    private String tag;

    private String stage;

    @JsonProperty("healthStatus")
    private String status;

    private LocalDate plantedDate;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Converts a Plant entity to PlantResponse DTO.
     *
     * @param plant the plant entity
     * @return the plant response DTO
     */
    public static PlantResponse fromEntity(Plant plant) {
        return PlantResponse.builder()
                .id(plant.getId())
                .growId(plant.getGrow().getId())
                .cultivarId(plant.getCultivar() != null ? plant.getCultivar().getId() : null)
                .cultivarName(plant.getCultivar() != null ? plant.getCultivar().getName() : null)
                .tag(plant.getTag())
                .stage(plant.getStage().toString())
                .status(plant.getStatus().toString())
                .plantedDate(plant.getPlantedDate())
                .notes(plant.getNotes())
                .createdAt(plant.getCreatedAt())
                .updatedAt(plant.getUpdatedAt())
                .build();
    }
}
