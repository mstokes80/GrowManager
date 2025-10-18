package com.growmanager.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Email Verification Filter.
 * Ensures that users with unverified emails cannot access protected endpoints.
 * Runs after JwtAuthenticationFilter.
 */
@Component
public class EmailVerificationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(EmailVerificationFilter.class);

    private static final String[] WHITELISTED_PATHS = {
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/verify-email",
            "/api/auth/resend-verification",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/refresh-token",
            "/api/auth/logout",
            "/swagger-ui",
            "/v3/api-docs",
            "/actuator"
    };

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String requestPath = request.getRequestURI();
        String method = request.getMethod();

        // Allow OPTIONS requests for CORS
        if ("OPTIONS".equalsIgnoreCase(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Allow whitelisted paths
        if (isWhitelistedPath(requestPath)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Check authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated() &&
                authentication.getPrincipal() instanceof UserPrincipal) {

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            // Check if email is verified
            if (!userPrincipal.isEmailVerified()) {
                logger.warn("Access denied for unverified user: {}", userPrincipal.getEmail());
                sendUnverifiedEmailError(response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Checks if the request path is whitelisted (doesn't require email verification).
     *
     * @param path the request path
     * @return true if path is whitelisted, false otherwise
     */
    private boolean isWhitelistedPath(String path) {
        for (String whitelistedPath : WHITELISTED_PATHS) {
            if (path.startsWith(whitelistedPath)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Sends a 403 Forbidden response for unverified email.
     *
     * @param response the HTTP response
     * @throws IOException if writing response fails
     */
    private void sendUnverifiedEmailError(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "Email not verified");
        errorResponse.put("message", "Please verify your email address before accessing this resource. Check your inbox for the verification link.");
        errorResponse.put("status", HttpStatus.FORBIDDEN.value());
        errorResponse.put("timestamp", System.currentTimeMillis());

        ObjectMapper objectMapper = new ObjectMapper();
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }
}