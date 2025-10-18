package com.growmanager.service;

import com.growmanager.config.S3Properties;
import jakarta.annotation.PostConstruct;
import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.geometry.Positions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

/**
 * Service for handling image upload, processing, and storage to S3/MinIO.
 * Generates thumbnails and compresses images before storage.
 */
@Service
public class ImageService {

    private static final Logger logger = LoggerFactory.getLogger(ImageService.class);

    private static final int THUMBNAIL_SIZE = 400;
    private static final int MAX_FULL_SIZE = 2048;
    private static final float THUMBNAIL_QUALITY = 0.80f;
    private static final float FULL_SIZE_QUALITY = 0.85f;

    private final S3Client s3Client;
    private final S3Properties s3Properties;

    public ImageService(S3Client s3Client, S3Properties s3Properties) {
        this.s3Client = s3Client;
        this.s3Properties = s3Properties;
    }

    /**
     * Initialize S3 bucket on application startup.
     * Gracefully handles failures to prevent application startup issues.
     */
    @PostConstruct
    public void init() {
        try {
            ensureBucketExists();
        } catch (Exception e) {
            logger.error("Failed to initialize S3 bucket. Image uploads may fail until bucket is created manually: {}",
                    e.getMessage());
            logger.debug("S3 bucket initialization error details", e);
        }
    }

    /**
     * Upload an image and generate thumbnail.
     * Returns an array with [fullSizeUrl, thumbnailUrl].
     *
     * @param file the image file to upload
     * @param entityType the type of entity (e.g., "observation")
     * @param entityId the ID of the entity
     * @return array of URLs [fullSizeUrl, thumbnailUrl]
     * @throws IOException if image processing fails
     */
    public String[] uploadImage(MultipartFile file, String entityType, UUID entityId)
            throws IOException {
        logger.info("Uploading image for {} with ID: {}", entityType, entityId);

        // Generate unique filenames
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String baseKey = String.format("%s/%s/%s", entityType, entityId, UUID.randomUUID());

        String fullSizeKey = baseKey + "-full" + extension;
        String thumbnailKey = baseKey + "-thumb" + extension;

        // Process and upload full-size image (compressed)
        byte[] compressedImage = compressFullSize(file.getInputStream());
        uploadToS3(fullSizeKey, compressedImage, file.getContentType());
        String fullSizeUrl = getPublicUrl(fullSizeKey);

        // Generate and upload thumbnail
        byte[] thumbnail = generateThumbnail(file.getInputStream());
        uploadToS3(thumbnailKey, thumbnail, file.getContentType());
        String thumbnailUrl = getPublicUrl(thumbnailKey);

        logger.info("Image uploaded successfully. Full: {}, Thumbnail: {}",
                fullSizeKey, thumbnailKey);

        return new String[]{fullSizeUrl, thumbnailUrl};
    }

    /**
     * Delete an image from S3 by its URL.
     *
     * @param url the S3 URL of the image
     */
    public void deleteImage(String url) {
        try {
            String key = extractKeyFromUrl(url);
            logger.info("Deleting image with key: {}", key);

            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(s3Properties.getBucket().getPhotos())
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteRequest);
            logger.info("Image deleted successfully: {}", key);
        } catch (Exception e) {
            logger.error("Failed to delete image: {}", url, e);
        }
    }

    /**
     * Compress full-size image to max 2048x2048px, quality 85%.
     *
     * @param inputStream the input image stream
     * @return compressed image bytes
     * @throws IOException if compression fails
     */
    private byte[] compressFullSize(InputStream inputStream) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        Thumbnails.of(inputStream)
                .size(MAX_FULL_SIZE, MAX_FULL_SIZE)
                .outputQuality(FULL_SIZE_QUALITY)
                .toOutputStream(outputStream);

        return outputStream.toByteArray();
    }

    /**
     * Generate thumbnail: 400x400px, cropped center, quality 80%.
     *
     * @param inputStream the input image stream
     * @return thumbnail image bytes
     * @throws IOException if thumbnail generation fails
     */
    private byte[] generateThumbnail(InputStream inputStream) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        Thumbnails.of(inputStream)
                .size(THUMBNAIL_SIZE, THUMBNAIL_SIZE)
                .crop(Positions.CENTER)
                .outputQuality(THUMBNAIL_QUALITY)
                .toOutputStream(outputStream);

        return outputStream.toByteArray();
    }

    /**
     * Upload bytes to S3.
     *
     * @param key the S3 object key
     * @param data the image bytes
     * @param contentType the content type
     */
    private void uploadToS3(String key, byte[] data, String contentType) {
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(s3Properties.getBucket().getPhotos())
                .key(key)
                .contentType(contentType)
                .build();

        s3Client.putObject(putRequest, RequestBody.fromInputStream(
                new ByteArrayInputStream(data), data.length));
    }

    /**
     * Get public URL for an S3 object.
     * Uses publicEndpoint if configured, otherwise falls back to endpoint.
     *
     * @param key the S3 object key
     * @return the public URL
     */
    private String getPublicUrl(String key) {
        String baseUrl = s3Properties.getPublicEndpoint() != null
                ? s3Properties.getPublicEndpoint()
                : s3Properties.getEndpoint();

        return String.format("%s/%s/%s",
                baseUrl,
                s3Properties.getBucket().getPhotos(),
                key);
    }

    /**
     * Extract S3 key from public URL.
     * Handles URLs with either endpoint or publicEndpoint.
     *
     * @param url the public URL
     * @return the S3 object key
     */
    private String extractKeyFromUrl(String url) {
        String bucketName = s3Properties.getBucket().getPhotos();

        // Try public endpoint first if configured
        if (s3Properties.getPublicEndpoint() != null) {
            String publicPrefix = String.format("%s/%s/", s3Properties.getPublicEndpoint(), bucketName);
            if (url.startsWith(publicPrefix)) {
                return url.replace(publicPrefix, "");
            }
        }

        // Fall back to internal endpoint
        String internalPrefix = String.format("%s/%s/", s3Properties.getEndpoint(), bucketName);
        return url.replace(internalPrefix, "");
    }

    /**
     * Get file extension from filename.
     *
     * @param filename the filename
     * @return the extension (e.g., ".jpg")
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg"; // Default extension
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    /**
     * Initialize S3 bucket if it doesn't exist.
     * Attempts to create the bucket if it's not found or if there's an error checking for it.
     */
    public void ensureBucketExists() {
        String bucketName = s3Properties.getBucket().getPhotos();
        logger.info("Checking if S3 bucket exists: {}", bucketName);

        try {
            HeadBucketRequest headBucketRequest = HeadBucketRequest.builder()
                    .bucket(bucketName)
                    .build();
            s3Client.headBucket(headBucketRequest);
            logger.info("S3 bucket exists and is accessible: {}", bucketName);
        } catch (NoSuchBucketException e) {
            // Bucket doesn't exist, try to create it
            createBucket(bucketName);
        } catch (S3Exception e) {
            // Other S3 error (400, 403, etc.) - might be permissions or invalid bucket name
            // Try to create bucket anyway in case it just doesn't exist
            logger.warn("Error checking bucket existence (status {}): {}. Attempting to create bucket.",
                    e.statusCode(), e.getMessage());
            try {
                createBucket(bucketName);
            } catch (Exception createException) {
                logger.error("Failed to create bucket after check failed: {}", createException.getMessage());
                throw createException;
            }
        }
    }

    /**
     * Create S3 bucket.
     *
     * @param bucketName the name of the bucket to create
     */
    private void createBucket(String bucketName) {
        logger.info("Creating S3 bucket: {}", bucketName);
        try {
            CreateBucketRequest createBucketRequest = CreateBucketRequest.builder()
                    .bucket(bucketName)
                    .build();
            s3Client.createBucket(createBucketRequest);
            logger.info("S3 bucket created successfully: {}", bucketName);
        } catch (S3Exception e) {
            if (e.statusCode() == 409) {
                // Bucket already exists (race condition or ownership by another account)
                logger.info("Bucket already exists (409 conflict): {}", bucketName);
            } else {
                logger.error("Failed to create bucket '{}': {} (status {})",
                        bucketName, e.getMessage(), e.statusCode());
                throw e;
            }
        }
    }
}