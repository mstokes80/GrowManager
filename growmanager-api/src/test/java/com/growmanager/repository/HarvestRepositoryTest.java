package com.growmanager.repository;

import com.growmanager.entity.Cultivar;
import com.growmanager.entity.Grow;
import com.growmanager.entity.Harvest;
import com.growmanager.entity.Plant;
import com.growmanager.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for HarvestRepository.
 */
@DataJpaTest
@ActiveProfiles("test")
class HarvestRepositoryTest {

    @Autowired
    private HarvestRepository harvestRepository;

    @Autowired
    private PlantRepository plantRepository;

    @Autowired
    private GrowRepository growRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CultivarRepository cultivarRepository;

    private User testUser;
    private Grow testGrow;
    private Plant testPlant1;
    private Plant testPlant2;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = User.builder()
                .email("test@example.com")
                .emailVerified(true)
                .role(User.Role.USER)
                .build();
        testUser.setPassword("password"); // Use setPassword() to properly hash the password
        testUser = userRepository.save(testUser);

        // Create test cultivar
        Cultivar testCultivar = Cultivar.builder()
                .name("Test Cultivar")
                .user(testUser)
                .type(Cultivar.CultivarType.HYBRID)
                .build();
        testCultivar = cultivarRepository.save(testCultivar);

        // Create test grow
        testGrow = Grow.builder()
                .name("Test Grow")
                .user(testUser)
                .startDate(LocalDate.now().minusMonths(3))
                .status(Grow.GrowStatus.ACTIVE)
                .build();
        testGrow = growRepository.save(testGrow);

        // Create test plants
        testPlant1 = Plant.builder()
                .tag("Plant-001")
                .grow(testGrow)
                .cultivar(testCultivar)
                .stage(Plant.PlantStage.FLOWERING)
                .status(Plant.PlantStatus.ACTIVE)
                .build();
        testPlant1 = plantRepository.save(testPlant1);

        testPlant2 = Plant.builder()
                .tag("Plant-002")
                .grow(testGrow)
                .cultivar(testCultivar)
                .stage(Plant.PlantStage.FLOWERING)
                .status(Plant.PlantStatus.ACTIVE)
                .build();
        testPlant2 = plantRepository.save(testPlant2);
    }

    @Test
    void testCreateHarvest() {
        // Given
        Harvest harvest = Harvest.builder()
                .plant(testPlant1)
                .grow(testGrow)
                .harvestDate(LocalDate.now())
                .wetWeight(new BigDecimal("150.50"))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .qualityRating(8)
                .notes("First harvest test")
                .build();

        // When
        Harvest saved = harvestRepository.save(harvest);

        // Then
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getPlant().getId()).isEqualTo(testPlant1.getId());
        assertThat(saved.getGrow().getId()).isEqualTo(testGrow.getId());
        assertThat(saved.getWetWeight()).isEqualByComparingTo(new BigDecimal("150.50"));
        assertThat(saved.getWeightUnit()).isEqualTo(Harvest.WeightUnit.GRAMS);
        assertThat(saved.getQualityRating()).isEqualTo(8);
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void testFindByPlantId() {
        // Given
        Harvest harvest = Harvest.builder()
                .plant(testPlant1)
                .grow(testGrow)
                .harvestDate(LocalDate.now())
                .wetWeight(new BigDecimal("100.00"))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .build();
        harvestRepository.save(harvest);

        // When
        List<Harvest> harvests = harvestRepository.findByPlantId(testPlant1.getId());

        // Then
        assertThat(harvests).hasSize(1);
        assertThat(harvests.get(0).getPlant().getId()).isEqualTo(testPlant1.getId());
    }

    @Test
    void testFindByGrowIdOrderByHarvestDateDesc() {
        // Given
        Harvest harvest1 = Harvest.builder()
                .plant(testPlant1)
                .grow(testGrow)
                .harvestDate(LocalDate.now().minusDays(2))
                .wetWeight(new BigDecimal("100.00"))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .build();
        harvestRepository.save(harvest1);

        Harvest harvest2 = Harvest.builder()
                .plant(testPlant2)
                .grow(testGrow)
                .harvestDate(LocalDate.now())
                .wetWeight(new BigDecimal("120.00"))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .build();
        harvestRepository.save(harvest2);

        // When
        List<Harvest> harvests = harvestRepository.findByGrowIdOrderByHarvestDateDesc(testGrow.getId());

        // Then
        assertThat(harvests).hasSize(2);
        assertThat(harvests.get(0).getHarvestDate()).isEqualTo(LocalDate.now());
        assertThat(harvests.get(1).getHarvestDate()).isEqualTo(LocalDate.now().minusDays(2));
    }

    @Test
    void testCalculateTotalWetWeight() {
        // Given
        Harvest harvest1 = Harvest.builder()
                .plant(testPlant1)
                .grow(testGrow)
                .harvestDate(LocalDate.now())
                .wetWeight(new BigDecimal("100.00"))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .build();
        harvestRepository.save(harvest1);

        Harvest harvest2 = Harvest.builder()
                .plant(testPlant2)
                .grow(testGrow)
                .harvestDate(LocalDate.now())
                .wetWeight(new BigDecimal("150.00"))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .build();
        harvestRepository.save(harvest2);

        // When
        BigDecimal total = harvestRepository.calculateTotalWetWeight(
                testGrow.getId(), Harvest.WeightUnit.GRAMS);

        // Then
        assertThat(total).isEqualByComparingTo(new BigDecimal("250.00"));
    }

    @Test
    void testCalculateTotalDryWeight() {
        // Given
        Harvest harvest1 = Harvest.builder()
                .plant(testPlant1)
                .grow(testGrow)
                .harvestDate(LocalDate.now())
                .wetWeight(new BigDecimal("100.00"))
                .dryWeight(new BigDecimal("25.00"))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .build();
        harvestRepository.save(harvest1);

        Harvest harvest2 = Harvest.builder()
                .plant(testPlant2)
                .grow(testGrow)
                .harvestDate(LocalDate.now())
                .wetWeight(new BigDecimal("150.00"))
                .dryWeight(new BigDecimal("35.00"))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .build();
        harvestRepository.save(harvest2);

        // When
        BigDecimal total = harvestRepository.calculateTotalDryWeight(
                testGrow.getId(), Harvest.WeightUnit.GRAMS);

        // Then
        assertThat(total).isEqualByComparingTo(new BigDecimal("60.00"));
    }

    @Test
    void testCalculateAverageQuality() {
        // Given
        Harvest harvest1 = Harvest.builder()
                .plant(testPlant1)
                .grow(testGrow)
                .harvestDate(LocalDate.now())
                .wetWeight(new BigDecimal("100.00"))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .qualityRating(8)
                .build();
        harvestRepository.save(harvest1);

        Harvest harvest2 = Harvest.builder()
                .plant(testPlant2)
                .grow(testGrow)
                .harvestDate(LocalDate.now())
                .wetWeight(new BigDecimal("150.00"))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .qualityRating(10)
                .build();
        harvestRepository.save(harvest2);

        // When
        Double average = harvestRepository.calculateAverageQuality(testGrow.getId());

        // Then
        assertThat(average).isEqualTo(9.0);
    }

    @Test
    void testCountByGrowId() {
        // Given
        Harvest harvest1 = Harvest.builder()
                .plant(testPlant1)
                .grow(testGrow)
                .harvestDate(LocalDate.now())
                .wetWeight(new BigDecimal("100.00"))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .build();
        harvestRepository.save(harvest1);

        Harvest harvest2 = Harvest.builder()
                .plant(testPlant2)
                .grow(testGrow)
                .harvestDate(LocalDate.now())
                .wetWeight(new BigDecimal("150.00"))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .build();
        harvestRepository.save(harvest2);

        // When
        long count = harvestRepository.countByGrowId(testGrow.getId());

        // Then
        assertThat(count).isEqualTo(2);
    }

    @Test
    void testTerpeneProfile() {
        // Given
        String terpeneJson = "{\"limonene\":0.5,\"myrcene\":0.3,\"pinene\":0.2}";
        Harvest harvest = Harvest.builder()
                .plant(testPlant1)
                .grow(testGrow)
                .harvestDate(LocalDate.now())
                .wetWeight(new BigDecimal("100.00"))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .terpeneProfile(terpeneJson)
                .build();

        // When
        Harvest saved = harvestRepository.save(harvest);
        Harvest found = harvestRepository.findById(saved.getId()).orElseThrow();

        // Then
        assertThat(found.getTerpeneProfile()).isEqualTo(terpeneJson);
    }

    @Test
    void testPotencyFields() {
        // Given
        Harvest harvest = Harvest.builder()
                .plant(testPlant1)
                .grow(testGrow)
                .harvestDate(LocalDate.now())
                .wetWeight(new BigDecimal("100.00"))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .thcPercent(new BigDecimal("22.5"))
                .cbdPercent(new BigDecimal("0.5"))
                .build();

        // When
        Harvest saved = harvestRepository.save(harvest);

        // Then
        assertThat(saved.getThcPercent()).isEqualByComparingTo(new BigDecimal("22.50"));
        assertThat(saved.getCbdPercent()).isEqualByComparingTo(new BigDecimal("0.50"));
    }

    @Test
    void testCascadeDelete() {
        // Given
        Harvest harvest = Harvest.builder()
                .plant(testPlant1)
                .grow(testGrow)
                .harvestDate(LocalDate.now())
                .wetWeight(new BigDecimal("100.00"))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .build();
        Harvest saved = harvestRepository.save(harvest);

        // When
        plantRepository.delete(testPlant1);
        plantRepository.flush();

        // Then
        assertThat(harvestRepository.findById(saved.getId())).isEmpty();
    }
}