package com.growmanager.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.growmanager.entity.FeedingEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
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

    private static final Logger logger = LoggerFactory.getLogger(FeedingEventResponseDTO.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

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
    private List<AmendmentDTO> amendments;
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
        // Deserialize amendments from JSON string
        List<AmendmentDTO> amendmentsList = null;
        if (feedingEvent.getAmendments() != null && !feedingEvent.getAmendments().trim().isEmpty()) {
            try {
                amendmentsList = objectMapper.readValue(
                        feedingEvent.getAmendments(),
                        new TypeReference<List<AmendmentDTO>>() {}
                );
            } catch (Exception e) {
                logger.error("Failed to deserialize amendments JSON for feeding event ID: {}",
                        feedingEvent.getId(), e);
                amendmentsList = Collections.emptyList();
            }
        }

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
                .amendments(amendmentsList)
                .fedAt(feedingEvent.getFedAt())
                .createdAt(feedingEvent.getCreatedAt())
                .updatedAt(feedingEvent.getUpdatedAt())
                .build();
    }
}