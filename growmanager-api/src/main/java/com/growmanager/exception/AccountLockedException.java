package com.growmanager.exception;

/**
 * Exception thrown when attempting to access a locked account.
 * Results in HTTP 423 Locked response.
 */
public class AccountLockedException extends RuntimeException {

    private final long remainingLockTimeSeconds;

    public AccountLockedException(String message, long remainingLockTimeSeconds) {
        super(message);
        this.remainingLockTimeSeconds = remainingLockTimeSeconds;
    }

    public long getRemainingLockTimeSeconds() {
        return remainingLockTimeSeconds;
    }
}