package com.growmanager.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.growmanager.entity.ActivityLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for activity log responses.
 * Contains activity log information for API responses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ActivityLogResponseDTO {

    private UUID id;
    private UUID plantId;
    private String plantTag;
    private UUID userId;
    private String activityType;
    private String description;
    private String notes;
    private LocalDateTime loggedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Converts an ActivityLog entity to ActivityLogResponseDTO.
     *
     * @param activityLog the activity log entity
     * @return the activity log response DTO
     */
    public static ActivityLogResponseDTO fromEntity(ActivityLog activityLog) {
        return ActivityLogResponseDTO.builder()
                .id(activityLog.getId())
                .plantId(activityLog.getPlant().getId())
                .plantTag(activityLog.getPlant().getTag())
                .userId(activityLog.getUser().getId())
                .activityType(activityLog.getActivityType().toString())
                .description(activityLog.getDescription())
                .notes(activityLog.getNotes())
                .loggedAt(activityLog.getLoggedAt())
                .createdAt(activityLog.getCreatedAt())
                .updatedAt(activityLog.getUpdatedAt())
                .build();
    }
}