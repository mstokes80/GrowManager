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
     * MinIO/S3 endpoint URL (e.g., http://localhost:9000).
     */
    private String endpoint;

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