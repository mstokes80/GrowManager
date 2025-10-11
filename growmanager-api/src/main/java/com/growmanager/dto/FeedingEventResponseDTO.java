package com.growmanager.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.growmanager.entity.FeedingEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for feeding event API responses.
 * Contains all feeding event information with lowercase enum values.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FeedingEventResponseDTO {

    private UUID id;
    private UUID plantId;
    private String plantTag;
    private UUID userId;
    private String feedingType;
    private BigDecimal amountMl;
    private BigDecimal ecLevel;
    private BigDecimal phLevel;
    private String nutrientMix;
    private String notes;
    private LocalDateTime fedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Converts a FeedingEvent entity to FeedingEventResponseDTO.
     *
     * @param feedingEvent the feeding event entity
     * @return the feeding event response DTO
     */
    public static FeedingEventResponseDTO fromEntity(FeedingEvent feedingEvent) {
        return FeedingEventResponseDTO.builder()
                .id(feedingEvent.getId())
                .plantId(feedingEvent.getPlant().getId())
                .plantTag(feedingEvent.getPlant().getTag())
                .userId(feedingEvent.getUser().getId())
                .feedingType(feedingEvent.getFeedingType().toString())
                .amountMl(feedingEvent.getAmountMl())
                .ecLevel(feedingEvent.getEcLevel())
                .phLevel(feedingEvent.getPhLevel())
                .nutrientMix(feedingEvent.getNutrientMix())
                .notes(feedingEvent.getNotes())
                .fedAt(feedingEvent.getFedAt())
                .createdAt(feedingEvent.getCreatedAt())
                .updatedAt(feedingEvent.getUpdatedAt())
                .build();
    }
}