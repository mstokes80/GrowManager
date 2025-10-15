package com.growmanager.entity;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.growmanager.config.ObservationTypeDeserializer;
import com.growmanager.config.ObservationTypeSerializer;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Observation entity representing plant observations and progress tracking.
 * Supports multiple photos and tags for categorization.
 */
@Entity
@Table(name = "observations", indexes = {
        @Index(name = "idx_observations_plant_id", columnList = "plant_id"),
        @Index(name = "idx_observations_user_id", columnList = "user_id"),
        @Index(name = "idx_observations_timestamp", columnList = "timestamp"),
        @Index(name = "idx_observations_plant_id_timestamp", columnList = "plant_id, timestamp"),
        @Index(name = "idx_observations_observation_type", columnList = "observation_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"plant", "user"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Observation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @NotNull(message = "Plant is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plant_id", nullable = false, foreignKey = @ForeignKey(name = "fk_observations_plant"))
    private Plant plant;

    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_observations_user"))
    private User user;

    @NotNull(message = "Observation type is required")
    @Convert(converter = ObservationTypeConverter.class)
    @Column(name = "observation_type", nullable = false, length = 20)
    private ObservationType observationType;

    @Size(max = 2000, message = "Note must not exceed 2000 characters")
    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "photos", columnDefinition = "TEXT[]")
    private String[] photos;

    @Column(name = "tags", columnDefinition = "TEXT[]")
    private String[] tags;

    @NotNull(message = "Timestamp is required")
    @Column(name = "timestamp", nullable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Enum representing observation types.
     */
    @JsonDeserialize(using = ObservationTypeDeserializer.class)
    @JsonSerialize(using = ObservationTypeSerializer.class)
    public enum ObservationType {
        HEALTH_CHECK("health_check"),
        DEFICIENCY("deficiency"),
        PEST("pest"),
        DISEASE("disease"),
        PROGRESS("progress"),
        OTHER("other");

        private final String value;

        ObservationType(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        @Override
        public String toString() {
            return value;
        }

        /**
         * Converts a database value to an ObservationType enum.
         *
         * @param value the database value
         * @return the matching ObservationType enum
         * @throws IllegalArgumentException if the value is invalid
         */
        public static ObservationType fromValue(String value) {
            if (value == null || value.trim().isEmpty()) {
                throw new IllegalArgumentException("Observation type value cannot be null or empty");
            }
            for (ObservationType type : ObservationType.values()) {
                if (type.value.equalsIgnoreCase(value)) {
                    return type;
                }
            }
            throw new IllegalArgumentException("Invalid observation type: " + value);
        }
    }

    /**
     * JPA AttributeConverter to persist ObservationType enum as lowercase strings.
     */
    @Converter(autoApply = false)
    public static class ObservationTypeConverter implements AttributeConverter<ObservationType, String> {
        @Override
        public String convertToDatabaseColumn(ObservationType attribute) {
            if (attribute == null) {
                return null;
            }
            return attribute.getValue();
        }

        @Override
        public ObservationType convertToEntityAttribute(String dbData) {
            if (dbData == null || dbData.trim().isEmpty()) {
                return null;
            }
            return ObservationType.fromValue(dbData);
        }
    }

    /**
     * Checks if this observation has photos attached.
     *
     * @return true if photos array is not null and not empty
     */
    public boolean hasPhotos() {
        return photos != null && photos.length > 0;
    }

    /**
     * Checks if this observation has tags.
     *
     * @return true if tags array is not null and not empty
     */
    public boolean hasTags() {
        return tags != null && tags.length > 0;
    }

    /**
     * Gets the number of photos in this observation.
     *
     * @return the photo count
     */
    public int getPhotoCount() {
        return hasPhotos() ? photos.length : 0;
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