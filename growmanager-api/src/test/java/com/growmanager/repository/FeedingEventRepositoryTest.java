package com.growmanager.repository;

import com.growmanager.entity.FeedingEvent;
import com.growmanager.entity.FeedingEvent.FeedingType;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Test suite for FeedingEventRepository.
 * Tests all custom query methods and database operations.
 */
@DataJpaTest
@ActiveProfiles("test")
class FeedingEventRepositoryTest {

    @Autowired
    private FeedingEventRepository feedingEventRepository;

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
    @DisplayName("Should create feeding event with all required fields")
    void testCreateFeedingEvent() {
        FeedingEvent feedingEvent = FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(500))
                .ecLevel(BigDecimal.valueOf(1.5))
                .phLevel(BigDecimal.valueOf(6.0))
                .nutrientMix("Base nutrients")
                .notes("Regular feeding")
                .fedAt(LocalDateTime.now())
                .build();

        FeedingEvent saved = feedingEventRepository.save(feedingEvent);
        entityManager.flush();
        entityManager.clear();

        FeedingEvent found = feedingEventRepository.findById(saved.getId()).orElse(null);
        assertThat(found).isNotNull();
        assertThat(found.getFeedingType()).isEqualTo(FeedingType.WATERING);
        assertThat(found.getAmountMl()).isEqualByComparingTo(BigDecimal.valueOf(500));
        assertThat(found.getEcLevel()).isEqualByComparingTo(BigDecimal.valueOf(1.5));
        assertThat(found.getPhLevel()).isEqualByComparingTo(BigDecimal.valueOf(6.0));
    }

    @Test
    @DisplayName("Should enforce NOT NULL constraint on plant")
    void testPlantNotNull() {
        FeedingEvent feedingEvent = FeedingEvent.builder()
                .plant(null)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(500))
                .build();

        assertThatThrownBy(() -> {
            feedingEventRepository.save(feedingEvent);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    @DisplayName("Should enforce NOT NULL constraint on user")
    void testUserNotNull() {
        FeedingEvent feedingEvent = FeedingEvent.builder()
                .plant(testPlant)
                .user(null)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(500))
                .build();

        assertThatThrownBy(() -> {
            feedingEventRepository.save(feedingEvent);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    @DisplayName("Should enforce amount > 0 constraint")
    void testAmountMustBePositive() {
        FeedingEvent feedingEvent = FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.ZERO)
                .build();

        assertThatThrownBy(() -> {
            feedingEventRepository.save(feedingEvent);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    @DisplayName("Should enforce EC level range (0-10)")
    void testEcLevelRange() {
        // Test EC > 10
        FeedingEvent feedingEvent = FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(500))
                .ecLevel(BigDecimal.valueOf(11))
                .build();

        assertThatThrownBy(() -> {
            feedingEventRepository.save(feedingEvent);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);

        // Test EC < 0
        FeedingEvent feedingEvent2 = FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(500))
                .ecLevel(BigDecimal.valueOf(-1))
                .build();

        assertThatThrownBy(() -> {
            feedingEventRepository.save(feedingEvent2);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    @DisplayName("Should enforce pH level range (0-14)")
    void testPhLevelRange() {
        // Test pH > 14
        FeedingEvent feedingEvent = FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(500))
                .phLevel(BigDecimal.valueOf(15))
                .build();

        assertThatThrownBy(() -> {
            feedingEventRepository.save(feedingEvent);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);

        // Test pH < 0
        FeedingEvent feedingEvent2 = FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(500))
                .phLevel(BigDecimal.valueOf(-1))
                .build();

        assertThatThrownBy(() -> {
            feedingEventRepository.save(feedingEvent2);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    // Query Method Tests
    @Test
    @DisplayName("Should find feeding events by plant ID")
    void testFindByPlantId() {
        // Create multiple feeding events for the plant
        for (int i = 0; i < 3; i++) {
            feedingEventRepository.save(FeedingEvent.builder()
                    .plant(testPlant)
                    .user(testUser)
                    .feedingType(FeedingType.WATERING)
                    .amountMl(BigDecimal.valueOf(500 + i * 100))
                    .fedAt(LocalDateTime.now().minusDays(i))
                    .build());
        }

        // Create a feeding event for another plant
        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant2)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(300))
                .build());

        entityManager.flush();

        List<FeedingEvent> events = feedingEventRepository.findByPlantId(testPlant.getId());
        assertThat(events).hasSize(3);
        // Check ordering (most recent first)
        assertThat(events.get(0).getFedAt()).isAfter(events.get(1).getFedAt());
    }

    @Test
    @DisplayName("Should find feeding events by plant ID and type")
    void testFindByPlantIdAndType() {
        // Create feeding events with different types
        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(500))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(300))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(400))
                .build());

        entityManager.flush();

        List<FeedingEvent> wateringEvents = feedingEventRepository.findByPlantIdAndType(
                testPlant.getId(), FeedingType.WATERING);
        assertThat(wateringEvents).hasSize(2);
        assertThat(wateringEvents).allMatch(e -> e.getFeedingType() == FeedingType.WATERING);

        List<FeedingEvent> nutrientEvents = feedingEventRepository.findByPlantIdAndType(
                testPlant.getId(), FeedingType.NUTRIENTS);
        assertThat(nutrientEvents).hasSize(1);
    }

    @Test
    @DisplayName("Should find feeding events by plant ID and time range")
    void testFindByPlantIdAndTimeRange() {
        LocalDateTime now = LocalDateTime.now();

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(500))
                .fedAt(now.minusDays(5))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(300))
                .fedAt(now.minusDays(2))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(400))
                .fedAt(now)
                .build());

        entityManager.flush();

        List<FeedingEvent> eventsInRange = feedingEventRepository.findByPlantIdAndTimeRange(
                testPlant.getId(),
                now.minusDays(3),
                now.plusDays(1)
        );

        assertThat(eventsInRange).hasSize(2);
    }

    @Test
    @DisplayName("Should find feeding events by user ID")
    void testFindByUserId() {
        // Create events for multiple plants by same user
        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(500))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant2)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(300))
                .build());

        entityManager.flush();

        List<FeedingEvent> userEvents = feedingEventRepository.findByUserId(testUser.getId());
        assertThat(userEvents).hasSize(2);
        assertThat(userEvents).allMatch(e -> e.getUser().getId().equals(testUser.getId()));
    }

    @Test
    @DisplayName("Should find feeding events by grow ID")
    void testFindByGrowId() {
        // Create events for multiple plants in the same grow
        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(500))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant2)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(300))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.FOLIAR)
                .amountMl(BigDecimal.valueOf(100))
                .build());

        entityManager.flush();

        List<FeedingEvent> growEvents = feedingEventRepository.findByGrowId(testGrow.getId());
        assertThat(growEvents).hasSize(3);
    }

    @Test
    @DisplayName("Should find most recent feeding event by plant ID")
    void testFindMostRecentByPlantId() {
        LocalDateTime now = LocalDateTime.now();

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(500))
                .fedAt(now.minusDays(2))
                .build());

        FeedingEvent mostRecent = feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(300))
                .fedAt(now)
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(400))
                .fedAt(now.minusDays(1))
                .build());

        entityManager.flush();

        FeedingEvent found = feedingEventRepository.findMostRecentByPlantId(testPlant.getId());
        assertThat(found).isNotNull();
        assertThat(found.getId()).isEqualTo(mostRecent.getId());
    }

    @Test
    @DisplayName("Should find most recent feeding event by plant ID and type")
    void testFindMostRecentByPlantIdAndType() {
        LocalDateTime now = LocalDateTime.now();

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(500))
                .fedAt(now.minusDays(2))
                .build());

        FeedingEvent mostRecentNutrients = feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(300))
                .fedAt(now.minusDays(1))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(400))
                .fedAt(now)
                .build());

        entityManager.flush();

        FeedingEvent found = feedingEventRepository.findMostRecentByPlantIdAndType(
                testPlant.getId(), "NUTRIENTS");
        assertThat(found).isNotNull();
        assertThat(found.getId()).isEqualTo(mostRecentNutrients.getId());
    }

    @Test
    @DisplayName("Should count feeding events by plant ID")
    void testCountByPlantId() {
        for (int i = 0; i < 5; i++) {
            feedingEventRepository.save(FeedingEvent.builder()
                    .plant(testPlant)
                    .user(testUser)
                    .feedingType(FeedingType.WATERING)
                    .amountMl(BigDecimal.valueOf(500))
                    .build());
        }

        entityManager.flush();

        long count = feedingEventRepository.countByPlantId(testPlant.getId());
        assertThat(count).isEqualTo(5);

        long countPlant2 = feedingEventRepository.countByPlantId(testPlant2.getId());
        assertThat(countPlant2).isEqualTo(0);
    }

    @Test
    @DisplayName("Should count feeding events by plant ID and type")
    void testCountByPlantIdAndType() {
        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(500))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(400))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(300))
                .build());

        entityManager.flush();

        long wateringCount = feedingEventRepository.countByPlantIdAndType(
                testPlant.getId(), FeedingType.WATERING);
        assertThat(wateringCount).isEqualTo(2);

        long nutrientCount = feedingEventRepository.countByPlantIdAndType(
                testPlant.getId(), FeedingType.NUTRIENTS);
        assertThat(nutrientCount).isEqualTo(1);
    }

    @Test
    @DisplayName("Should calculate total amount by plant ID")
    void testCalculateTotalAmountByPlantId() {
        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(500))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(300))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(200))
                .build());

        entityManager.flush();

        Double totalAmount = feedingEventRepository.calculateTotalAmountByPlantId(testPlant.getId());
        assertThat(totalAmount).isEqualTo(1000.0);

        Double totalAmountEmpty = feedingEventRepository.calculateTotalAmountByPlantId(testPlant2.getId());
        assertThat(totalAmountEmpty).isEqualTo(0.0);
    }

    @Test
    @DisplayName("Should calculate average EC by plant ID")
    void testCalculateAverageEcByPlantId() {
        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(500))
                .ecLevel(BigDecimal.valueOf(1.5))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(300))
                .ecLevel(BigDecimal.valueOf(2.0))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(200))
                // No EC level
                .build());

        entityManager.flush();

        Double averageEc = feedingEventRepository.calculateAverageEcByPlantId(testPlant.getId());
        assertThat(averageEc).isEqualTo(1.75);

        Double averageEcEmpty = feedingEventRepository.calculateAverageEcByPlantId(testPlant2.getId());
        assertThat(averageEcEmpty).isNull();
    }

    @Test
    @DisplayName("Should calculate average pH by plant ID")
    void testCalculateAveragePhByPlantId() {
        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(500))
                .phLevel(BigDecimal.valueOf(6.0))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(300))
                .phLevel(BigDecimal.valueOf(6.5))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(200))
                .phLevel(BigDecimal.valueOf(6.2))
                .build());

        entityManager.flush();

        Double averagePh = feedingEventRepository.calculateAveragePhByPlantId(testPlant.getId());
        assertThat(averagePh).isBetween(6.2, 6.3); // Average should be approximately 6.233

        Double averagePhEmpty = feedingEventRepository.calculateAveragePhByPlantId(testPlant2.getId());
        assertThat(averagePhEmpty).isNull();
    }

    @Test
    @DisplayName("Should find recent feeding events by plant ID with limit")
    void testFindRecentByPlantId() {
        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < 10; i++) {
            feedingEventRepository.save(FeedingEvent.builder()
                    .plant(testPlant)
                    .user(testUser)
                    .feedingType(FeedingType.WATERING)
                    .amountMl(BigDecimal.valueOf(500))
                    .fedAt(now.minusDays(i))
                    .build());
        }

        entityManager.flush();

        List<FeedingEvent> recent5 = feedingEventRepository.findRecentByPlantId(testPlant.getId(), 5);
        assertThat(recent5).hasSize(5);
        // Verify ordering (most recent first)
        for (int i = 0; i < recent5.size() - 1; i++) {
            assertThat(recent5.get(i).getFedAt()).isAfter(recent5.get(i + 1).getFedAt());
        }
    }

    @Test
    @DisplayName("Should find feeding events by grow ID and time range")
    void testFindByGrowIdAndTimeRange() {
        LocalDateTime now = LocalDateTime.now();

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(500))
                .fedAt(now.minusDays(5))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant2)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(300))
                .fedAt(now.minusDays(2))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(400))
                .fedAt(now)
                .build());

        entityManager.flush();

        List<FeedingEvent> eventsInRange = feedingEventRepository.findByGrowIdAndTimeRange(
                testGrow.getId(),
                now.minusDays(3),
                now.plusDays(1)
        );

        assertThat(eventsInRange).hasSize(2);
    }

    @Test
    @DisplayName("Should count feeding events by grow ID")
    void testCountByGrowId() {
        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(500))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant2)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(300))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.FOLIAR)
                .amountMl(BigDecimal.valueOf(100))
                .build());

        entityManager.flush();

        long count = feedingEventRepository.countByGrowId(testGrow.getId());
        assertThat(count).isEqualTo(3);
    }

    @Test
    @DisplayName("Should find feeding events by grow ID and type")
    void testFindByGrowIdAndType() {
        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(500))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant2)
                .user(testUser)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(400))
                .build());

        feedingEventRepository.save(FeedingEvent.builder()
                .plant(testPlant)
                .user(testUser)
                .feedingType(FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(300))
                .build());

        entityManager.flush();

        List<FeedingEvent> wateringEvents = feedingEventRepository.findByGrowIdAndType(
                testGrow.getId(), FeedingType.WATERING);
        assertThat(wateringEvents).hasSize(2);
        assertThat(wateringEvents).allMatch(e -> e.getFeedingType() == FeedingType.WATERING);
    }
}