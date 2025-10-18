package com.growmanager.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ActivityLog entity representing plant activities and maintenance events.
 * Tracks training, pruning, defoliation, transplants, pest control, and other activities.
 */
@Entity
@Table(name = "activity_logs", indexes = {
        @Index(name = "idx_activity_logs_plant_id", columnList = "plant_id"),
        @Index(name = "idx_activity_logs_user_id", columnList = "user_id"),
        @Index(name = "idx_activity_logs_logged_at", columnList = "logged_at"),
        @Index(name = "idx_activity_logs_plant_id_logged_at", columnList = "plant_id, logged_at"),
        @Index(name = "idx_activity_logs_activity_type", columnList = "activity_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"plant", "user"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @NotNull(message = "Plant is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plant_id", nullable = false, foreignKey = @ForeignKey(name = "fk_activity_logs_plant"))
    private Plant plant;

    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_activity_logs_user"))
    private User user;

    @NotNull(message = "Activity type is required")
    @Convert(converter = ActivityTypeConverter.class)
    @Column(name = "activity_type", nullable = false, length = 20)
    private ActivityType activityType;

    @NotNull(message = "Description is required")
    @NotBlank(message = "Description cannot be blank")
    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @NotNull(message = "Logged at timestamp is required")
    @Column(name = "logged_at", nullable = false)
    @Builder.Default
    private LocalDateTime loggedAt = LocalDateTime.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Enum representing activity types.
     */
    public enum ActivityType {
        TRAINING("training"),
        PRUNING("pruning"),
        DEFOLIATION("defoliation"),
        TRANSPLANT("transplant"),
        PEST_CONTROL("pest_control"),
        OTHER("other");

        private final String value;

        ActivityType(String value) {
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
         * Converts a database value to an ActivityType enum.
         *
         * @param value the database value
         * @return the matching ActivityType enum
         * @throws IllegalArgumentException if the value is invalid
         */
        public static ActivityType fromValue(String value) {
            if (value == null || value.trim().isEmpty()) {
                throw new IllegalArgumentException("Activity type value cannot be null or empty");
            }
            for (ActivityType type : ActivityType.values()) {
                if (type.value.equalsIgnoreCase(value)) {
                    return type;
                }
            }
            throw new IllegalArgumentException("Invalid activity type: " + value);
        }
    }

    /**
     * JPA AttributeConverter to persist ActivityType enum as lowercase strings.
     */
    @Converter(autoApply = false)
    public static class ActivityTypeConverter implements AttributeConverter<ActivityType, String> {
        @Override
        public String convertToDatabaseColumn(ActivityType attribute) {
            if (attribute == null) {
                return null;
            }
            return attribute.getValue();
        }

        @Override
        public ActivityType convertToEntityAttribute(String dbData) {
            if (dbData == null || dbData.trim().isEmpty()) {
                return null;
            }
            return ActivityType.fromValue(dbData);
        }
    }

    /**
     * Checks if this activity affects plant structure.
     *
     * @return true if the activity type is TRAINING, PRUNING, or DEFOLIATION
     */
    public boolean affectsPlantStructure() {
        return activityType == ActivityType.TRAINING ||
                activityType == ActivityType.PRUNING ||
                activityType == ActivityType.DEFOLIATION;
    }

    /**
     * Checks if this is a transplant activity.
     *
     * @return true if the activity type is TRANSPLANT
     */
    public boolean isTransplant() {
        return activityType == ActivityType.TRANSPLANT;
    }

    /**
     * Checks if this is a pest control activity.
     *
     * @return true if the activity type is PEST_CONTROL
     */
    public boolean isPestControl() {
        return activityType == ActivityType.PEST_CONTROL;
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
        if (loggedAt == null) {
            loggedAt = now;
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