package com.growmanager.security;

import com.growmanager.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * JWT Token Provider utility for generating and validating JWT tokens.
 * Handles both access tokens (15 min expiry) and refresh tokens (7-30 days expiry).
 */
@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${spring.security.jwt.secret}")
    private String jwtSecret;

    @Value("${spring.security.jwt.access-token-expiration:900000}") // Default 15 minutes
    private long accessTokenExpiration;

    @Value("${spring.security.jwt.refresh-token-expiration:604800000}") // Default 7 days
    private long refreshTokenExpiration;

    @Value("${spring.security.jwt.refresh-token-expiration-remember-me:2592000000}") // Default 30 days
    private long refreshTokenExpirationRememberMe;

    private SecretKey key;

    /**
     * Initialize the signing key after properties are injected.
     */
    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        logger.info("JWT Token Provider initialized with access token expiration: {} ms", accessTokenExpiration);
    }

    /**
     * Generates a JWT access token for the given user.
     * Access tokens expire in 15 minutes.
     *
     * @param user the user to generate token for
     * @return the generated JWT access token
     */
    public String generateAccessToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpiration);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId().toString());
        claims.put("email", user.getEmail());
        claims.put("role", user.getRole().toString());
        claims.put("emailVerified", user.isEmailVerified());
        claims.put("type", "access");

        return Jwts.builder()
                .subject(user.getId().toString())
                .claims(claims)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Generates a JWT refresh token for the given user.
     * Refresh tokens expire in 7 days by default, or 30 days with "remember me".
     *
     * @param user the user to generate token for
     * @param rememberMe whether to extend token expiration to 30 days
     * @return the generated JWT refresh token
     */
    public String generateRefreshToken(User user, boolean rememberMe) {
        Date now = new Date();
        long expiration = rememberMe ? refreshTokenExpirationRememberMe : refreshTokenExpiration;
        Date expiryDate = new Date(now.getTime() + expiration);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId().toString());
        claims.put("email", user.getEmail());
        claims.put("type", "refresh");

        return Jwts.builder()
                .subject(user.getId().toString())
                .claims(claims)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Validates a JWT token.
     * Checks signature, expiration, and format.
     *
     * @param token the JWT token to validate
     * @return true if token is valid, false otherwise
     */
    public boolean validateToken(String token) {
        if (token == null || token.isEmpty()) {
            logger.debug("Token validation failed: token is null or empty");
            return false;
        }

        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SignatureException ex) {
            logger.error("Invalid JWT signature: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            logger.error("Invalid JWT token: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            logger.debug("Expired JWT token: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            logger.error("Unsupported JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            logger.error("JWT claims string is empty: {}", ex.getMessage());
        } catch (Exception ex) {
            logger.error("JWT token validation error: {}", ex.getMessage());
        }

        return false;
    }

    /**
     * Extracts the user ID from a JWT token.
     *
     * @param token the JWT token
     * @return the user ID
     * @throws JwtException if token is invalid or expired
     */
    public UUID getUserIdFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        String userIdString = claims.get("userId", String.class);
        return UUID.fromString(userIdString);
    }

    /**
     * Extracts the email from a JWT token.
     *
     * @param token the JWT token
     * @return the email address
     * @throws JwtException if token is invalid or expired
     */
    public String getEmailFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        return claims.get("email", String.class);
    }

    /**
     * Extracts the role from a JWT token.
     *
     * @param token the JWT token
     * @return the user role
     * @throws JwtException if token is invalid or expired
     */
    public String getRoleFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        return claims.get("role", String.class);
    }

    /**
     * Extracts the email verified status from a JWT token.
     *
     * @param token the JWT token
     * @return true if email is verified, false otherwise
     * @throws JwtException if token is invalid or expired
     */
    public boolean getEmailVerifiedFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        return claims.get("emailVerified", Boolean.class);
    }

    /**
     * Extracts the token type from a JWT token.
     *
     * @param token the JWT token
     * @return the token type ("access" or "refresh")
     * @throws JwtException if token is invalid or expired
     */
    public String getTokenTypeFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        return claims.get("type", String.class);
    }

    /**
     * Extracts all claims from a JWT token.
     *
     * @param token the JWT token
     * @return the claims
     * @throws JwtException if token is invalid or expired
     */
    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Checks if a token is expired.
     *
     * @param token the JWT token
     * @return true if token is expired, false otherwise
     */
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = getAllClaimsFromToken(token);
            return claims.getExpiration().before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        } catch (Exception e) {
            logger.error("Error checking token expiration: {}", e.getMessage());
            return true;
        }
    }

    /**
     * Gets the expiration date from a token.
     *
     * @param token the JWT token
     * @return the expiration date
     * @throws JwtException if token is invalid or expired
     */
    public Date getExpirationDateFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        return claims.getExpiration();
    }
}