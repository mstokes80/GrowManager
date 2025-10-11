package com.growmanager.repository;

import com.growmanager.entity.ActivityLog;
import com.growmanager.entity.ActivityLog.ActivityType;
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
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Test suite for ActivityLogRepository.
 * Tests all custom query methods and database operations.
 */
@DataJpaTest
@ActiveProfiles("test")
class ActivityLogRepositoryTest {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GrowRepository growRepository;

    @Autowired
    private PlantRepository plantRepository;

    @Autowired
    private TestEntityManager entityManager;

    private User testUser;
    private Grow testGrow;
    private Plant testPlant;
    private Plant testPlant2;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = User.builder()
                .email("grower@example.com")
                .passwordHash("$2a$10$hash")
                .displayName("Test Grower")
                .role(User.Role.USER)
                .build();
        testUser = userRepository.save(testUser);

        // Create test grow
        testGrow = Grow.builder()
                .user(testUser)
                .name("Test Grow")
                .startDate(LocalDate.now())
                .status(Grow.GrowStatus.ACTIVE)
                .build();
        testGrow = growRepository.save(testGrow);

        // Create test plants
        testPlant = Plant.builder()
                .tag("Test Plant 1")
                .grow(testGrow)
                .plantedDate(LocalDate.now())
                .status(Plant.PlantStatus.ACTIVE)
                .build();
        testPlant = plantRepository.save(testPlant);

        testPlant2 = Plant.builder()
                .tag("Test Plant 2")
                .grow(testGrow)
                .plantedDate(LocalDate.now())
                .status(Plant.PlantStatus.ACTIVE)
                .build();
        testPlant2 = plantRepository.save(testPlant2);

        entityManager.flush();
    }

    // Basic CRUD Tests
    @Test
    @DisplayName("Should create activity log with all required fields")
    void testCreateActivityLog() {
        ActivityLog activityLog = ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("LST applied to main stem")
                .notes("Bent stem gently to 90 degrees")
                .loggedAt(LocalDateTime.now())
                .build();

        ActivityLog saved = activityLogRepository.save(activityLog);
        entityManager.flush();
        entityManager.clear();

        ActivityLog found = activityLogRepository.findById(saved.getId()).orElse(null);
        assertThat(found).isNotNull();
        assertThat(found.getActivityType()).isEqualTo(ActivityType.TRAINING);
        assertThat(found.getDescription()).isEqualTo("LST applied to main stem");
        assertThat(found.getNotes()).isEqualTo("Bent stem gently to 90 degrees");
    }

    @Test
    @DisplayName("Should enforce NOT NULL constraint on plant")
    void testPlantNotNull() {
        ActivityLog activityLog = ActivityLog.builder()
                .plant(null)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Test activity")
                .build();

        assertThatThrownBy(() -> {
            activityLogRepository.save(activityLog);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    @DisplayName("Should enforce NOT NULL constraint on user")
    void testUserNotNull() {
        ActivityLog activityLog = ActivityLog.builder()
                .plant(testPlant)
                .user(null)
                .activityType(ActivityType.TRAINING)
                .description("Test activity")
                .build();

        assertThatThrownBy(() -> {
            activityLogRepository.save(activityLog);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    @DisplayName("Should enforce NOT NULL and NOT BLANK constraint on description")
    void testDescriptionNotBlank() {
        ActivityLog activityLog = ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("")
                .build();

        assertThatThrownBy(() -> {
            activityLogRepository.save(activityLog);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);

        ActivityLog activityLog2 = ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description(null)
                .build();

        assertThatThrownBy(() -> {
            activityLogRepository.save(activityLog2);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    // Query Method Tests
    @Test
    @DisplayName("Should find activity logs by plant ID")
    void testFindByPlantId() {
        // Create multiple activity logs for the plant
        for (int i = 0; i < 3; i++) {
            activityLogRepository.save(ActivityLog.builder()
                    .plant(testPlant)
                    .user(testUser)
                    .activityType(ActivityType.TRAINING)
                    .description("Activity " + i)
                    .loggedAt(LocalDateTime.now().minusDays(i))
                    .build());
        }

        // Create an activity log for another plant
        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant2)
                .user(testUser)
                .activityType(ActivityType.PRUNING)
                .description("Pruning test")
                .build());

        entityManager.flush();

        List<ActivityLog> logs = activityLogRepository.findByPlantId(testPlant.getId());
        assertThat(logs).hasSize(3);
        // Check ordering (most recent first)
        assertThat(logs.get(0).getLoggedAt()).isAfter(logs.get(1).getLoggedAt());
    }

    @Test
    @DisplayName("Should find activity logs by plant ID and type")
    void testFindByPlantIdAndType() {
        // Create activity logs with different types
        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Training activity")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.PRUNING)
                .description("Pruning activity")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Another training activity")
                .build());

        entityManager.flush();

        List<ActivityLog> trainingLogs = activityLogRepository.findByPlantIdAndType(
                testPlant.getId(), ActivityType.TRAINING);
        assertThat(trainingLogs).hasSize(2);
        assertThat(trainingLogs).allMatch(a -> a.getActivityType() == ActivityType.TRAINING);

        List<ActivityLog> pruningLogs = activityLogRepository.findByPlantIdAndType(
                testPlant.getId(), ActivityType.PRUNING);
        assertThat(pruningLogs).hasSize(1);
    }

    @Test
    @DisplayName("Should find activity logs by plant ID and time range")
    void testFindByPlantIdAndTimeRange() {
        LocalDateTime now = LocalDateTime.now();

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Old activity")
                .loggedAt(now.minusDays(5))
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.PRUNING)
                .description("Recent activity")
                .loggedAt(now.minusDays(2))
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Latest activity")
                .loggedAt(now)
                .build());

        entityManager.flush();

        List<ActivityLog> logsInRange = activityLogRepository.findByPlantIdAndTimeRange(
                testPlant.getId(),
                now.minusDays(3),
                now.plusDays(1)
        );

        assertThat(logsInRange).hasSize(2);
    }

    @Test
    @DisplayName("Should find activity logs by user ID")
    void testFindByUserId() {
        // Create logs for multiple plants by same user
        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Activity 1")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant2)
                .user(testUser)
                .activityType(ActivityType.PRUNING)
                .description("Activity 2")
                .build());

        entityManager.flush();

        List<ActivityLog> userLogs = activityLogRepository.findByUserId(testUser.getId());
        assertThat(userLogs).hasSize(2);
        assertThat(userLogs).allMatch(a -> a.getUser().getId().equals(testUser.getId()));
    }

    @Test
    @DisplayName("Should find activity logs by grow ID")
    void testFindByGrowId() {
        // Create logs for multiple plants in the same grow
        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Activity 1")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant2)
                .user(testUser)
                .activityType(ActivityType.PRUNING)
                .description("Activity 2")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.DEFOLIATION)
                .description("Activity 3")
                .build());

        entityManager.flush();

        List<ActivityLog> growLogs = activityLogRepository.findByGrowId(testGrow.getId());
        assertThat(growLogs).hasSize(3);
    }

    @Test
    @DisplayName("Should find most recent activity log by plant ID")
    void testFindMostRecentByPlantId() {
        LocalDateTime now = LocalDateTime.now();

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Old activity")
                .loggedAt(now.minusDays(2))
                .build());

        ActivityLog mostRecent = activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.PRUNING)
                .description("Latest activity")
                .loggedAt(now)
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Middle activity")
                .loggedAt(now.minusDays(1))
                .build());

        entityManager.flush();

        ActivityLog found = activityLogRepository.findMostRecentByPlantId(testPlant.getId());
        assertThat(found).isNotNull();
        assertThat(found.getId()).isEqualTo(mostRecent.getId());
    }

    @Test
    @DisplayName("Should find most recent activity log by plant ID and type")
    void testFindMostRecentByPlantIdAndType() {
        LocalDateTime now = LocalDateTime.now();

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Old training")
                .loggedAt(now.minusDays(2))
                .build());

        ActivityLog mostRecentTraining = activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Latest training")
                .loggedAt(now.minusDays(1))
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.PRUNING)
                .description("Latest pruning")
                .loggedAt(now)
                .build());

        entityManager.flush();

        ActivityLog found = activityLogRepository.findMostRecentByPlantIdAndType(
                testPlant.getId(), "TRAINING");
        assertThat(found).isNotNull();
        assertThat(found.getId()).isEqualTo(mostRecentTraining.getId());
    }

    @Test
    @DisplayName("Should count activity logs by plant ID")
    void testCountByPlantId() {
        for (int i = 0; i < 5; i++) {
            activityLogRepository.save(ActivityLog.builder()
                    .plant(testPlant)
                    .user(testUser)
                    .activityType(ActivityType.TRAINING)
                    .description("Activity " + i)
                    .build());
        }

        entityManager.flush();

        long count = activityLogRepository.countByPlantId(testPlant.getId());
        assertThat(count).isEqualTo(5);

        long countPlant2 = activityLogRepository.countByPlantId(testPlant2.getId());
        assertThat(countPlant2).isEqualTo(0);
    }

    @Test
    @DisplayName("Should count activity logs by plant ID and type")
    void testCountByPlantIdAndType() {
        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Training 1")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Training 2")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.PRUNING)
                .description("Pruning 1")
                .build());

        entityManager.flush();

        long trainingCount = activityLogRepository.countByPlantIdAndType(
                testPlant.getId(), ActivityType.TRAINING);
        assertThat(trainingCount).isEqualTo(2);

        long pruningCount = activityLogRepository.countByPlantIdAndType(
                testPlant.getId(), ActivityType.PRUNING);
        assertThat(pruningCount).isEqualTo(1);
    }

    @Test
    @DisplayName("Should find recent activity logs by plant ID with limit")
    void testFindRecentByPlantId() {
        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < 10; i++) {
            activityLogRepository.save(ActivityLog.builder()
                    .plant(testPlant)
                    .user(testUser)
                    .activityType(ActivityType.TRAINING)
                    .description("Activity " + i)
                    .loggedAt(now.minusDays(i))
                    .build());
        }

        entityManager.flush();

        List<ActivityLog> recent5 = activityLogRepository.findRecentByPlantId(testPlant.getId(), 5);
        assertThat(recent5).hasSize(5);
        // Verify ordering (most recent first)
        for (int i = 0; i < recent5.size() - 1; i++) {
            assertThat(recent5.get(i).getLoggedAt()).isAfter(recent5.get(i + 1).getLoggedAt());
        }
    }

    @Test
    @DisplayName("Should find activity logs by grow ID and time range")
    void testFindByGrowIdAndTimeRange() {
        LocalDateTime now = LocalDateTime.now();

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Old activity")
                .loggedAt(now.minusDays(5))
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant2)
                .user(testUser)
                .activityType(ActivityType.PRUNING)
                .description("Recent activity")
                .loggedAt(now.minusDays(2))
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Latest activity")
                .loggedAt(now)
                .build());

        entityManager.flush();

        List<ActivityLog> logsInRange = activityLogRepository.findByGrowIdAndTimeRange(
                testGrow.getId(),
                now.minusDays(3),
                now.plusDays(1)
        );

        assertThat(logsInRange).hasSize(2);
    }

    @Test
    @DisplayName("Should count activity logs by grow ID")
    void testCountByGrowId() {
        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Activity 1")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant2)
                .user(testUser)
                .activityType(ActivityType.PRUNING)
                .description("Activity 2")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.DEFOLIATION)
                .description("Activity 3")
                .build());

        entityManager.flush();

        long count = activityLogRepository.countByGrowId(testGrow.getId());
        assertThat(count).isEqualTo(3);
    }

    @Test
    @DisplayName("Should find activity logs by grow ID and type")
    void testFindByGrowIdAndType() {
        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Training 1")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant2)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Training 2")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.PRUNING)
                .description("Pruning 1")
                .build());

        entityManager.flush();

        List<ActivityLog> trainingLogs = activityLogRepository.findByGrowIdAndType(
                testGrow.getId(), ActivityType.TRAINING);
        assertThat(trainingLogs).hasSize(2);
        assertThat(trainingLogs).allMatch(a -> a.getActivityType() == ActivityType.TRAINING);
    }

    @Test
    @DisplayName("Should find transplant activities by plant ID")
    void testFindTransplantsByPlantId() {
        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRANSPLANT)
                .description("Transplanted to 5 gallon pot")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Training activity")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRANSPLANT)
                .description("Transplanted to final pot")
                .build());

        entityManager.flush();

        List<ActivityLog> transplants = activityLogRepository.findTransplantsByPlantId(testPlant.getId());
        assertThat(transplants).hasSize(2);
        assertThat(transplants).allMatch(a -> a.getActivityType() == ActivityType.TRANSPLANT);
    }

    @Test
    @DisplayName("Should find pest control activities by plant ID")
    void testFindPestControlByPlantId() {
        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.PEST_CONTROL)
                .description("Applied neem oil for spider mites")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Training activity")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.PEST_CONTROL)
                .description("Applied beneficial insects")
                .build());

        entityManager.flush();

        List<ActivityLog> pestControl = activityLogRepository.findPestControlByPlantId(testPlant.getId());
        assertThat(pestControl).hasSize(2);
        assertThat(pestControl).allMatch(a -> a.getActivityType() == ActivityType.PEST_CONTROL);
    }

    @Test
    @DisplayName("Should find structure-affecting activities by plant ID")
    void testFindStructureActivitiesByPlantId() {
        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("LST applied")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.PRUNING)
                .description("Removed lower branches")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.DEFOLIATION)
                .description("Removed fan leaves")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRANSPLANT)
                .description("Transplanted")
                .build());

        entityManager.flush();

        List<ActivityLog> structureLogs = activityLogRepository.findStructureActivitiesByPlantId(testPlant.getId());
        assertThat(structureLogs).hasSize(3);
        assertThat(structureLogs).allMatch(a ->
                a.getActivityType() == ActivityType.TRAINING ||
                        a.getActivityType() == ActivityType.PRUNING ||
                        a.getActivityType() == ActivityType.DEFOLIATION
        );
    }

    @Test
    @DisplayName("Should count transplant activities by plant ID")
    void testCountTransplantsByPlantId() {
        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRANSPLANT)
                .description("First transplant")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRAINING)
                .description("Training")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRANSPLANT)
                .description("Second transplant")
                .build());

        activityLogRepository.save(ActivityLog.builder()
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityType.TRANSPLANT)
                .description("Third transplant")
                .build());

        entityManager.flush();

        long count = activityLogRepository.countTransplantsByPlantId(testPlant.getId());
        assertThat(count).isEqualTo(3);

        long countPlant2 = activityLogRepository.countTransplantsByPlantId(testPlant2.getId());
        assertThat(countPlant2).isEqualTo(0);
    }

    @Test
    @DisplayName("Should accept all valid activity types")
    void testAllActivityTypes() {
        for (ActivityType activityType : ActivityType.values()) {
            ActivityLog log = ActivityLog.builder()
                    .plant(testPlant)
                    .user(testUser)
                    .activityType(activityType)
                    .description("Activity " + activityType.name())
                    .build();

            ActivityLog saved = activityLogRepository.save(log);
            assertThat(saved.getActivityType()).isEqualTo(activityType);
        }
    }
}