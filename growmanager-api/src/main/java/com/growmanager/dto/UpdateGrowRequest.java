package com.growmanager.dto;

import com.growmanager.entity.Grow.EnvironmentType;
import com.growmanager.entity.Grow.GrowStatus;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

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
}
