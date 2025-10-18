package com.growmanager.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FeedingEvent entity representing feeding and watering events for plants.
 * Tracks when plants are watered, fed nutrients, or receive foliar applications.
 */
@Entity
@Table(name = "feeding_events", indexes = {
        @Index(name = "idx_feeding_events_plant_id", columnList = "plant_id"),
        @Index(name = "idx_feeding_events_user_id", columnList = "user_id"),
        @Index(name = "idx_feeding_events_fed_at", columnList = "fed_at"),
        @Index(name = "idx_feeding_events_plant_id_fed_at", columnList = "plant_id, fed_at"),
        @Index(name = "idx_feeding_events_feeding_type", columnList = "feeding_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"plant", "user"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class FeedingEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @NotNull(message = "Plant is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plant_id", nullable = false, foreignKey = @ForeignKey(name = "fk_feeding_events_plant"))
    private Plant plant;

    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_feeding_events_user"))
    private User user;

    @NotNull(message = "Feeding type is required")
    @Convert(converter = FeedingTypeConverter.class)
    @Column(name = "feeding_type", nullable = false, length = 20)
    private FeedingType feedingType;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Amount must be greater than 0")
    @Column(name = "amount_ml", nullable = false, precision = 10, scale = 2)
    private BigDecimal amountMl;

    @DecimalMin(value = "0.0", message = "EC level must be at least 0 mS/cm")
    @DecimalMax(value = "10.0", message = "EC level must not exceed 10 mS/cm")
    @Column(name = "ec_level", precision = 5, scale = 2)
    private BigDecimal ecLevel;

    @DecimalMin(value = "0.0", message = "pH level must be at least 0")
    @DecimalMax(value = "14.0", message = "pH level must not exceed 14")
    @Column(name = "ph_level", precision = 4, scale = 2)
    private BigDecimal phLevel;

    @Column(name = "nutrient_mix", columnDefinition = "TEXT")
    private String nutrientMix;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "amendments", columnDefinition = "jsonb")
    private String amendments;

    @NotNull(message = "Fed at timestamp is required")
    @Column(name = "fed_at", nullable = false)
    @Builder.Default
    private LocalDateTime fedAt = LocalDateTime.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Enum representing feeding event types.
     */
    public enum FeedingType {
        WATERING("watering"),
        NUTRIENTS("nutrients"),
        FOLIAR("foliar");

        private final String value;

        FeedingType(String value) {
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
     * Checks if this feeding event includes nutrients.
     *
     * @return true if the feeding type is NUTRIENTS or FOLIAR
     */
    public boolean includesNutrients() {
        return feedingType == FeedingType.NUTRIENTS || feedingType == FeedingType.FOLIAR;
    }

    /**
     * Checks if EC and pH levels are within optimal ranges for cannabis.
     * Optimal EC: 1.2-2.0 mS/cm, Optimal pH: 5.5-6.5
     *
     * @return true if both levels are within optimal range
     */
    public boolean isOptimalForCannabis() {
        boolean ecOptimal = ecLevel == null ||
                (ecLevel.compareTo(BigDecimal.valueOf(1.2)) >= 0 &&
                        ecLevel.compareTo(BigDecimal.valueOf(2.0)) <= 0);

        boolean phOptimal = phLevel == null ||
                (phLevel.compareTo(BigDecimal.valueOf(5.5)) >= 0 &&
                        phLevel.compareTo(BigDecimal.valueOf(6.5)) <= 0);

        return ecOptimal && phOptimal;
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
        if (fedAt == null) {
            fedAt = now;
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