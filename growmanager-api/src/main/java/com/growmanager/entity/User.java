package com.growmanager.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * User entity representing the users table in the database.
 * Handles user authentication and profile information.
 */
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_email", columnList = "email"),
        @Index(name = "idx_users_email_verification_token", columnList = "email_verification_token"),
        @Index(name = "idx_users_password_reset_token", columnList = "password_reset_token")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"passwordHash"}) // Exclude sensitive data from toString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {

    private static final PasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @NotNull(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @NotNull(message = "Password is required")
    @Size(min = 60, max = 255, message = "Password hash must be between 60 and 255 characters")
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Size(max = 100, message = "Display name must not exceed 100 characters")
    @Column(name = "display_name", length = 100)
    private String displayName;

    @NotNull(message = "Role is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    @Builder.Default
    private Role role = Role.USER;

    @Size(max = 50, message = "Timezone must not exceed 50 characters")
    @Column(name = "timezone", length = 50)
    @Builder.Default
    private String timezone = "UTC";

    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    @Size(max = 255, message = "Email verification token must not exceed 255 characters")
    @Column(name = "email_verification_token", length = 255)
    private String emailVerificationToken;

    @Column(name = "email_verification_expires_at")
    private LocalDateTime emailVerificationExpiresAt;

    @Size(max = 255, message = "Password reset token must not exceed 255 characters")
    @Column(name = "password_reset_token", length = 255)
    private String passwordResetToken;

    @Column(name = "password_reset_expires_at")
    private LocalDateTime passwordResetExpiresAt;

    @Min(value = 0, message = "Failed login attempts cannot be negative")
    @Column(name = "failed_login_attempts", nullable = false)
    @Builder.Default
    private Integer failedLoginAttempts = 0;

    @Column(name = "account_locked_until")
    private LocalDateTime accountLockedUntil;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Enum representing user roles in the system.
     */
    public enum Role {
        USER("USER"),
        ADMIN("ADMIN");

        private final String value;

        Role(String value) {
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
     * Sets the password by hashing it with BCrypt.
     * Never stores plain text passwords.
     *
     * @param plainPassword the plain text password to hash and store
     */
    public void setPassword(String plainPassword) {
        if (plainPassword != null && !plainPassword.isEmpty()) {
            this.passwordHash = PASSWORD_ENCODER.encode(plainPassword);
        }
    }

    /**
     * Verifies a plain text password against the stored hash.
     *
     * @param plainPassword the plain text password to verify
     * @return true if the password matches, false otherwise
     */
    public boolean verifyPassword(String plainPassword) {
        if (plainPassword == null || passwordHash == null) {
            return false;
        }
        return PASSWORD_ENCODER.matches(plainPassword, passwordHash);
    }

    /**
     * Checks if the account is currently locked.
     *
     * @return true if the account is locked, false otherwise
     */
    public boolean isAccountLocked() {
        return accountLockedUntil != null && accountLockedUntil.isAfter(LocalDateTime.now());
    }

    /**
     * Increments the failed login attempts counter.
     * Typically called after a failed login attempt.
     */
    public void incrementFailedLoginAttempts() {
        if (failedLoginAttempts == null) {
            failedLoginAttempts = 0;
        }
        failedLoginAttempts++;
    }

    /**
     * Resets the failed login attempts counter.
     * Typically called after a successful login.
     */
    public void resetFailedLoginAttempts() {
        failedLoginAttempts = 0;
        accountLockedUntil = null;
    }

    /**
     * Locks the account until the specified time.
     *
     * @param until the timestamp until which the account should be locked
     */
    public void lockAccountUntil(LocalDateTime until) {
        accountLockedUntil = until;
    }

    /**
     * Generates and sets a new email verification token.
     *
     * @param expirationHours hours until the token expires
     * @return the generated token
     */
    public String generateEmailVerificationToken(int expirationHours) {
        emailVerificationToken = UUID.randomUUID().toString();
        emailVerificationExpiresAt = LocalDateTime.now().plusHours(expirationHours);
        return emailVerificationToken;
    }

    /**
     * Clears the email verification token after successful verification.
     */
    public void clearEmailVerificationToken() {
        emailVerificationToken = null;
        emailVerificationExpiresAt = null;
        emailVerified = true;
    }

    /**
     * Generates and sets a new password reset token.
     *
     * @param expirationHours hours until the token expires
     * @return the generated token
     */
    public String generatePasswordResetToken(int expirationHours) {
        passwordResetToken = UUID.randomUUID().toString();
        passwordResetExpiresAt = LocalDateTime.now().plusHours(expirationHours);
        return passwordResetToken;
    }

    /**
     * Clears the password reset token after successful reset.
     */
    public void clearPasswordResetToken() {
        passwordResetToken = null;
        passwordResetExpiresAt = null;
    }

    /**
     * Checks if the email verification token is valid and not expired.
     *
     * @param token the token to validate
     * @return true if valid, false otherwise
     */
    public boolean isEmailVerificationTokenValid(String token) {
        return token != null
                && token.equals(emailVerificationToken)
                && emailVerificationExpiresAt != null
                && emailVerificationExpiresAt.isAfter(LocalDateTime.now());
    }

    /**
     * Checks if the password reset token is valid and not expired.
     *
     * @param token the token to validate
     * @return true if valid, false otherwise
     */
    public boolean isPasswordResetTokenValid(String token) {
        return token != null
                && token.equals(passwordResetToken)
                && passwordResetExpiresAt != null
                && passwordResetExpiresAt.isAfter(LocalDateTime.now());
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
        if (role == null) {
            role = Role.USER;
        }
        if (timezone == null || timezone.isEmpty()) {
            timezone = "UTC";
        }
        if (failedLoginAttempts == null) {
            failedLoginAttempts = 0;
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