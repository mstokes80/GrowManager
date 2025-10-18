package com.growmanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for creating and updating activity logs.
 * Represents plant training and maintenance activities.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogRequestDTO {

    @NotBlank(message = "Activity type is required and cannot be blank")
    private String activityType;

    @NotBlank(message = "Description is required and cannot be blank")
    private String description;

    private String notes;

    @NotNull(message = "Logged at timestamp is required")
    @Builder.Default
    private LocalDateTime loggedAt = LocalDateTime.now();

    /**
     * If true, this activity will be applied to all plants in the same grow.
     * Creates duplicate activity logs for each plant with the same data.
     */
    @Builder.Default
    private Boolean applyToAllPlants = false;
}