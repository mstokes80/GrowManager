package com.growmanager.exception;

/**
 * Exception thrown when a token (verification or reset) is invalid or expired.
 * Results in HTTP 400 Bad Request response.
 */
public class InvalidTokenException extends RuntimeException {

    public InvalidTokenException(String message) {
        super(message);
    }

    public InvalidTokenException(String message, Throwable cause) {
        super(message, cause);
    }
}