package com.growmanager.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.growmanager.entity.Cultivar.CultivarType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating a new cultivar.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCultivarRequest {

    @NotBlank(message = "Cultivar name is required")
    @Size(max = 255, message = "Cultivar name must not exceed 255 characters")
    private String name;

    @Size(max = 255, message = "Breeder name must not exceed 255 characters")
    private String breeder;

    private String genetics;

    @NotNull(message = "Cultivar type is required")
    private CultivarType type;

    private JsonNode characteristics;

    private String notes;
}
