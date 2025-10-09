package com.growmanager.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import com.growmanager.entity.Cultivar;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for cultivar response.
 * Contains cultivar information for API responses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CultivarResponse {

    private UUID id;
    private String name;
    private String breeder;
    private String genetics;
    private String type;
    private JsonNode characteristics;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Converts a Cultivar entity to CultivarResponse DTO.
     *
     * @param cultivar the cultivar entity
     * @return the cultivar response DTO
     */
    public static CultivarResponse fromEntity(Cultivar cultivar) {
        return CultivarResponse.builder()
                .id(cultivar.getId())
                .name(cultivar.getName())
                .breeder(cultivar.getBreeder())
                .genetics(cultivar.getGenetics())
                .type(cultivar.getType().toString())
                .characteristics(cultivar.getCharacteristics())
                .notes(cultivar.getNotes())
                .createdAt(cultivar.getCreatedAt())
                .updatedAt(cultivar.getUpdatedAt())
                .build();
    }
}
