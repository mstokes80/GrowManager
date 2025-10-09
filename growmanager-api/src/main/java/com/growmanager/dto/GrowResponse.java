package com.growmanager.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.growmanager.entity.Grow;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for grow response.
 * Contains grow information for API responses, including plant count.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GrowResponse {

    private UUID id;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String environmentType;
    private String notes;
    private Long plantCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Converts a Grow entity to GrowResponse DTO.
     *
     * @param grow the grow entity
     * @return the grow response DTO
     */
    public static GrowResponse fromEntity(Grow grow) {
        return GrowResponse.builder()
                .id(grow.getId())
                .name(grow.getName())
                .startDate(grow.getStartDate())
                .endDate(grow.getEndDate())
                .status(grow.getStatus().toString())
                .environmentType(grow.getEnvironmentType() != null ? grow.getEnvironmentType().toString() : null)
                .notes(grow.getNotes())
                .createdAt(grow.getCreatedAt())
                .updatedAt(grow.getUpdatedAt())
                .build();
    }

    /**
     * Converts a Grow entity to GrowResponse DTO with plant count.
     *
     * @param grow the grow entity
     * @param plantCount the number of plants in this grow
     * @return the grow response DTO with plant count
     */
    public static GrowResponse fromEntityWithPlantCount(Grow grow, long plantCount) {
        GrowResponse response = fromEntity(grow);
        response.setPlantCount(plantCount);
        return response;
    }
}
