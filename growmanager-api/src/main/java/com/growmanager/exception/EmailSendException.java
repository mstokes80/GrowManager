package com.growmanager.exception;

/**
 * Exception thrown when email sending fails.
 * Results in HTTP 500 Internal Server Error response.
 */
public class EmailSendException extends RuntimeException {

    public EmailSendException(String message) {
        super(message);
    }

    public EmailSendException(String message, Throwable cause) {
        super(message, cause);
    }
}