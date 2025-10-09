package com.growmanager.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.growmanager.entity.Cultivar;
import com.growmanager.entity.Cultivar.CultivarType;
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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

/**
 * Test suite for CultivarRepository.
 * Tests database constraints, indexes, and repository methods.
 */
@DataJpaTest
@ActiveProfiles("test")
class CultivarRepositoryTest {

    @Autowired
    private CultivarRepository cultivarRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    private User testUser;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();

        // Create test user
        testUser = User.builder()
                .email("grower@example.com")
                .passwordHash("$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG")
                .displayName("Test Grower")
                .role(User.Role.USER)
                .timezone("UTC")
                .build();
        testUser = userRepository.save(testUser);
        entityManager.flush();
    }

    @Test
    @DisplayName("Should create cultivar with all required fields")
    void testCreateCultivar() {
        // Create JSONB characteristics
        ObjectNode characteristics = objectMapper.createObjectNode();
        characteristics.put("flowering_time", "8-9 weeks");
        characteristics.put("yield", "high");
        characteristics.put("thc_content", "20-25%");

        Cultivar cultivar = Cultivar.builder()
                .user(testUser)
                .name("Blue Dream")
                .breeder("Humboldt Seeds")
                .genetics("Blueberry x Haze")
                .type(CultivarType.HYBRID)
                .characteristics(characteristics)
                .build();

        Cultivar saved = cultivarRepository.save(cultivar);
        entityManager.flush();
        entityManager.clear();

        Optional<Cultivar> found = cultivarRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Blue Dream");
        assertThat(found.get().getBreeder()).isEqualTo("Humboldt Seeds");
        assertThat(found.get().getType()).isEqualTo(CultivarType.HYBRID);
        assertThat(found.get().getCharacteristics()).isNotNull();
        assertThat(found.get().getCharacteristics().get("flowering_time").asText()).isEqualTo("8-9 weeks");
    }

    @Test
    @DisplayName("Should enforce NOT NULL constraint on user_id")
    void testUserIdNotNull() {
        Cultivar cultivar = Cultivar.builder()
                .user(null) // Null user
                .name("Test Strain")
                .type(CultivarType.INDICA)
                .build();

        assertThatThrownBy(() -> {
            cultivarRepository.save(cultivar);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    @DisplayName("Should enforce NOT NULL constraint on name")
    void testNameNotNull() {
        Cultivar cultivar = Cultivar.builder()
                .user(testUser)
                .name(null) // Null name
                .type(CultivarType.INDICA)
                .build();

        assertThatThrownBy(() -> {
            cultivarRepository.save(cultivar);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    @DisplayName("Should set default type to UNKNOWN")
    void testDefaultType() {
        Cultivar cultivar = Cultivar.builder()
                .user(testUser)
                .name("Mystery Strain")
                .build();

        Cultivar saved = cultivarRepository.save(cultivar);
        entityManager.flush();

        assertThat(saved.getType()).isEqualTo(CultivarType.UNKNOWN);
    }

    @Test
    @DisplayName("Should accept all valid cultivar types")
    void testAllCultivarTypes() {
        for (CultivarType type : CultivarType.values()) {
            Cultivar cultivar = Cultivar.builder()
                    .user(testUser)
                    .name("Strain " + type.name())
                    .type(type)
                    .build();

            Cultivar saved = cultivarRepository.save(cultivar);
            assertThat(saved.getType()).isEqualTo(type);
        }
    }

    @Test
    @DisplayName("Should cascade delete when user is deleted")
    void testCascadeDelete() {
        Cultivar cultivar = Cultivar.builder()
                .user(testUser)
                .name("Test Strain")
                .type(CultivarType.INDICA)
                .build();

        cultivarRepository.save(cultivar);
        entityManager.flush();

        long countBefore = cultivarRepository.count();
        assertThat(countBefore).isGreaterThan(0);

        userRepository.delete(testUser);
        entityManager.flush();

        long countAfter = cultivarRepository.count();
        assertThat(countAfter).isZero();
    }

    @Test
    @DisplayName("Should find cultivars by user ID")
    void testFindByUserId() {
        // Create multiple cultivars
        for (int i = 0; i < 3; i++) {
            Cultivar cultivar = Cultivar.builder()
                    .user(testUser)
                    .name("Strain " + i)
                    .type(CultivarType.HYBRID)
                    .build();
            cultivarRepository.save(cultivar);
        }
        entityManager.flush();

        List<Cultivar> cultivars = cultivarRepository.findByUserId(testUser.getId());
        assertThat(cultivars).hasSize(3);
        assertThat(cultivars).allMatch(c -> c.getUser().getId().equals(testUser.getId()));
    }

    @Test
    @DisplayName("Should find cultivar by user ID and name")
    void testFindByUserIdAndName() {
        Cultivar cultivar = Cultivar.builder()
                .user(testUser)
                .name("Unique Strain")
                .type(CultivarType.SATIVA)
                .build();
        cultivarRepository.save(cultivar);
        entityManager.flush();

        Optional<Cultivar> found = cultivarRepository.findByUserIdAndName(testUser.getId(), "Unique Strain");
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Unique Strain");

        Optional<Cultivar> notFound = cultivarRepository.findByUserIdAndName(testUser.getId(), "Nonexistent");
        assertThat(notFound).isEmpty();
    }

    @Test
    @DisplayName("Should find cultivars by type")
    void testFindByUserIdAndType() {
        cultivarRepository.save(Cultivar.builder().user(testUser).name("Indica 1").type(CultivarType.INDICA).build());
        cultivarRepository.save(Cultivar.builder().user(testUser).name("Indica 2").type(CultivarType.INDICA).build());
        cultivarRepository.save(Cultivar.builder().user(testUser).name("Sativa 1").type(CultivarType.SATIVA).build());
        entityManager.flush();

        List<Cultivar> indicas = cultivarRepository.findByUserIdAndType(testUser.getId(), CultivarType.INDICA);
        assertThat(indicas).hasSize(2);
        assertThat(indicas).allMatch(c -> c.getType() == CultivarType.INDICA);
    }

    @Test
    @DisplayName("Should find cultivars by breeder")
    void testFindByUserIdAndBreeder() {
        cultivarRepository.save(Cultivar.builder().user(testUser).name("Strain 1").breeder("Breeder A").type(CultivarType.HYBRID).build());
        cultivarRepository.save(Cultivar.builder().user(testUser).name("Strain 2").breeder("Breeder A").type(CultivarType.HYBRID).build());
        cultivarRepository.save(Cultivar.builder().user(testUser).name("Strain 3").breeder("Breeder B").type(CultivarType.HYBRID).build());
        entityManager.flush();

        List<Cultivar> breederACultivars = cultivarRepository.findByUserIdAndBreeder(testUser.getId(), "Breeder A");
        assertThat(breederACultivars).hasSize(2);
        assertThat(breederACultivars).allMatch(c -> c.getBreeder().equals("Breeder A"));
    }

    @Test
    @DisplayName("Should search cultivars by name pattern")
    void testSearchByName() {
        cultivarRepository.save(Cultivar.builder().user(testUser).name("Blue Dream").type(CultivarType.HYBRID).build());
        cultivarRepository.save(Cultivar.builder().user(testUser).name("Blue Cheese").type(CultivarType.HYBRID).build());
        cultivarRepository.save(Cultivar.builder().user(testUser).name("Green Crack").type(CultivarType.HYBRID).build());
        entityManager.flush();

        List<Cultivar> results = cultivarRepository.searchByName(testUser.getId(), "blue");
        assertThat(results).hasSize(2);
        assertThat(results).allMatch(c -> c.getName().toLowerCase().contains("blue"));
    }

    @Test
    @DisplayName("Should count cultivars by user ID")
    void testCountByUserId() {
        for (int i = 0; i < 5; i++) {
            cultivarRepository.save(Cultivar.builder().user(testUser).name("Strain " + i).type(CultivarType.HYBRID).build());
        }
        entityManager.flush();

        long count = cultivarRepository.countByUserId(testUser.getId());
        assertThat(count).isEqualTo(5);
    }

    @Test
    @DisplayName("Should count cultivars by type")
    void testCountByUserIdAndType() {
        cultivarRepository.save(Cultivar.builder().user(testUser).name("Indica 1").type(CultivarType.INDICA).build());
        cultivarRepository.save(Cultivar.builder().user(testUser).name("Indica 2").type(CultivarType.INDICA).build());
        cultivarRepository.save(Cultivar.builder().user(testUser).name("Sativa 1").type(CultivarType.SATIVA).build());
        entityManager.flush();

        long indicaCount = cultivarRepository.countByUserIdAndType(testUser.getId(), CultivarType.INDICA);
        assertThat(indicaCount).isEqualTo(2);
    }

    @Test
    @DisplayName("Should check if cultivar exists by name")
    void testExistsByUserIdAndName() {
        cultivarRepository.save(Cultivar.builder().user(testUser).name("Existing Strain").type(CultivarType.HYBRID).build());
        entityManager.flush();

        assertThat(cultivarRepository.existsByUserIdAndName(testUser.getId(), "Existing Strain")).isTrue();
        assertThat(cultivarRepository.existsByUserIdAndName(testUser.getId(), "Nonexistent")).isFalse();
    }

    @Test
    @DisplayName("Should find distinct breeders")
    void testFindDistinctBreeders() {
        cultivarRepository.save(Cultivar.builder().user(testUser).name("Strain 1").breeder("Breeder A").type(CultivarType.HYBRID).build());
        cultivarRepository.save(Cultivar.builder().user(testUser).name("Strain 2").breeder("Breeder B").type(CultivarType.HYBRID).build());
        cultivarRepository.save(Cultivar.builder().user(testUser).name("Strain 3").breeder("Breeder A").type(CultivarType.HYBRID).build());
        cultivarRepository.save(Cultivar.builder().user(testUser).name("Strain 4").breeder(null).type(CultivarType.HYBRID).build());
        entityManager.flush();

        List<String> breeders = cultivarRepository.findDistinctBreedersByUserId(testUser.getId());
        assertThat(breeders).hasSize(2);
        assertThat(breeders).containsExactlyInAnyOrder("Breeder A", "Breeder B");
    }

    @Test
    @DisplayName("Should auto-update timestamps")
    void testTimestampAutoUpdate() throws InterruptedException {
        Cultivar cultivar = Cultivar.builder()
                .user(testUser)
                .name("Test Strain")
                .type(CultivarType.HYBRID)
                .build();

        Cultivar saved = cultivarRepository.save(cultivar);
        entityManager.flush();

        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isEqualTo(saved.getCreatedAt());

        Thread.sleep(100);
        saved.setBreeder("New Breeder");
        cultivarRepository.save(saved);
        entityManager.flush();
        entityManager.clear();

        Optional<Cultivar> updated = cultivarRepository.findById(saved.getId());
        assertThat(updated).isPresent();
        assertThat(updated.get().getUpdatedAt()).isAfter(updated.get().getCreatedAt());
    }

    @Test
    @DisplayName("Should handle JSONB characteristics field")
    void testJsonbCharacteristics() {
        ObjectNode characteristics = objectMapper.createObjectNode();
        characteristics.put("flowering_time", "8 weeks");
        characteristics.put("yield", "medium");
        characteristics.put("effects", "relaxing");
        characteristics.put("thc_content", "18%");

        Cultivar cultivar = Cultivar.builder()
                .user(testUser)
                .name("Test Strain")
                .type(CultivarType.INDICA)
                .characteristics(characteristics)
                .build();

        Cultivar saved = cultivarRepository.save(cultivar);
        entityManager.flush();
        entityManager.clear();

        Optional<Cultivar> found = cultivarRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getCharacteristics()).isNotNull();
        assertThat(found.get().getCharacteristics().get("flowering_time").asText()).isEqualTo("8 weeks");
        assertThat(found.get().getCharacteristics().get("yield").asText()).isEqualTo("medium");
        assertThat(found.get().getCharacteristics().get("effects").asText()).isEqualTo("relaxing");
    }
}
