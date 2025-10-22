package com.growmanager.entity;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.growmanager.config.WeightUnitDeserializer;
import com.growmanager.config.WeightUnitSerializer;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Harvest entity representing harvest records for plants.
 * Tracks harvest data including weights, potency, quality, and terpene profiles.
 */
@Entity
@Table(name = "harvests",
        indexes = {
                @Index(name = "idx_harvests_plant_id", columnList = "plant_id"),
                @Index(name = "idx_harvests_grow_id", columnList = "grow_id"),
                @Index(name = "idx_harvests_harvest_date", columnList = "harvest_date"),
                @Index(name = "idx_harvests_updated_at", columnList = "updated_at")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"plant", "grow"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Harvest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @NotNull(message = "Plant is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plant_id", nullable = false, foreignKey = @ForeignKey(name = "fk_harvests_plant"))
    private Plant plant;

    @NotNull(message = "Grow is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grow_id", nullable = false, foreignKey = @ForeignKey(name = "fk_harvests_grow"))
    private Grow grow;

    @NotNull(message = "Harvest date is required")
    @Column(name = "harvest_date", nullable = false)
    private LocalDate harvestDate;

    @NotNull(message = "Wet weight is required")
    @DecimalMin(value = "0.01", message = "Wet weight must be greater than 0")
    @Column(name = "wet_weight", nullable = false, precision = 8, scale = 2)
    private BigDecimal wetWeight;

    @DecimalMin(value = "0.01", message = "Dry weight must be greater than 0")
    @Column(name = "dry_weight", precision = 8, scale = 2)
    private BigDecimal dryWeight;

    @DecimalMin(value = "0.01", message = "Hash yield must be greater than 0")
    @Column(name = "hash_yield", precision = 8, scale = 2)
    private BigDecimal hashYield;

    @NotNull(message = "Weight unit is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "weight_unit", nullable = false, length = 10)
    @Builder.Default
    private WeightUnit weightUnit = WeightUnit.GRAMS;

    @DecimalMin(value = "0.0", message = "THC percentage must be at least 0")
    @DecimalMax(value = "100.0", message = "THC percentage must not exceed 100")
    @Column(name = "thc_percent", precision = 4, scale = 2)
    private BigDecimal thcPercent;

    @DecimalMin(value = "0.0", message = "CBD percentage must be at least 0")
    @DecimalMax(value = "100.0", message = "CBD percentage must not exceed 100")
    @Column(name = "cbd_percent", precision = 4, scale = 2)
    private BigDecimal cbdPercent;

    @Column(name = "terpene_profile", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String terpeneProfile;

    @Min(value = 1, message = "Quality rating must be at least 1")
    @Max(value = 10, message = "Quality rating must not exceed 10")
    @Column(name = "quality_rating")
    private Integer qualityRating;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Enum representing weight unit values.
     */
    @JsonSerialize(using = WeightUnitSerializer.class)
    @JsonDeserialize(using = WeightUnitDeserializer.class)
    public enum WeightUnit {
        GRAMS("grams"),
        OUNCES("ounces");

        private final String value;

        WeightUnit(String value) {
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
     * JPA lifecycle callback - called before persisting a new entity.
     * Sets the creation and update timestamps.
     */
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;

        // Ensure defaults are set
        if (weightUnit == null) {
            weightUnit = WeightUnit.GRAMS;
        }
        if (harvestDate == null) {
            harvestDate = LocalDate.now();
        }
    }

    /**
     * JPA lifecycle callback - called before updating an existing entity.
     * Updates the update timestamp.
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}