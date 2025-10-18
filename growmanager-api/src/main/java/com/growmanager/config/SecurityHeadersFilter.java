package com.growmanager.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Security Headers Filter.
 * Adds security headers to all HTTP responses for defense in depth.
 */
@Component
public class SecurityHeadersFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Prevent clickjacking attacks
        httpResponse.setHeader("X-Frame-Options", "DENY");

        // Prevent MIME-sniffing
        httpResponse.setHeader("X-Content-Type-Options", "nosniff");

        // Enable XSS protection in browsers
        httpResponse.setHeader("X-XSS-Protection", "1; mode=block");

        // Content Security Policy - strict policy for API
        httpResponse.setHeader("Content-Security-Policy",
            "default-src 'none'; frame-ancestors 'none'");

        // Referrer Policy - don't leak sensitive URLs
        httpResponse.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        // Permissions Policy (formerly Feature Policy) - disable unnecessary features
        httpResponse.setHeader("Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=()");

        // HSTS - Force HTTPS (only in production, handled by reverse proxy)
        // Commented out for local development - enable in production nginx/load balancer
        // httpResponse.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

        chain.doFilter(request, response);
    }
}