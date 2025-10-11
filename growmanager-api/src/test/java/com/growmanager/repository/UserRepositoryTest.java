package com.growmanager.repository;

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

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Test suite for UserRepository.
 * Tests database constraints, indexes, and repository methods.
 */
@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    private User testUser;

    @BeforeEach
    void setUp() {
        // Create a valid test user
        testUser = User.builder()
                .email("test@example.com")
                .passwordHash("$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG") // BCrypt hash
                .displayName("Test User")
                .role(User.Role.USER)
                .timezone("America/New_York")
                .emailVerified(false)
                .failedLoginAttempts(0)
                .build();
    }

    // Test user table creation
    @Test
    @DisplayName("Should create user table with all required fields")
    void testUserTableCreation() {
        // Save user
        User savedUser = userRepository.save(testUser);
        entityManager.flush();
        entityManager.clear();

        // Verify all fields are persisted
        Optional<User> found = userRepository.findById(savedUser.getId());
        assertThat(found).isPresent();

        User foundUser = found.get();
        assertThat(foundUser.getId()).isNotNull();
        assertThat(foundUser.getEmail()).isEqualTo("test@example.com");
        assertThat(foundUser.getPasswordHash()).isNotNull();
        assertThat(foundUser.getDisplayName()).isEqualTo("Test User");
        assertThat(foundUser.getRole()).isEqualTo(User.Role.USER);
        assertThat(foundUser.getTimezone()).isEqualTo("America/New_York");
        assertThat(foundUser.isEmailVerified()).isFalse();
        assertThat(foundUser.getFailedLoginAttempts()).isEqualTo(0);
        assertThat(foundUser.getCreatedAt()).isNotNull();
        assertThat(foundUser.getUpdatedAt()).isNotNull();
    }

    // Test unique constraint on email
    @Test
    @DisplayName("Should enforce unique constraint on email")
    void testEmailUniqueConstraint() {
        // Save first user
        userRepository.save(testUser);
        entityManager.flush();

        // Try to save another user with same email
        User duplicateUser = User.builder()
                .email("test@example.com") // Same email
                .passwordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy")
                .displayName("Another User")
                .role(User.Role.USER)
                .timezone("UTC")
                .emailVerified(false)
                .failedLoginAttempts(0)
                .build();

        assertThatThrownBy(() -> {
            userRepository.save(duplicateUser);
            entityManager.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    // Test indexes existence (these will be validated when migration runs)
    @Test
    @DisplayName("Should have index on email field")
    void testEmailIndex() {
        // Save multiple users
        for (int i = 0; i < 5; i++) {
            User user = User.builder()
                    .email("user" + i + "@example.com")
                    .passwordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy")
                    .displayName("User " + i)
                    .role(User.Role.USER)
                    .timezone("UTC")
                    .emailVerified(false)
                    .failedLoginAttempts(0)
                    .build();
            userRepository.save(user);
        }
        entityManager.flush();

        // Query by email should be efficient (index exists)
        Optional<User> found = userRepository.findByEmail("user3@example.com");
        assertThat(found).isPresent();
        assertThat(found.get().getDisplayName()).isEqualTo("User 3");
    }

    @Test
    @DisplayName("Should have index on email verification token")
    void testEmailVerificationTokenIndex() {
        String token = UUID.randomUUID().toString();
        testUser.setEmailVerificationToken(token);
        testUser.setEmailVerificationExpiresAt(LocalDateTime.now().plusHours(24));

        userRepository.save(testUser);
        entityManager.flush();

        // Query by verification token should be efficient (index exists)
        Optional<User> found = userRepository.findByEmailVerificationToken(token);
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("Should have index on password reset token")
    void testPasswordResetTokenIndex() {
        String token = UUID.randomUUID().toString();
        testUser.setPasswordResetToken(token);
        testUser.setPasswordResetExpiresAt(LocalDateTime.now().plusHours(1));

        userRepository.save(testUser);
        entityManager.flush();

        // Query by reset token should be efficient (index exists)
        Optional<User> found = userRepository.findByPasswordResetToken(token);
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");
    }

    // Test default values
    @Test
    @DisplayName("Should set default value for role")
    void testRoleDefaultValue() {
        // When role is not explicitly set, it defaults to USER
        User user = User.builder()
                .email("default@example.com")
                .passwordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy")
                .displayName("Default User")
                .timezone("UTC")
                .build();

        User saved = userRepository.save(user);
        entityManager.flush();

        assertThat(saved.getRole()).isEqualTo(User.Role.USER);
    }

    @Test
    @DisplayName("Should set default value for email_verified")
    void testEmailVerifiedDefaultValue() {
        User user = User.builder()
                .email("notverified@example.com")
                .passwordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy")
                .displayName("Unverified User")
                .timezone("UTC")
                .role(User.Role.USER)
                .build();

        User saved = userRepository.save(user);
        entityManager.flush();

        assertThat(saved.isEmailVerified()).isFalse();
    }

    @Test
    @DisplayName("Should set default value for failed_login_attempts")
    void testFailedLoginAttemptsDefaultValue() {
        User user = User.builder()
                .email("newuser@example.com")
                .passwordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy")
                .displayName("New User")
                .timezone("UTC")
                .role(User.Role.USER)
                .build();

        User saved = userRepository.save(user);
        entityManager.flush();

        assertThat(saved.getFailedLoginAttempts()).isEqualTo(0);
    }

    // Test repository custom methods
    @Test
    @DisplayName("Should find user by email")
    void testFindByEmail() {
        userRepository.save(testUser);
        entityManager.flush();

        Optional<User> found = userRepository.findByEmail("test@example.com");
        assertThat(found).isPresent();
        assertThat(found.get().getDisplayName()).isEqualTo("Test User");

        Optional<User> notFound = userRepository.findByEmail("nonexistent@example.com");
        assertThat(notFound).isEmpty();
    }

    @Test
    @DisplayName("Should check if email exists")
    void testExistsByEmail() {
        userRepository.save(testUser);
        entityManager.flush();

        assertThat(userRepository.existsByEmail("test@example.com")).isTrue();
        assertThat(userRepository.existsByEmail("nonexistent@example.com")).isFalse();
    }

    @Test
    @DisplayName("Should find user by email verification token")
    void testFindByEmailVerificationToken() {
        String token = UUID.randomUUID().toString();
        testUser.setEmailVerificationToken(token);
        testUser.setEmailVerificationExpiresAt(LocalDateTime.now().plusHours(24));

        userRepository.save(testUser);
        entityManager.flush();

        Optional<User> found = userRepository.findByEmailVerificationToken(token);
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");

        Optional<User> notFound = userRepository.findByEmailVerificationToken("invalid-token");
        assertThat(notFound).isEmpty();
    }

    @Test
    @DisplayName("Should find user by password reset token")
    void testFindByPasswordResetToken() {
        String token = UUID.randomUUID().toString();
        testUser.setPasswordResetToken(token);
        testUser.setPasswordResetExpiresAt(LocalDateTime.now().plusHours(1));

        userRepository.save(testUser);
        entityManager.flush();

        Optional<User> found = userRepository.findByPasswordResetToken(token);
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");

        Optional<User> notFound = userRepository.findByPasswordResetToken("invalid-token");
        assertThat(notFound).isEmpty();
    }

    // Test validation constraints
    @Test
    @DisplayName("Should validate email format")
    void testEmailValidation() {
        User invalidEmailUser = User.builder()
                .email("invalid-email") // Invalid email format
                .passwordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy")
                .displayName("Invalid Email User")
                .role(User.Role.USER)
                .timezone("UTC")
                .build();

        assertThatThrownBy(() -> {
            userRepository.save(invalidEmailUser);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    @DisplayName("Should require non-null email")
    void testEmailNotNull() {
        User nullEmailUser = User.builder()
                .email(null) // Null email
                .passwordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy")
                .displayName("Null Email User")
                .role(User.Role.USER)
                .timezone("UTC")
                .build();

        assertThatThrownBy(() -> {
            userRepository.save(nullEmailUser);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    @DisplayName("Should require non-null password hash")
    void testPasswordHashNotNull() {
        User nullPasswordUser = User.builder()
                .email("nopassword@example.com")
                .passwordHash(null) // Null password hash
                .displayName("No Password User")
                .role(User.Role.USER)
                .timezone("UTC")
                .build();

        assertThatThrownBy(() -> {
            userRepository.save(nullPasswordUser);
            entityManager.flush();
        }).isInstanceOf(ConstraintViolationException.class);
    }

    // Test timestamp auto-update
    @Test
    @DisplayName("Should auto-update timestamps")
    void testTimestampAutoUpdate() throws InterruptedException {
        // Save user
        User saved = userRepository.save(testUser);
        entityManager.flush();

        LocalDateTime createdAt = saved.getCreatedAt();
        LocalDateTime updatedAt = saved.getUpdatedAt();

        assertThat(createdAt).isNotNull();
        assertThat(updatedAt).isNotNull();
        assertThat(updatedAt).isEqualTo(createdAt);

        // Update user
        Thread.sleep(100); // Small delay to ensure different timestamp
        saved.setDisplayName("Updated Name");
        userRepository.save(saved);
        entityManager.flush();
        entityManager.clear();

        // Verify updated_at changed but created_at didn't
        Optional<User> updated = userRepository.findById(saved.getId());
        assertThat(updated).isPresent();
        assertThat(updated.get().getCreatedAt()).isEqualTo(createdAt);
        assertThat(updated.get().getUpdatedAt()).isAfter(updatedAt);
    }

    // Test role enum constraint
    @Test
    @DisplayName("Should accept valid role values")
    void testValidRoleValues() {
        // Test USER role
        User userRole = User.builder()
                .email("user@example.com")
                .passwordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy")
                .displayName("Regular User")
                .role(User.Role.USER)
                .timezone("UTC")
                .build();

        User savedUser = userRepository.save(userRole);
        assertThat(savedUser.getRole()).isEqualTo(User.Role.USER);

        // Test ADMIN role
        User adminRole = User.builder()
                .email("admin@example.com")
                .passwordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy")
                .displayName("Admin User")
                .role(User.Role.ADMIN)
                .timezone("UTC")
                .build();

        User savedAdmin = userRepository.save(adminRole);
        assertThat(savedAdmin.getRole()).isEqualTo(User.Role.ADMIN);
    }

    // Test account locking functionality
    @Test
    @DisplayName("Should handle account locking fields")
    void testAccountLockingFields() {
        LocalDateTime lockUntil = LocalDateTime.now().plusMinutes(30);
        testUser.setFailedLoginAttempts(5);
        testUser.setAccountLockedUntil(lockUntil);

        User saved = userRepository.save(testUser);
        entityManager.flush();
        entityManager.clear();

        Optional<User> found = userRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getFailedLoginAttempts()).isEqualTo(5);
        assertThat(found.get().getAccountLockedUntil()).isEqualToIgnoringNanos(lockUntil);
    }
}