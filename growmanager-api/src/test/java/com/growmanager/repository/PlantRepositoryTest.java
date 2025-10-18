package com.growmanager.repository;

import com.growmanager.entity.Cultivar;
import com.growmanager.entity.Grow;
import com.growmanager.entity.Plant;
import com.growmanager.entity.Plant.PlantStage;
import com.growmanager.entity.Plant.PlantStatus;
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
 * Test suite for PlantRepository.
 */
@DataJpaTest
@ActiveProfiles("test")
class PlantRepositoryTest {

    @Autowired
    private PlantRepository plantRepository;

    @Autowired
    private GrowRepository growRepository;

    @Autowired
    private CultivarRepository cultivarRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    private User testUser;
    private Grow testGrow;
    private Cultivar testCultivar;

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

        testCultivar = Cultivar.builder()
                .user(testUser)
                .name("Test Strain")
                .type(Cultivar.CultivarType.HYBRID)
                .build();
        testCultivar = cultivarRepository.save(testCultivar);

        entityManager.flush();
    }

    @Test
    @DisplayName("Should create plant with all required fields")
    void testCreatePlant() {
        Plant plant = Plant.builder()
                .grow(testGrow)
                .cultivar(testCultivar)
                .tag("P001")
                .stage(PlantStage.VEGETATIVE)
                .status(PlantStatus.ACTIVE)
                .plantedDate(LocalDate.now())
                .notes("Healthy plant")
                .build();

        Plant saved = plantRepository.save(plant);
        entityManager.flush();
        entityManager.clear();

        Optional<Plant> found = plantRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getTag()).isEqualTo("P001");
        assertThat(found.get().getStage()).isEqualTo(PlantStage.VEGETATIVE);
        assertThat(found.get().getStatus()).isEqualTo(PlantStatus.ACTIVE);
    }

    @Test
    @DisplayName("Should enforce NOT NULL constraint on grow_id")
    void testGrowIdNotNull() {
        Plant plant = Plant.builder()
                .grow(null)
                .tag("P001")
                .build();

        assertThatThrownBy(() -> {
            plantRepository.save(plant);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    @DisplayName("Should allow null cultivar_id")
    void testCultivarIdNullable() {
        Plant plant = Plant.builder()
                .grow(testGrow)
                .cultivar(null)
                .tag("P001")
                .build();

        Plant saved = plantRepository.save(plant);
        assertThat(saved.getCultivar()).isNull();
    }

    @Test
    @DisplayName("Should enforce unique constraint on grow_id + tag")
    void testUniqueTagPerGrow() {
        Plant plant1 = Plant.builder()
                .grow(testGrow)
                .tag("P001")
                .build();
        plantRepository.save(plant1);
        entityManager.flush();

        Plant plant2 = Plant.builder()
                .grow(testGrow)
                .tag("P001") // Same tag in same grow
                .build();

        assertThatThrownBy(() -> {
            plantRepository.save(plant2);
            entityManager.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Should allow same tag in different grows")
    void testSameTagDifferentGrows() {
        Grow grow2 = Grow.builder()
                .user(testUser)
                .name("Grow 2")
                .startDate(LocalDate.now())
                .build();
        growRepository.save(grow2);
        entityManager.flush();

        Plant plant1 = Plant.builder()
                .grow(testGrow)
                .tag("P001")
                .build();
        plantRepository.save(plant1);

        Plant plant2 = Plant.builder()
                .grow(grow2)
                .tag("P001") // Same tag, different grow
                .build();
        Plant saved = plantRepository.save(plant2);

        assertThat(saved).isNotNull();
    }

    @Test
    @DisplayName("Should set default stage to SEEDLING")
    void testDefaultStage() {
        Plant plant = Plant.builder()
                .grow(testGrow)
                .tag("P001")
                .build();

        Plant saved = plantRepository.save(plant);
        assertThat(saved.getStage()).isEqualTo(PlantStage.SEEDLING);
    }

    @Test
    @DisplayName("Should set default status to ACTIVE")
    void testDefaultStatus() {
        Plant plant = Plant.builder()
                .grow(testGrow)
                .tag("P001")
                .build();

        Plant saved = plantRepository.save(plant);
        assertThat(saved.getStatus()).isEqualTo(PlantStatus.ACTIVE);
    }

    @Test
    @DisplayName("Should cascade delete when grow is deleted")
    void testCascadeDeleteGrow() {
        Plant plant = Plant.builder()
                .grow(testGrow)
                .tag("P001")
                .build();
        plantRepository.save(plant);
        entityManager.flush();

        long countBefore = plantRepository.count();
        assertThat(countBefore).isGreaterThan(0);

        growRepository.delete(testGrow);
        entityManager.flush();

        long countAfter = plantRepository.count();
        assertThat(countAfter).isZero();
    }

    @Test
    @DisplayName("Should SET NULL when cultivar is deleted")
    void testSetNullCultivar() {
        Plant plant = Plant.builder()
                .grow(testGrow)
                .cultivar(testCultivar)
                .tag("P001")
                .build();
        Plant saved = plantRepository.save(plant);
        entityManager.flush();

        cultivarRepository.delete(testCultivar);
        entityManager.flush();
        entityManager.clear();

        Optional<Plant> found = plantRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getCultivar()).isNull();
    }

    @Test
    @DisplayName("Should find plants by grow ID")
    void testFindByGrowId() {
        for (int i = 0; i < 3; i++) {
            plantRepository.save(Plant.builder()
                    .grow(testGrow)
                    .tag("P00" + i)
                    .build());
        }
        entityManager.flush();

        List<Plant> plants = plantRepository.findByGrowId(testGrow.getId());
        assertThat(plants).hasSize(3);
    }

    @Test
    @DisplayName("Should find plant by grow ID and tag")
    void testFindByGrowIdAndTag() {
        plantRepository.save(Plant.builder().grow(testGrow).tag("P001").build());
        entityManager.flush();

        Optional<Plant> found = plantRepository.findByGrowIdAndTag(testGrow.getId(), "P001");
        assertThat(found).isPresent();
        assertThat(found.get().getTag()).isEqualTo("P001");
    }

    @Test
    @DisplayName("Should find plants by stage")
    void testFindByGrowIdAndStage() {
        plantRepository.save(Plant.builder().grow(testGrow).tag("P001").stage(PlantStage.VEGETATIVE).build());
        plantRepository.save(Plant.builder().grow(testGrow).tag("P002").stage(PlantStage.VEGETATIVE).build());
        plantRepository.save(Plant.builder().grow(testGrow).tag("P003").stage(PlantStage.FLOWERING).build());
        entityManager.flush();

        List<Plant> vegPlants = plantRepository.findByGrowIdAndStage(testGrow.getId(), PlantStage.VEGETATIVE);
        assertThat(vegPlants).hasSize(2);
        assertThat(vegPlants).allMatch(p -> p.getStage() == PlantStage.VEGETATIVE);
    }

    @Test
    @DisplayName("Should find plants by status")
    void testFindByGrowIdAndStatus() {
        plantRepository.save(Plant.builder().grow(testGrow).tag("P001").status(PlantStatus.ACTIVE).build());
        plantRepository.save(Plant.builder().grow(testGrow).tag("P002").status(PlantStatus.ACTIVE).build());
        plantRepository.save(Plant.builder().grow(testGrow).tag("P003").status(PlantStatus.HARVESTED).build());
        entityManager.flush();

        List<Plant> activePlants = plantRepository.findByGrowIdAndStatus(testGrow.getId(), PlantStatus.ACTIVE);
        assertThat(activePlants).hasSize(2);
    }

    @Test
    @DisplayName("Should find active plants")
    void testFindActiveByGrowId() {
        plantRepository.save(Plant.builder().grow(testGrow).tag("P001").status(PlantStatus.ACTIVE).build());
        plantRepository.save(Plant.builder().grow(testGrow).tag("P002").status(PlantStatus.DEAD).build());
        entityManager.flush();

        List<Plant> activePlants = plantRepository.findActiveByGrowId(testGrow.getId());
        assertThat(activePlants).hasSize(1);
        assertThat(activePlants.get(0).getStatus()).isEqualTo(PlantStatus.ACTIVE);
    }

    @Test
    @DisplayName("Should find plants by cultivar")
    void testFindByCultivarId() {
        plantRepository.save(Plant.builder().grow(testGrow).cultivar(testCultivar).tag("P001").build());
        plantRepository.save(Plant.builder().grow(testGrow).cultivar(testCultivar).tag("P002").build());
        entityManager.flush();

        List<Plant> plants = plantRepository.findByCultivarId(testCultivar.getId());
        assertThat(plants).hasSize(2);
    }

    @Test
    @DisplayName("Should count plants in grow")
    void testCountByGrowId() {
        for (int i = 0; i < 5; i++) {
            plantRepository.save(Plant.builder().grow(testGrow).tag("P00" + i).build());
        }
        entityManager.flush();

        long count = plantRepository.countByGrowId(testGrow.getId());
        assertThat(count).isEqualTo(5);
    }

    @Test
    @DisplayName("Should check if plant exists by tag")
    void testExistsByGrowIdAndTag() {
        plantRepository.save(Plant.builder().grow(testGrow).tag("P001").build());
        entityManager.flush();

        assertThat(plantRepository.existsByGrowIdAndTag(testGrow.getId(), "P001")).isTrue();
        assertThat(plantRepository.existsByGrowIdAndTag(testGrow.getId(), "P999")).isFalse();
    }
}
