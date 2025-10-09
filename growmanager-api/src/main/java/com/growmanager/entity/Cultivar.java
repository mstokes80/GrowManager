package com.growmanager.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Cultivar entity representing cannabis strains/cultivars in the database.
 * Stores information about cannabis genetics including breeder, type, and characteristics.
 */
@Entity
@Table(name = "cultivars", indexes = {
        @Index(name = "idx_cultivars_user_id", columnList = "user_id"),
        @Index(name = "idx_cultivars_name", columnList = "name"),
        @Index(name = "idx_cultivars_user_id_name", columnList = "user_id, name"),
        @Index(name = "idx_cultivars_updated_at", columnList = "updated_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Cultivar {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_cultivars_user"))
    private User user;

    @NotNull(message = "Cultivar name is required")
    @Size(max = 255, message = "Cultivar name must not exceed 255 characters")
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Size(max = 255, message = "Breeder name must not exceed 255 characters")
    @Column(name = "breeder", length = 255)
    private String breeder;

    @Column(name = "genetics", columnDefinition = "TEXT")
    private String genetics;

    @NotNull(message = "Cultivar type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    @Builder.Default
    private CultivarType type = CultivarType.UNKNOWN;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "characteristics", columnDefinition = "jsonb")
    private JsonNode characteristics;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Enum representing cultivar types.
     */
    public enum CultivarType {
        INDICA("indica"),
        SATIVA("sativa"),
        HYBRID("hybrid"),
        AUTO("auto"),
        UNKNOWN("unknown");

        private final String value;

        CultivarType(String value) {
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
        if (type == null) {
            type = CultivarType.UNKNOWN;
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
