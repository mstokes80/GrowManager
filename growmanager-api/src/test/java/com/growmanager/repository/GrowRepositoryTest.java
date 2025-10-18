package com.growmanager.repository;

import com.growmanager.entity.Grow;
import com.growmanager.entity.Grow.GrowStatus;
import com.growmanager.entity.Grow.EnvironmentType;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

/**
 * Test suite for GrowRepository.
 */
@DataJpaTest
@ActiveProfiles("test")
class GrowRepositoryTest {

    @Autowired
    private GrowRepository growRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("grower@example.com")
                .passwordHash("$2a$10$hash")
                .displayName("Test Grower")
                .role(User.Role.USER)
                .build();
        testUser = userRepository.save(testUser);
        entityManager.flush();
    }

    @Test
    @DisplayName("Should create grow with all required fields")
    void testCreateGrow() {
        Grow grow = Grow.builder()
                .user(testUser)
                .name("Spring 2025 Grow")
                .startDate(LocalDate.of(2025, 3, 1))
                .status(GrowStatus.ACTIVE)
                .environmentType(EnvironmentType.INDOOR)
                .notes("First grow of the season")
                .build();

        Grow saved = growRepository.save(grow);
        entityManager.flush();
        entityManager.clear();

        Optional<Grow> found = growRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Spring 2025 Grow");
        assertThat(found.get().getStatus()).isEqualTo(GrowStatus.ACTIVE);
        assertThat(found.get().getEnvironmentType()).isEqualTo(EnvironmentType.INDOOR);
    }

    @Test
    @DisplayName("Should enforce NOT NULL constraint on user_id")
    void testUserIdNotNull() {
        Grow grow = Grow.builder()
                .user(null)
                .name("Test Grow")
                .startDate(LocalDate.now())
                .build();

        assertThatThrownBy(() -> {
            growRepository.save(grow);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    @DisplayName("Should enforce NOT NULL constraint on start_date")
    void testStartDateNotNull() {
        Grow grow = Grow.builder()
                .user(testUser)
                .name("Test Grow")
                .startDate(null)
                .build();

        assertThatThrownBy(() -> {
            growRepository.save(grow);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    @DisplayName("Should set default status to PLANNING")
    void testDefaultStatus() {
        Grow grow = Grow.builder()
                .user(testUser)
                .name("New Grow")
                .startDate(LocalDate.now())
                .build();

        Grow saved = growRepository.save(grow);
        entityManager.flush();

        assertThat(saved.getStatus()).isEqualTo(GrowStatus.PLANNING);
    }

    @Test
    @DisplayName("Should enforce end_date >= start_date constraint")
    void testDateConstraint() {
        Grow grow = Grow.builder()
                .user(testUser)
                .name("Invalid Grow")
                .startDate(LocalDate.of(2025, 3, 1))
                .endDate(LocalDate.of(2025, 2, 1)) // Before start date
                .build();

        assertThatThrownBy(() -> {
            growRepository.save(grow);
            entityManager.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Should accept all valid grow statuses")
    void testAllGrowStatuses() {
        for (GrowStatus status : GrowStatus.values()) {
            Grow grow = Grow.builder()
                    .user(testUser)
                    .name("Grow " + status.name())
                    .startDate(LocalDate.now())
                    .status(status)
                    .build();

            Grow saved = growRepository.save(grow);
            assertThat(saved.getStatus()).isEqualTo(status);
        }
    }

    @Test
    @DisplayName("Should accept all valid environment types")
    void testAllEnvironmentTypes() {
        for (EnvironmentType envType : EnvironmentType.values()) {
            Grow grow = Grow.builder()
                    .user(testUser)
                    .name("Grow " + envType.name())
                    .startDate(LocalDate.now())
                    .environmentType(envType)
                    .build();

            Grow saved = growRepository.save(grow);
            assertThat(saved.getEnvironmentType()).isEqualTo(envType);
        }
    }

    @Test
    @DisplayName("Should cascade delete when user is deleted")
    void testCascadeDelete() {
        Grow grow = Grow.builder()
                .user(testUser)
                .name("Test Grow")
                .startDate(LocalDate.now())
                .build();

        growRepository.save(grow);
        entityManager.flush();

        long countBefore = growRepository.count();
        assertThat(countBefore).isGreaterThan(0);

        userRepository.delete(testUser);
        entityManager.flush();

        long countAfter = growRepository.count();
        assertThat(countAfter).isZero();
    }

    @Test
    @DisplayName("Should find grows by user ID")
    void testFindByUserId() {
        for (int i = 0; i < 3; i++) {
            growRepository.save(Grow.builder()
                    .user(testUser)
                    .name("Grow " + i)
                    .startDate(LocalDate.now().minusDays(i))
                    .build());
        }
        entityManager.flush();

        List<Grow> grows = growRepository.findByUserId(testUser.getId());
        assertThat(grows).hasSize(3);
    }

    @Test
    @DisplayName("Should find grows by status")
    void testFindByUserIdAndStatus() {
        growRepository.save(Grow.builder().user(testUser).name("Active 1").startDate(LocalDate.now()).status(GrowStatus.ACTIVE).build());
        growRepository.save(Grow.builder().user(testUser).name("Active 2").startDate(LocalDate.now()).status(GrowStatus.ACTIVE).build());
        growRepository.save(Grow.builder().user(testUser).name("Completed").startDate(LocalDate.now()).status(GrowStatus.COMPLETED).build());
        entityManager.flush();

        List<Grow> activeGrows = growRepository.findByUserIdAndStatus(testUser.getId(), GrowStatus.ACTIVE);
        assertThat(activeGrows).hasSize(2);
        assertThat(activeGrows).allMatch(g -> g.getStatus() == GrowStatus.ACTIVE);
    }

    @Test
    @DisplayName("Should find active grows (not completed)")
    void testFindActiveGrows() {
        growRepository.save(Grow.builder().user(testUser).name("Planning").startDate(LocalDate.now()).status(GrowStatus.PLANNING).build());
        growRepository.save(Grow.builder().user(testUser).name("Active").startDate(LocalDate.now()).status(GrowStatus.ACTIVE).build());
        growRepository.save(Grow.builder().user(testUser).name("Completed").startDate(LocalDate.now()).status(GrowStatus.COMPLETED).build());
        entityManager.flush();

        List<Grow> activeGrows = growRepository.findActiveGrowsByUserId(testUser.getId());
        assertThat(activeGrows).hasSize(2);
        assertThat(activeGrows).noneMatch(g -> g.getStatus() == GrowStatus.COMPLETED);
    }

    @Test
    @DisplayName("Should find grow by name")
    void testFindByUserIdAndName() {
        growRepository.save(Grow.builder().user(testUser).name("Unique Grow").startDate(LocalDate.now()).build());
        entityManager.flush();

        Optional<Grow> found = growRepository.findByUserIdAndName(testUser.getId(), "Unique Grow");
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Unique Grow");
    }

    @Test
    @DisplayName("Should search grows by name pattern")
    void testSearchByName() {
        growRepository.save(Grow.builder().user(testUser).name("Spring Indoor 2025").startDate(LocalDate.now()).build());
        growRepository.save(Grow.builder().user(testUser).name("Spring Outdoor 2025").startDate(LocalDate.now()).build());
        growRepository.save(Grow.builder().user(testUser).name("Winter Grow").startDate(LocalDate.now()).build());
        entityManager.flush();

        List<Grow> results = growRepository.searchByName(testUser.getId(), "spring");
        assertThat(results).hasSize(2);
        assertThat(results).allMatch(g -> g.getName().toLowerCase().contains("spring"));
    }

    @Test
    @DisplayName("Should find grows by date range")
    void testFindByDateRange() {
        growRepository.save(Grow.builder().user(testUser).name("Jan Grow").startDate(LocalDate.of(2025, 1, 15)).build());
        growRepository.save(Grow.builder().user(testUser).name("Feb Grow").startDate(LocalDate.of(2025, 2, 15)).build());
        growRepository.save(Grow.builder().user(testUser).name("Mar Grow").startDate(LocalDate.of(2025, 3, 15)).build());
        entityManager.flush();

        List<Grow> results = growRepository.findByUserIdAndDateRange(
                testUser.getId(),
                LocalDate.of(2025, 2, 1),
                LocalDate.of(2025, 3, 31)
        );
        assertThat(results).hasSize(2);
    }

    @Test
    @DisplayName("Should count grows by user")
    void testCountByUserId() {
        for (int i = 0; i < 4; i++) {
            growRepository.save(Grow.builder().user(testUser).name("Grow " + i).startDate(LocalDate.now()).build());
        }
        entityManager.flush();

        long count = growRepository.countByUserId(testUser.getId());
        assertThat(count).isEqualTo(4);
    }

    @Test
    @DisplayName("Should check if grow exists by name")
    void testExistsByUserIdAndName() {
        growRepository.save(Grow.builder().user(testUser).name("Existing Grow").startDate(LocalDate.now()).build());
        entityManager.flush();

        assertThat(growRepository.existsByUserIdAndName(testUser.getId(), "Existing Grow")).isTrue();
        assertThat(growRepository.existsByUserIdAndName(testUser.getId(), "Nonexistent")).isFalse();
    }
}
