package com.growmanager.repository;

import com.growmanager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for User entity.
 * Provides database access methods for user management and authentication.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Finds a user by their email address.
     * Email is unique, so this will return at most one user.
     *
     * @param email the email address to search for
     * @return an Optional containing the user if found, empty otherwise
     */
    Optional<User> findByEmail(String email);

    /**
     * Finds a user by their email verification token.
     * Used during email verification process.
     *
     * @param emailVerificationToken the verification token to search for
     * @return an Optional containing the user if found, empty otherwise
     */
    Optional<User> findByEmailVerificationToken(String emailVerificationToken);

    /**
     * Finds a user by their password reset token.
     * Used during password reset process.
     *
     * @param passwordResetToken the reset token to search for
     * @return an Optional containing the user if found, empty otherwise
     */
    Optional<User> findByPasswordResetToken(String passwordResetToken);

    /**
     * Checks if a user with the given email address exists.
     * More efficient than findByEmail when you only need to check existence.
     *
     * @param email the email address to check
     * @return true if a user with this email exists, false otherwise
     */
    boolean existsByEmail(String email);

    /**
     * Finds all users with unverified email addresses.
     * Can be used for administrative purposes or reminder emails.
     *
     * @return a list of users with unverified emails
     */
    @Query("SELECT u FROM User u WHERE u.emailVerified = false")
    java.util.List<User> findAllUnverifiedUsers();

    /**
     * Finds all users whose accounts are currently locked.
     * Can be used for administrative monitoring.
     *
     * @return a list of users with locked accounts
     */
    @Query("SELECT u FROM User u WHERE u.accountLockedUntil IS NOT NULL AND u.accountLockedUntil > CURRENT_TIMESTAMP")
    java.util.List<User> findAllLockedUsers();

    /**
     * Finds all users with a specific role.
     * Useful for finding all admins or filtering by user type.
     *
     * @param role the role to filter by
     * @return a list of users with the specified role
     */
    java.util.List<User> findByRole(User.Role role);

    /**
     * Counts the number of users with a specific role.
     * Useful for statistics and monitoring.
     *
     * @param role the role to count
     * @return the number of users with the specified role
     */
    long countByRole(User.Role role);

    /**
     * Deletes all users with unverified emails older than the specified date.
     * Can be used for cleanup of abandoned registrations.
     *
     * @param cutoffDate the cutoff date (accounts created before this will be deleted)
     * @return the number of users deleted
     */
    @Query("DELETE FROM User u WHERE u.emailVerified = false AND u.createdAt < :cutoffDate")
    int deleteUnverifiedUsersOlderThan(@Param("cutoffDate") java.time.LocalDateTime cutoffDate);

    /**
     * Updates the failed login attempts for a user.
     * Used for account security monitoring.
     *
     * @param userId the ID of the user
     * @param attempts the new number of failed attempts
     */
    @Query("UPDATE User u SET u.failedLoginAttempts = :attempts, u.updatedAt = CURRENT_TIMESTAMP WHERE u.id = :userId")
    void updateFailedLoginAttempts(@Param("userId") UUID userId, @Param("attempts") int attempts);

    /**
     * Finds users whose password reset tokens are about to expire.
     * Can be used for sending reminder emails.
     *
     * @param startTime the start of the time window
     * @param endTime the end of the time window
     * @return a list of users with expiring reset tokens
     */
    @Query("SELECT u FROM User u WHERE u.passwordResetToken IS NOT NULL AND u.passwordResetExpiresAt BETWEEN :startTime AND :endTime")
    java.util.List<User> findUsersWithExpiringPasswordResetTokens(
            @Param("startTime") java.time.LocalDateTime startTime,
            @Param("endTime") java.time.LocalDateTime endTime);

    /**
     * Finds users whose email verification tokens are about to expire.
     * Can be used for sending reminder emails.
     *
     * @param startTime the start of the time window
     * @param endTime the end of the time window
     * @return a list of users with expiring verification tokens
     */
    @Query("SELECT u FROM User u WHERE u.emailVerificationToken IS NOT NULL AND u.emailVerificationExpiresAt BETWEEN :startTime AND :endTime")
    java.util.List<User> findUsersWithExpiringEmailVerificationTokens(
            @Param("startTime") java.time.LocalDateTime startTime,
            @Param("endTime") java.time.LocalDateTime endTime);
}