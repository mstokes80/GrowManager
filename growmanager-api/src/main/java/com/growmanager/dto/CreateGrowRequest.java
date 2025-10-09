package com.growmanager.dto;

import com.growmanager.entity.Grow.EnvironmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

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
}
