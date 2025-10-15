package com.growmanager.dto;

import com.growmanager.entity.Observation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * DTO for observation responses.
 * Returns observation data with photo URLs organized by type.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ObservationResponse {

    private UUID id;
    private UUID plantId;
    private String plantName;
    private LocalDateTime timestamp;
    private String note;
    private String observationType;
    private List<PhotoUrl> photos;
    private List<String> tags;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Photo URL structure with full-size and thumbnail URLs.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PhotoUrl {
        private String fullSizeUrl;
        private String thumbnailUrl;
    }

    /**
     * Converts an Observation entity to an ObservationResponse DTO.
     *
     * @param observation the observation entity
     * @return the response DTO
     */
    public static ObservationResponse fromEntity(Observation observation) {
        List<PhotoUrl> photoList = new ArrayList<>();

        // Convert photo URL array to structured list
        // Photos are stored as pairs: [full1, thumb1, full2, thumb2, ...]
        if (observation.getPhotos() != null) {
            String[] photos = observation.getPhotos();
            for (int i = 0; i < photos.length; i += 2) {
                if (i + 1 < photos.length) {
                    photoList.add(PhotoUrl.builder()
                            .fullSizeUrl(photos[i])
                            .thumbnailUrl(photos[i + 1])
                            .build());
                }
            }
        }

        List<String> tagsList = observation.getTags() != null
                ? List.of(observation.getTags())
                : new ArrayList<>();

        return ObservationResponse.builder()
                .id(observation.getId())
                .plantId(observation.getPlant().getId())
                .plantName(observation.getPlant().getTag())
                .timestamp(observation.getTimestamp())
                .note(observation.getNote())
                .observationType(observation.getObservationType().getValue())
                .photos(photoList)
                .tags(tagsList)
                .createdAt(observation.getCreatedAt())
                .updatedAt(observation.getUpdatedAt())
                .build();
    }
}