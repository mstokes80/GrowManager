package com.growmanager.dto;

import com.growmanager.entity.Observation.ObservationType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for creating a new observation.
 * Note: Photos are uploaded separately via multipart/form-data.
 * Plant ID is provided as a path variable in the endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateObservationRequest {

    @NotNull(message = "Observation type is required")
    private ObservationType observationType;

    @Size(max = 2000, message = "Note must not exceed 2000 characters")
    private String note;

    private List<String> tags;

    private LocalDateTime timestamp;
}