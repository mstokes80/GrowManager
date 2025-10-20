package com.growmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for timeline events.
 * Contains all activities for calendar and timeline views.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimelineEventResponse {

    /**
     * List of timeline events.
     */
    private List<TimelineEvent> events;

    /**
     * Growth stage transition milestones.
     */
    private List<Milestone> milestones;

    /**
     * Photo timeline for chronological gallery.
     */
    private List<PhotoEntry> photos;

    /**
     * Single timeline event.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineEvent {
        private String id;
        private String eventType; // "feeding", "watering", "training", "observation", "environmental", "harvest"
        private LocalDateTime timestamp;
        private String growId;
        private String growName;
        private String plantId;
        private String plantTag;
        private String description;
        private EventDetails details; // Type-specific details
    }

    /**
     * Event-specific details.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EventDetails {
        // Feeding event details
        private Double ec;
        private Double ph;
        private Double waterVolume;
        private List<String> nutrients;

        // Activity log details
        private String activityType;
        private String notes;

        // Environmental snapshot details
        private Double temperature;
        private Double humidity;
        private Integer light;

        // Observation details
        private String observationType;
        private List<String> photoUrls;
        private List<String> tags;

        // Harvest details
        private Double wetWeight;
        private Double dryWeight;
    }

    /**
     * Growth stage transition milestone.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Milestone {
        private String id;
        private LocalDateTime timestamp;
        private String plantId;
        private String plantTag;
        private String fromStage;
        private String toStage;
        private Integer daysInStage;
    }

    /**
     * Photo entry for timeline gallery.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PhotoEntry {
        private String observationId;
        private LocalDateTime timestamp;
        private String plantId;
        private String plantTag;
        private String plantStage;
        private String photoUrl;
        private String thumbnailUrl;
        private String caption; // Observation note
    }
}