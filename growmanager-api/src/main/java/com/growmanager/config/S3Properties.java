package com.growmanager.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for S3/MinIO storage.
 * Maps environment variables from application.properties to Java config.
 */
@Configuration
@ConfigurationProperties(prefix = "minio")
@Data
public class S3Properties {

    /**
     * MinIO/S3 endpoint URL for internal connections (e.g., http://minio:9000).
     * Used by S3Client for uploading/downloading files.
     */
    private String endpoint;

    /**
     * Public endpoint URL for generating accessible image URLs (e.g., http://localhost:9000).
     * Falls back to endpoint if not specified.
     */
    private String publicEndpoint;

    /**
     * Access key for authentication.
     */
    private String accessKey;

    /**
     * Secret key for authentication.
     */
    private String secretKey;

    /**
     * Nested bucket configuration.
     */
    private Bucket bucket = new Bucket();

    @Data
    public static class Bucket {
        /**
         * Bucket name for storing photos.
         */
        private String photos;
    }
}