package com.growmanager.exception;

/**
 * Exception thrown when a user attempts to access a resource they don't own.
 * Results in HTTP 403 Forbidden response.
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}