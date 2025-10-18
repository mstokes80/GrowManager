package com.growmanager.entity;

import com.fasterxml.jackson.annotation.JsonValue;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.growmanager.config.EnvironmentTypeDeserializer;
import com.growmanager.config.EnvironmentTypeSerializer;
import com.growmanager.config.GrowStatusDeserializer;
import com.growmanager.config.GrowStatusSerializer;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Grow entity representing grow cycles/projects in the database.
 * Tracks cultivation cycles from planning through completion.
 */
@Entity
@Table(name = "grows", indexes = {
        @Index(name = "idx_grows_user_id", columnList = "user_id"),
        @Index(name = "idx_grows_status", columnList = "status"),
        @Index(name = "idx_grows_user_id_status", columnList = "user_id, status"),
        @Index(name = "idx_grows_updated_at", columnList = "updated_at"),
        @Index(name = "idx_grows_start_date", columnList = "start_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user", "plants"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Grow {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_grows_user"))
    private User user;

    @NotNull(message = "Grow name is required")
    @Size(max = 255, message = "Grow name must not exceed 255 characters")
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @NotNull(message = "Start date is required")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @NotNull(message = "Status is required")
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private GrowStatus status = GrowStatus.PLANNING;

    @Column(name = "environment_type", length = 20)
    private EnvironmentType environmentType;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Convert(converter = com.growmanager.config.LightingTypeConverter.class)
    @Column(name = "lighting_type", length = 20)
    private LightingType lightingType;

    @Convert(converter = com.growmanager.config.MediumTypeConverter.class)
    @Column(name = "medium_type", length = 20)
    private MediumType mediumType;

    @Size(max = 255, message = "Location must not exceed 255 characters")
    @Column(name = "location", length = 255)
    private String location;

    @DecimalMin(value = "-50.0", message = "Target minimum temperature must be at least -50°C")
    @DecimalMax(value = "100.0", message = "Target minimum temperature must not exceed 100°C")
    @Column(name = "target_temp_min", precision = 5, scale = 2)
    private BigDecimal targetTempMin;

    @DecimalMin(value = "-50.0", message = "Target maximum temperature must be at least -50°C")
    @DecimalMax(value = "100.0", message = "Target maximum temperature must not exceed 100°C")
    @Column(name = "target_temp_max", precision = 5, scale = 2)
    private BigDecimal targetTempMax;

    @DecimalMin(value = "0.0", message = "Target minimum humidity must be at least 0%")
    @DecimalMax(value = "100.0", message = "Target minimum humidity must not exceed 100%")
    @Column(name = "target_humidity_min", precision = 5, scale = 2)
    private BigDecimal targetHumidityMin;

    @DecimalMin(value = "0.0", message = "Target maximum humidity must be at least 0%")
    @DecimalMax(value = "100.0", message = "Target maximum humidity must not exceed 100%")
    @Column(name = "target_humidity_max", precision = 5, scale = 2)
    private BigDecimal targetHumidityMax;

    @Column(name = "expected_harvest_date")
    private LocalDate expectedHarvestDate;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "jsonb")
    private List<String> tags;

    @NotNull(message = "Sort order is required")
    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @OneToMany(mappedBy = "grow", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Plant> plants = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Enum representing grow status values.
     */
    @JsonSerialize(using = GrowStatusSerializer.class)
    @JsonDeserialize(using = GrowStatusDeserializer.class)
    public enum GrowStatus {
        PLANNING("planning"),
        ACTIVE("active"),
        FLOWERING("flowering"),
        DRYING("drying"),
        COMPLETED("completed");

        private final String value;

        GrowStatus(String value) {
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
     * Enum representing environment types.
     */
    @JsonSerialize(using = EnvironmentTypeSerializer.class)
    @JsonDeserialize(using = EnvironmentTypeDeserializer.class)
    public enum EnvironmentType {
        INDOOR("indoor"),
        OUTDOOR("outdoor"),
        GREENHOUSE("greenhouse");

        private final String value;

        EnvironmentType(String value) {
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
     * Enum representing lighting types.
     */
    public enum LightingType {
        LED("led"),
        HPS("hps"),
        MH("mh"),
        CMH("cmh"),
        FLUORESCENT("fluorescent"),
        NATURAL("natural");

        private final String value;

        LightingType(String value) {
            this.value = value;
        }

        @JsonValue
        public String getValue() {
            return value;
        }

        @Override
        public String toString() {
            return value;
        }
    }

    /**
     * Enum representing growing medium types.
     */
    public enum MediumType {
        SOIL("soil"),
        COCO("coco"),
        HYDRO("hydro"),
        AEROPONICS("aeroponics"),
        AQUAPONICS("aquaponics");

        private final String value;

        MediumType(String value) {
            this.value = value;
        }

        @JsonValue
        public String getValue() {
            return value;
        }

        @Override
        public String toString() {
            return value;
        }
    }

    /**
     * Helper method to add a plant to this grow.
     *
     * @param plant the plant to add
     */
    public void addPlant(Plant plant) {
        plants.add(plant);
        plant.setGrow(this);
    }

    /**
     * Helper method to remove a plant from this grow.
     *
     * @param plant the plant to remove
     */
    public void removePlant(Plant plant) {
        plants.remove(plant);
        plant.setGrow(null);
    }

    /**
     * Checks if the grow is currently active (not completed).
     *
     * @return true if the grow is not in completed status
     */
    public boolean isActive() {
        return status != GrowStatus.COMPLETED;
    }

    /**
     * Marks the grow as completed and sets the end date.
     *
     * @param endDate the completion date
     */
    public void complete(LocalDate endDate) {
        this.status = GrowStatus.COMPLETED;
        this.endDate = endDate;
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
        if (status == null) {
            status = GrowStatus.PLANNING;
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
