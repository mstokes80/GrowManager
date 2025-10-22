package com.growmanager.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.growmanager.entity.EnvironmentalSnapshot;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for environmental snapshot response.
 * Contains environmental condition measurements.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EnvironmentalSnapshotResponse {

    private UUID id;
    private UUID growId;
    private UUID plantId;
    private LocalDateTime timestamp;
    private BigDecimal temperature;
    private BigDecimal humidity;
    private BigDecimal co2;
    private BigDecimal lightIntensity;
    private BigDecimal vpd;
    private BigDecimal soilMoisture;
    private String source;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Converts an EnvironmentalSnapshot entity to EnvironmentalSnapshotResponse DTO.
     *
     * @param snapshot the environmental snapshot entity
     * @return the environmental snapshot response DTO
     */
    public static EnvironmentalSnapshotResponse fromEntity(EnvironmentalSnapshot snapshot) {
        return EnvironmentalSnapshotResponse.builder()
                .id(snapshot.getId())
                .growId(snapshot.getGrow().getId())
                .plantId(snapshot.getPlant() != null ? snapshot.getPlant().getId() : null)
                .timestamp(snapshot.getTimestamp())
                .temperature(snapshot.getTemperature())
                .humidity(snapshot.getHumidity())
                .co2(snapshot.getCo2())
                .lightIntensity(snapshot.getLightIntensity())
                .vpd(snapshot.getVpd())
                .soilMoisture(snapshot.getSoilMoisture())
                .source(snapshot.getSource().toString())
                .notes(snapshot.getNotes())
                .createdAt(snapshot.getCreatedAt())
                .updatedAt(snapshot.getUpdatedAt())
                .build();
    }
}
