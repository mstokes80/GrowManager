package com.growmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for harvest summary response with aggregate statistics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HarvestSummaryResponse {

    private Long totalPlantsHarvested;
    private BigDecimal totalWetWeight;
    private BigDecimal totalDryWeight;
    private Double averageQuality;
    private List<HarvestResponse> harvests;
}