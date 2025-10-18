package com.growmanager.exception;

/**
 * Exception thrown when a user attempts to perform an action that requires email verification.
 * Results in HTTP 403 Forbidden response.
 */
public class EmailNotVerifiedException extends RuntimeException {

    public EmailNotVerifiedException(String message) {
        super(message);
    }

    public EmailNotVerifiedException() {
        super("Email address is not verified. Please check your email for the verification link.");
    }
}