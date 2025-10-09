package com.growmanager.integration;

import com.growmanager.entity.User;
import com.growmanager.repository.UserRepository;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test for the User database layer.
 * Verifies that Flyway migrations, JPA entity, and repository all work together correctly.
 * Uses TestContainers to spin up a real PostgreSQL database for testing.
 */
@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class UserDatabaseIntegrationTest {

    @Container
    private static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:14-alpine")
            .withDatabaseName("growmanager_test")
            .withUsername("test")
            .withPassword("test");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private Flyway flyway;

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.flyway.enabled", () -> "true");
    }

    @BeforeEach
    void setUp() {
        // Clean up any existing data
        userRepository.deleteAll();
    }

    @Test
    @Order(1)
    @DisplayName("Should run Flyway migration successfully")
    void testFlywayMigration() {
        // Flyway should have run automatically on startup
        assertThat(flyway.info().current()).isNotNull();
        assertThat(flyway.info().current().getVersion().toString()).isEqualTo("001");
        assertThat(flyway.info().current().getDescription()).isEqualTo("create users table");
    }

    @Test
    @Order(2)
    @DisplayName("Should create user and persist all fields correctly")
    void testCreateUser() {
        // Create a user with all fields populated
        User user = User.builder()
                .email("test@example.com")
                .displayName("Test User")
                .role(User.Role.USER)
                .timezone("America/New_York")
                .emailVerified(false)
                .failedLoginAttempts(0)
                .build();

        // Set password using the entity method
        user.setPassword("SecurePassword123!");

        // Generate tokens
        String emailToken = user.generateEmailVerificationToken(24);
        String resetToken = user.generatePasswordResetToken(1);

        // Save user
        User savedUser = userRepository.save(user);

        // Verify all fields were persisted
        assertThat(savedUser.getId()).isNotNull();
        assertThat(savedUser.getEmail()).isEqualTo("test@example.com");
        assertThat(savedUser.getDisplayName()).isEqualTo("Test User");
        assertThat(savedUser.getRole()).isEqualTo(User.Role.USER);
        assertThat(savedUser.getTimezone()).isEqualTo("America/New_York");
        assertThat(savedUser.isEmailVerified()).isFalse();
        assertThat(savedUser.getFailedLoginAttempts()).isEqualTo(0);
        assertThat(savedUser.getEmailVerificationToken()).isEqualTo(emailToken);
        assertThat(savedUser.getPasswordResetToken()).isEqualTo(resetToken);
        assertThat(savedUser.getCreatedAt()).isNotNull();
        assertThat(savedUser.getUpdatedAt()).isNotNull();

        // Verify password was hashed (BCrypt hashes start with $2a$)
        assertThat(savedUser.getPasswordHash()).startsWith("$2a$");
        assertThat(savedUser.getPasswordHash()).hasSize(60);

        // Verify password verification works
        assertThat(savedUser.verifyPassword("SecurePassword123!")).isTrue();
        assertThat(savedUser.verifyPassword("WrongPassword")).isFalse();
    }

    @Test
    @Order(3)
    @DisplayName("Should query user by email")
    void testFindByEmail() {
        // Create and save a user
        User user = User.builder()
                .email("findme@example.com")
                .displayName("Find Me")
                .role(User.Role.USER)
                .build();
        user.setPassword("password");
        userRepository.save(user);

        // Find by email
        Optional<User> found = userRepository.findByEmail("findme@example.com");
        assertThat(found).isPresent();
        assertThat(found.get().getDisplayName()).isEqualTo("Find Me");

        // Verify case sensitivity
        Optional<User> notFound = userRepository.findByEmail("FINDME@EXAMPLE.COM");
        assertThat(notFound).isEmpty();
    }

    @Test
    @Order(4)
    @DisplayName("Should query user by email verification token")
    void testFindByEmailVerificationToken() {
        // Create user with verification token
        User user = User.builder()
                .email("verify@example.com")
                .displayName("Verify Me")
                .role(User.Role.USER)
                .build();
        user.setPassword("password");
        String token = user.generateEmailVerificationToken(24);
        userRepository.save(user);

        // Find by token
        Optional<User> found = userRepository.findByEmailVerificationToken(token);
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("verify@example.com");

        // Verify token validation
        assertThat(found.get().isEmailVerificationTokenValid(token)).isTrue();
        assertThat(found.get().isEmailVerificationTokenValid("wrong-token")).isFalse();
    }

    @Test
    @Order(5)
    @DisplayName("Should query user by password reset token")
    void testFindByPasswordResetToken() {
        // Create user with reset token
        User user = User.builder()
                .email("reset@example.com")
                .displayName("Reset Me")
                .role(User.Role.USER)
                .build();
        user.setPassword("password");
        String token = user.generatePasswordResetToken(1);
        userRepository.save(user);

        // Find by token
        Optional<User> found = userRepository.findByPasswordResetToken(token);
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("reset@example.com");

        // Verify token validation
        assertThat(found.get().isPasswordResetTokenValid(token)).isTrue();
        assertThat(found.get().isPasswordResetTokenValid("wrong-token")).isFalse();
    }

    @Test
    @Order(6)
    @DisplayName("Should check if email exists")
    void testExistsByEmail() {
        // Create user
        User user = User.builder()
                .email("exists@example.com")
                .displayName("I Exist")
                .role(User.Role.USER)
                .build();
        user.setPassword("password");
        userRepository.save(user);

        // Check existence
        assertThat(userRepository.existsByEmail("exists@example.com")).isTrue();
        assertThat(userRepository.existsByEmail("notexists@example.com")).isFalse();
    }

    @Test
    @Order(7)
    @DisplayName("Should handle account locking correctly")
    void testAccountLocking() {
        // Create user
        User user = User.builder()
                .email("locked@example.com")
                .displayName("Lock Me")
                .role(User.Role.USER)
                .failedLoginAttempts(0)
                .build();
        user.setPassword("password");
        User savedUser = userRepository.save(user);

        // Simulate failed login attempts
        for (int i = 0; i < 5; i++) {
            savedUser.incrementFailedLoginAttempts();
        }
        assertThat(savedUser.getFailedLoginAttempts()).isEqualTo(5);

        // Lock account
        savedUser.lockAccountUntil(LocalDateTime.now().plusMinutes(30));
        userRepository.save(savedUser);

        // Verify account is locked
        Optional<User> lockedUser = userRepository.findById(savedUser.getId());
        assertThat(lockedUser).isPresent();
        assertThat(lockedUser.get().isAccountLocked()).isTrue();

        // Find all locked users
        List<User> lockedUsers = userRepository.findAllLockedUsers();
        assertThat(lockedUsers).hasSize(1);
        assertThat(lockedUsers.get(0).getEmail()).isEqualTo("locked@example.com");

        // Reset failed attempts
        savedUser.resetFailedLoginAttempts();
        userRepository.save(savedUser);

        // Verify account is unlocked
        Optional<User> unlockedUser = userRepository.findById(savedUser.getId());
        assertThat(unlockedUser).isPresent();
        assertThat(unlockedUser.get().isAccountLocked()).isFalse();
        assertThat(unlockedUser.get().getFailedLoginAttempts()).isEqualTo(0);
    }

    @Test
    @Order(8)
    @DisplayName("Should handle different user roles")
    void testUserRoles() {
        // Create regular user
        User regularUser = User.builder()
                .email("user@example.com")
                .displayName("Regular User")
                .role(User.Role.USER)
                .build();
        regularUser.setPassword("password");
        userRepository.save(regularUser);

        // Create admin user
        User adminUser = User.builder()
                .email("admin@example.com")
                .displayName("Admin User")
                .role(User.Role.ADMIN)
                .build();
        adminUser.setPassword("password");
        userRepository.save(adminUser);

        // Find by role
        List<User> users = userRepository.findByRole(User.Role.USER);
        assertThat(users).hasSize(1);
        assertThat(users.get(0).getEmail()).isEqualTo("user@example.com");

        List<User> admins = userRepository.findByRole(User.Role.ADMIN);
        assertThat(admins).hasSize(1);
        assertThat(admins.get(0).getEmail()).isEqualTo("admin@example.com");

        // Count by role
        assertThat(userRepository.countByRole(User.Role.USER)).isEqualTo(1);
        assertThat(userRepository.countByRole(User.Role.ADMIN)).isEqualTo(1);
    }

    @Test
    @Order(9)
    @DisplayName("Should update user and auto-update timestamp")
    void testUpdateUser() throws InterruptedException {
        // Create user
        User user = User.builder()
                .email("update@example.com")
                .displayName("Original Name")
                .role(User.Role.USER)
                .build();
        user.setPassword("password");
        User savedUser = userRepository.save(user);

        LocalDateTime originalCreatedAt = savedUser.getCreatedAt();
        LocalDateTime originalUpdatedAt = savedUser.getUpdatedAt();

        // Wait to ensure different timestamp
        Thread.sleep(100);

        // Update user
        savedUser.setDisplayName("Updated Name");
        User updatedUser = userRepository.save(savedUser);

        // Verify timestamps
        assertThat(updatedUser.getCreatedAt()).isEqualTo(originalCreatedAt);
        assertThat(updatedUser.getUpdatedAt()).isAfter(originalUpdatedAt);
        assertThat(updatedUser.getDisplayName()).isEqualTo("Updated Name");
    }

    @Test
    @Order(10)
    @DisplayName("Should handle email verification workflow")
    void testEmailVerificationWorkflow() {
        // Create unverified user
        User user = User.builder()
                .email("unverified@example.com")
                .displayName("Unverified User")
                .role(User.Role.USER)
                .emailVerified(false)
                .build();
        user.setPassword("password");
        String token = user.generateEmailVerificationToken(24);
        User savedUser = userRepository.save(user);

        // Find unverified users
        List<User> unverifiedUsers = userRepository.findAllUnverifiedUsers();
        assertThat(unverifiedUsers).hasSize(1);
        assertThat(unverifiedUsers.get(0).getEmail()).isEqualTo("unverified@example.com");

        // Verify email
        savedUser.clearEmailVerificationToken();
        userRepository.save(savedUser);

        // Confirm verification
        Optional<User> verifiedUser = userRepository.findById(savedUser.getId());
        assertThat(verifiedUser).isPresent();
        assertThat(verifiedUser.get().isEmailVerified()).isTrue();
        assertThat(verifiedUser.get().getEmailVerificationToken()).isNull();
        assertThat(verifiedUser.get().getEmailVerificationExpiresAt()).isNull();

        // Verify no longer in unverified list
        unverifiedUsers = userRepository.findAllUnverifiedUsers();
        assertThat(unverifiedUsers).isEmpty();
    }

    @Test
    @Order(11)
    @DisplayName("Should handle password reset workflow")
    void testPasswordResetWorkflow() {
        // Create user
        User user = User.builder()
                .email("resetpassword@example.com")
                .displayName("Reset Password User")
                .role(User.Role.USER)
                .build();
        user.setPassword("oldPassword");
        User savedUser = userRepository.save(user);

        // Verify old password works
        assertThat(savedUser.verifyPassword("oldPassword")).isTrue();

        // Generate reset token
        String resetToken = savedUser.generatePasswordResetToken(1);
        userRepository.save(savedUser);

        // Find by reset token
        Optional<User> foundUser = userRepository.findByPasswordResetToken(resetToken);
        assertThat(foundUser).isPresent();

        // Reset password
        foundUser.get().setPassword("newPassword");
        foundUser.get().clearPasswordResetToken();
        userRepository.save(foundUser.get());

        // Verify new password works
        Optional<User> resetUser = userRepository.findById(savedUser.getId());
        assertThat(resetUser).isPresent();
        assertThat(resetUser.get().verifyPassword("newPassword")).isTrue();
        assertThat(resetUser.get().verifyPassword("oldPassword")).isFalse();
        assertThat(resetUser.get().getPasswordResetToken()).isNull();
        assertThat(resetUser.get().getPasswordResetExpiresAt()).isNull();
    }

    @Test
    @Order(12)
    @DisplayName("Should enforce unique email constraint at database level")
    void testUniqueEmailConstraint() {
        // Create first user
        User user1 = User.builder()
                .email("unique@example.com")
                .displayName("First User")
                .role(User.Role.USER)
                .build();
        user1.setPassword("password");
        userRepository.save(user1);

        // Try to create second user with same email
        User user2 = User.builder()
                .email("unique@example.com") // Same email
                .displayName("Second User")
                .role(User.Role.USER)
                .build();
        user2.setPassword("password");

        // Should throw exception due to unique constraint
        org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.dao.DataIntegrityViolationException.class,
                () -> {
                    userRepository.save(user2);
                    userRepository.flush(); // Force database constraint check
                }
        );
    }
}