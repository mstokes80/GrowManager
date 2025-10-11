package com.growmanager.entity;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.growmanager.config.PlantStageDeserializer;
import com.growmanager.config.PlantStageSerializer;
import com.growmanager.config.PlantStatusDeserializer;
import com.growmanager.config.PlantStatusSerializer;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Plant entity representing individual plants within grow cycles.
 * Tracks plant-specific information, growth stages, and status.
 */
@Entity
@Table(name = "plants",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_plants_grow_id_tag", columnNames = {"grow_id", "tag"})
        },
        indexes = {
                @Index(name = "idx_plants_grow_id", columnList = "grow_id"),
                @Index(name = "idx_plants_cultivar_id", columnList = "cultivar_id"),
                @Index(name = "idx_plants_stage", columnList = "stage"),
                @Index(name = "idx_plants_status", columnList = "status"),
                @Index(name = "idx_plants_updated_at", columnList = "updated_at")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"grow", "cultivar"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Plant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @NotNull(message = "Grow is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grow_id", nullable = false, foreignKey = @ForeignKey(name = "fk_plants_grow"))
    private Grow grow;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cultivar_id", foreignKey = @ForeignKey(name = "fk_plants_cultivar"))
    private Cultivar cultivar;

    @NotNull(message = "Plant tag is required")
    @Size(max = 100, message = "Plant tag must not exceed 100 characters")
    @Column(name = "tag", nullable = false, length = 100)
    private String tag;

    @NotNull(message = "Plant stage is required")
    @Column(name = "stage", nullable = false, length = 20)
    @Builder.Default
    private PlantStage stage = PlantStage.SEEDLING;

    @NotNull(message = "Plant status is required")
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PlantStatus status = PlantStatus.ACTIVE;

    @Column(name = "planted_date")
    private LocalDate plantedDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Enum representing plant growth stages.
     */
    @JsonSerialize(using = PlantStageSerializer.class)
    @JsonDeserialize(using = PlantStageDeserializer.class)
    public enum PlantStage {
        SEEDLING("seedling"),
        VEGETATIVE("vegetative"),
        FLOWERING("flowering"),
        HARVEST("harvest");

        private final String value;

        PlantStage(String value) {
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
     * Enum representing plant status.
     */
    @JsonSerialize(using = PlantStatusSerializer.class)
    @JsonDeserialize(using = PlantStatusDeserializer.class)
    public enum PlantStatus {
        ACTIVE("active"),
        HARVESTED("harvested"),
        REMOVED("removed"),
        DEAD("dead");

        private final String value;

        PlantStatus(String value) {
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
     * Advances the plant to the next growth stage.
     *
     * @param newStage the new growth stage
     */
    public void advanceStage(PlantStage newStage) {
        this.stage = newStage;
    }

    /**
     * Marks the plant as harvested.
     */
    public void harvest() {
        this.status = PlantStatus.HARVESTED;
        this.stage = PlantStage.HARVEST;
    }

    /**
     * Checks if the plant is currently active.
     *
     * @return true if the plant status is ACTIVE
     */
    public boolean isActive() {
        return status == PlantStatus.ACTIVE;
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
        if (stage == null) {
            stage = PlantStage.SEEDLING;
        }
        if (status == null) {
            status = PlantStatus.ACTIVE;
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
