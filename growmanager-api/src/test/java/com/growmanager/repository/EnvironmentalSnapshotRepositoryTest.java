package com.growmanager.repository;

import com.growmanager.entity.EnvironmentalSnapshot;
import com.growmanager.entity.EnvironmentalSnapshot.SnapshotSource;
import com.growmanager.entity.Grow;
import com.growmanager.entity.Plant;
import com.growmanager.entity.User;
import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

/**
 * Test suite for EnvironmentalSnapshotRepository.
 */
@DataJpaTest
@ActiveProfiles("test")
class EnvironmentalSnapshotRepositoryTest {

    @Autowired
    private EnvironmentalSnapshotRepository snapshotRepository;

    @Autowired
    private GrowRepository growRepository;

    @Autowired
    private PlantRepository plantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    private User testUser;
    private Grow testGrow;
    private Plant testPlant;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("grower@example.com")
                .passwordHash("$2a$10$hash")
                .displayName("Test Grower")
                .role(User.Role.USER)
                .build();
        testUser = userRepository.save(testUser);

        testGrow = Grow.builder()
                .user(testUser)
                .name("Test Grow")
                .startDate(LocalDate.now())
                .build();
        testGrow = growRepository.save(testGrow);

        testPlant = Plant.builder()
                .grow(testGrow)
                .tag("P001")
                .build();
        testPlant = plantRepository.save(testPlant);

        entityManager.flush();
    }

    @Test
    @DisplayName("Should create environmental snapshot with all fields")
    void testCreateSnapshot() {
        EnvironmentalSnapshot snapshot = EnvironmentalSnapshot.builder()
                .grow(testGrow)
                .plant(testPlant)
                .timestamp(LocalDateTime.now())
                .temperature(new BigDecimal("24.5"))
                .humidity(new BigDecimal("65.0"))
                .co2(new BigDecimal("1200.0"))
                .lightIntensity(new BigDecimal("800.0"))
                .vpd(new BigDecimal("1.2"))
                .source(SnapshotSource.MANUAL)
                .notes("Perfect conditions")
                .build();

        EnvironmentalSnapshot saved = snapshotRepository.save(snapshot);
        entityManager.flush();
        entityManager.clear();

        Optional<EnvironmentalSnapshot> found = snapshotRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getTemperature()).isEqualByComparingTo(new BigDecimal("24.50"));
        assertThat(found.get().getHumidity()).isEqualByComparingTo(new BigDecimal("65.00"));
        assertThat(found.get().getSource()).isEqualTo(SnapshotSource.MANUAL);
    }

    @Test
    @DisplayName("Should enforce NOT NULL constraint on grow_id")
    void testGrowIdNotNull() {
        EnvironmentalSnapshot snapshot = EnvironmentalSnapshot.builder()
                .grow(null)
                .timestamp(LocalDateTime.now())
                .build();

        assertThatThrownBy(() -> {
            snapshotRepository.save(snapshot);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    @DisplayName("Should allow null plant_id")
    void testPlantIdNullable() {
        EnvironmentalSnapshot snapshot = EnvironmentalSnapshot.builder()
                .grow(testGrow)
                .plant(null)
                .timestamp(LocalDateTime.now())
                .build();

        EnvironmentalSnapshot saved = snapshotRepository.save(snapshot);
        assertThat(saved.getPlant()).isNull();
    }

    @Test
    @DisplayName("Should set default source to MANUAL")
    void testDefaultSource() {
        EnvironmentalSnapshot snapshot = EnvironmentalSnapshot.builder()
                .grow(testGrow)
                .timestamp(LocalDateTime.now())
                .build();

        EnvironmentalSnapshot saved = snapshotRepository.save(snapshot);
        assertThat(saved.getSource()).isEqualTo(SnapshotSource.MANUAL);
    }

    @Test
    @DisplayName("Should set default timestamp to current time")
    void testDefaultTimestamp() {
        EnvironmentalSnapshot snapshot = EnvironmentalSnapshot.builder()
                .grow(testGrow)
                .build();

        EnvironmentalSnapshot saved = snapshotRepository.save(snapshot);
        assertThat(saved.getTimestamp()).isNotNull();
        assertThat(saved.getTimestamp()).isBeforeOrEqualTo(LocalDateTime.now());
    }

    @Test
    @DisplayName("Should enforce temperature range constraint")
    void testTemperatureRangeConstraint() {
        EnvironmentalSnapshot snapshot = EnvironmentalSnapshot.builder()
                .grow(testGrow)
                .temperature(new BigDecimal("150.0")) // Too high
                .build();

        assertThatThrownBy(() -> {
            snapshotRepository.save(snapshot);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    @DisplayName("Should enforce humidity range constraint")
    void testHumidityRangeConstraint() {
        EnvironmentalSnapshot snapshot = EnvironmentalSnapshot.builder()
                .grow(testGrow)
                .humidity(new BigDecimal("150.0")) // Too high
                .build();

        assertThatThrownBy(() -> {
            snapshotRepository.save(snapshot);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    @DisplayName("Should auto-calculate VPD from temperature and humidity")
    void testAutoCalculateVpd() {
        EnvironmentalSnapshot snapshot = EnvironmentalSnapshot.builder()
                .grow(testGrow)
                .temperature(new BigDecimal("25.0"))
                .humidity(new BigDecimal("60.0"))
                .build();

        EnvironmentalSnapshot saved = snapshotRepository.save(snapshot);
        entityManager.flush();

        assertThat(saved.getVpd()).isNotNull();
        assertThat(saved.getVpd()).isGreaterThan(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Should cascade delete when grow is deleted")
    void testCascadeDeleteGrow() {
        EnvironmentalSnapshot snapshot = EnvironmentalSnapshot.builder()
                .grow(testGrow)
                .timestamp(LocalDateTime.now())
                .build();
        snapshotRepository.save(snapshot);
        entityManager.flush();

        long countBefore = snapshotRepository.count();
        assertThat(countBefore).isGreaterThan(0);

        growRepository.delete(testGrow);
        entityManager.flush();

        long countAfter = snapshotRepository.count();
        assertThat(countAfter).isZero();
    }

    @Test
    @DisplayName("Should cascade delete when plant is deleted")
    void testCascadeDeletePlant() {
        EnvironmentalSnapshot snapshot = EnvironmentalSnapshot.builder()
                .grow(testGrow)
                .plant(testPlant)
                .timestamp(LocalDateTime.now())
                .build();
        snapshotRepository.save(snapshot);
        entityManager.flush();

        long countBefore = snapshotRepository.count();
        assertThat(countBefore).isGreaterThan(0);

        plantRepository.delete(testPlant);
        entityManager.flush();

        long countAfter = snapshotRepository.count();
        assertThat(countAfter).isZero();
    }

    @Test
    @DisplayName("Should find snapshots by grow ID")
    void testFindByGrowId() {
        for (int i = 0; i < 3; i++) {
            snapshotRepository.save(EnvironmentalSnapshot.builder()
                    .grow(testGrow)
                    .timestamp(LocalDateTime.now().minusHours(i))
                    .build());
        }
        entityManager.flush();

        List<EnvironmentalSnapshot> snapshots = snapshotRepository.findByGrowId(testGrow.getId());
        assertThat(snapshots).hasSize(3);
    }

    @Test
    @DisplayName("Should find snapshots by plant ID")
    void testFindByPlantId() {
        snapshotRepository.save(EnvironmentalSnapshot.builder()
                .grow(testGrow)
                .plant(testPlant)
                .timestamp(LocalDateTime.now())
                .build());
        snapshotRepository.save(EnvironmentalSnapshot.builder()
                .grow(testGrow)
                .plant(null) // Grow-level snapshot
                .timestamp(LocalDateTime.now())
                .build());
        entityManager.flush();

        List<EnvironmentalSnapshot> snapshots = snapshotRepository.findByPlantId(testPlant.getId());
        assertThat(snapshots).hasSize(1);
    }

    @Test
    @DisplayName("Should find snapshots by time range")
    void testFindByTimeRange() {
        LocalDateTime now = LocalDateTime.now();
        snapshotRepository.save(EnvironmentalSnapshot.builder().grow(testGrow).timestamp(now.minusHours(3)).build());
        snapshotRepository.save(EnvironmentalSnapshot.builder().grow(testGrow).timestamp(now.minusHours(1)).build());
        snapshotRepository.save(EnvironmentalSnapshot.builder().grow(testGrow).timestamp(now.minusHours(5)).build());
        entityManager.flush();

        List<EnvironmentalSnapshot> snapshots = snapshotRepository.findByGrowIdAndTimeRange(
                testGrow.getId(),
                now.minusHours(4),
                now
        );
        assertThat(snapshots).hasSize(2);
    }

    @Test
    @DisplayName("Should find snapshots by source")
    void testFindBySource() {
        snapshotRepository.save(EnvironmentalSnapshot.builder().grow(testGrow).source(SnapshotSource.MANUAL).build());
        snapshotRepository.save(EnvironmentalSnapshot.builder().grow(testGrow).source(SnapshotSource.MANUAL).build());
        snapshotRepository.save(EnvironmentalSnapshot.builder().grow(testGrow).source(SnapshotSource.SENSOR).build());
        entityManager.flush();

        List<EnvironmentalSnapshot> manualSnapshots = snapshotRepository.findByGrowIdAndSource(testGrow.getId(), SnapshotSource.MANUAL);
        assertThat(manualSnapshots).hasSize(2);
    }

    @Test
    @DisplayName("Should find most recent snapshot")
    void testFindMostRecent() {
        LocalDateTime now = LocalDateTime.now();
        snapshotRepository.save(EnvironmentalSnapshot.builder().grow(testGrow).timestamp(now.minusHours(2)).build());
        snapshotRepository.save(EnvironmentalSnapshot.builder().grow(testGrow).timestamp(now.minusHours(1)).build());
        snapshotRepository.save(EnvironmentalSnapshot.builder().grow(testGrow).timestamp(now.minusHours(3)).build());
        entityManager.flush();

        EnvironmentalSnapshot recent = snapshotRepository.findMostRecentByGrowId(testGrow.getId());
        assertThat(recent).isNotNull();
        assertThat(recent.getTimestamp()).isEqualTo(now.minusHours(1));
    }

    @Test
    @DisplayName("Should calculate average temperature")
    void testCalculateAverageTemperature() {
        LocalDateTime now = LocalDateTime.now();
        snapshotRepository.save(EnvironmentalSnapshot.builder().grow(testGrow).timestamp(now.minusHours(1)).temperature(new BigDecimal("20.0")).build());
        snapshotRepository.save(EnvironmentalSnapshot.builder().grow(testGrow).timestamp(now.minusHours(1)).temperature(new BigDecimal("24.0")).build());
        snapshotRepository.save(EnvironmentalSnapshot.builder().grow(testGrow).timestamp(now.minusHours(1)).temperature(new BigDecimal("22.0")).build());
        entityManager.flush();

        Double avgTemp = snapshotRepository.calculateAverageTemperature(
                testGrow.getId(),
                now.minusHours(2),
                now
        );
        assertThat(avgTemp).isNotNull();
        assertThat(avgTemp).isEqualTo(22.0);
    }

    @Test
    @DisplayName("Should count snapshots by grow")
    void testCountByGrowId() {
        for (int i = 0; i < 4; i++) {
            snapshotRepository.save(EnvironmentalSnapshot.builder().grow(testGrow).build());
        }
        entityManager.flush();

        long count = snapshotRepository.countByGrowId(testGrow.getId());
        assertThat(count).isEqualTo(4);
    }
}
