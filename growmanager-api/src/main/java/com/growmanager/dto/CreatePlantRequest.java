package com.growmanager.dto;

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
    private String tag;

    private UUID cultivarId;

    private LocalDate plantedDate;

    private String notes;
}
