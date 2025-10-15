package com.growmanager.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for updating an existing observation.
 * All fields are optional - only provided fields will be updated.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateObservationRequest {

    private LocalDateTime timestamp;

    @Size(max = 2000, message = "Note must not exceed 2000 characters")
    private String note;

    private String observationType;

    private List<String> tags;

    /**
     * URLs of photos to remove from the observation.
     * These will be deleted from S3.
     */
    private List<String> photosToRemove;
}