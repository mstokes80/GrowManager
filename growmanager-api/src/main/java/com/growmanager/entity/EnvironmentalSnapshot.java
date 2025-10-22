package com.growmanager.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * EnvironmentalSnapshot entity representing environmental condition measurements.
 * Stores temperature, humidity, CO2, light intensity, VPD, and soil moisture readings.
 */
@Entity
@Table(name = "environmental_snapshots", indexes = {
        @Index(name = "idx_environmental_snapshots_grow_id", columnList = "grow_id"),
        @Index(name = "idx_environmental_snapshots_plant_id", columnList = "plant_id"),
        @Index(name = "idx_environmental_snapshots_timestamp", columnList = "timestamp"),
        @Index(name = "idx_environmental_snapshots_grow_id_timestamp", columnList = "grow_id, timestamp"),
        @Index(name = "idx_environmental_snapshots_source", columnList = "source")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"grow", "plant"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class EnvironmentalSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @NotNull(message = "Grow is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grow_id", nullable = false, foreignKey = @ForeignKey(name = "fk_environmental_snapshots_grow"))
    private Grow grow;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id", foreignKey = @ForeignKey(name = "fk_environmental_snapshots_plant"))
    private Plant plant;

    @NotNull(message = "Timestamp is required")
    @Column(name = "timestamp", nullable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    @DecimalMin(value = "-50.0", message = "Temperature must be at least -50°C")
    @DecimalMax(value = "100.0", message = "Temperature must not exceed 100°C")
    @Column(name = "temperature", precision = 5, scale = 2)
    private BigDecimal temperature;

    @DecimalMin(value = "0.0", message = "Humidity must be at least 0%")
    @DecimalMax(value = "100.0", message = "Humidity must not exceed 100%")
    @Column(name = "humidity", precision = 5, scale = 2)
    private BigDecimal humidity;

    @DecimalMin(value = "0.0", message = "CO2 must be at least 0 ppm")
    @DecimalMax(value = "5000.0", message = "CO2 must not exceed 5000 ppm")
    @Column(name = "co2", precision = 7, scale = 2)
    private BigDecimal co2;

    @DecimalMin(value = "0.0", message = "Light intensity must be at least 0 PPFD")
    @DecimalMax(value = "2000.0", message = "Light intensity must not exceed 2000 PPFD")
    @Column(name = "light_intensity", precision = 8, scale = 2)
    private BigDecimal lightIntensity;

    @DecimalMin(value = "0.0", message = "VPD must be at least 0 kPa")
    @DecimalMax(value = "5.0", message = "VPD must not exceed 5.0 kPa")
    @Column(name = "vpd", precision = 5, scale = 2)
    private BigDecimal vpd;

    @DecimalMin(value = "0.0", message = "Soil moisture must be at least 0 kPa")
    @DecimalMax(value = "200.0", message = "Soil moisture must not exceed 200 kPa")
    @Column(name = "soil_moisture", precision = 6, scale = 2)
    private BigDecimal soilMoisture;

    @NotNull(message = "Source is required")
    @Convert(converter = SnapshotSourceConverter.class)
    @Column(name = "source", nullable = false, length = 20)
    @Builder.Default
    private SnapshotSource source = SnapshotSource.MANUAL;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Enum representing the source of environmental data.
     */
    public enum SnapshotSource {
        MANUAL("manual"),
        SENSOR("sensor");

        private final String value;

        SnapshotSource(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        @Override
        public String toString() {
            return value;
        }
    }

    /**
     * Calculates VPD (Vapor Pressure Deficit) based on temperature and humidity.
     * VPD = SVP × (1 - RH/100)
     * where SVP = 0.6108 × exp(17.27 × T / (T + 237.3))
     *
     * @return the calculated VPD in kPa, or null if temp or humidity is missing
     */
    public BigDecimal calculateVpd() {
        if (temperature == null || humidity == null) {
            return null;
        }

        double temp = temperature.doubleValue();
        double rh = humidity.doubleValue();

        // Calculate Saturation Vapor Pressure (SVP) using Tetens formula
        double svp = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));

        // Calculate VPD
        double vpdValue = svp * (1 - rh / 100);

        return BigDecimal.valueOf(vpdValue).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    /**
     * Automatically calculates and sets VPD if temperature and humidity are present.
     */
    public void autoCalculateVpd() {
        BigDecimal calculatedVpd = calculateVpd();
        if (calculatedVpd != null) {
            this.vpd = calculatedVpd;
        }
    }

    /**
     * JPA lifecycle callback - called before persisting a new entity.
     * Sets the creation and update timestamps.
     */
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;

        // Ensure defaults are set
        if (timestamp == null) {
            timestamp = now;
        }
        if (source == null) {
            source = SnapshotSource.MANUAL;
        }

        // Auto-calculate VPD if not set
        if (vpd == null && temperature != null && humidity != null) {
            autoCalculateVpd();
        }
    }

    /**
     * JPA lifecycle callback - called before updating an existing entity.
     * Updates the update timestamp.
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();

        // Recalculate VPD if temperature or humidity changed
        if (temperature != null && humidity != null) {
            autoCalculateVpd();
        }
    }
}
