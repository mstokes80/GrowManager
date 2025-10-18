package com.growmanager.dto;

import com.growmanager.entity.Harvest;
import com.growmanager.entity.Harvest.WeightUnit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for harvest response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HarvestResponse {

    private UUID id;
    private UUID plantId;
    private String plantTag;
    private UUID growId;
    private String cultivarName;
    private LocalDate harvestDate;
    private BigDecimal wetWeight;
    private BigDecimal dryWeight;
    private WeightUnit weightUnit;
    private BigDecimal thcPercent;
    private BigDecimal cbdPercent;
    private String terpeneProfile;
    private Integer qualityRating;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Creates a HarvestResponse from a Harvest entity.
     *
     * @param harvest the harvest entity
     * @return the harvest response DTO
     */
    public static HarvestResponse fromEntity(Harvest harvest) {
        return HarvestResponse.builder()
                .id(harvest.getId())
                .plantId(harvest.getPlant().getId())
                .plantTag(harvest.getPlant().getTag())
                .growId(harvest.getGrow().getId())
                .cultivarName(harvest.getPlant().getCultivar() != null
                        ? harvest.getPlant().getCultivar().getName()
                        : null)
                .harvestDate(harvest.getHarvestDate())
                .wetWeight(harvest.getWetWeight())
                .dryWeight(harvest.getDryWeight())
                .weightUnit(harvest.getWeightUnit())
                .thcPercent(harvest.getThcPercent())
                .cbdPercent(harvest.getCbdPercent())
                .terpeneProfile(harvest.getTerpeneProfile())
                .qualityRating(harvest.getQualityRating())
                .notes(harvest.getNotes())
                .createdAt(harvest.getCreatedAt())
                .updatedAt(harvest.getUpdatedAt())
                .build();
    }
}