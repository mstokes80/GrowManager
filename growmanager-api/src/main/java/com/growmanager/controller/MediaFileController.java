package com.growmanager.controller;

import com.growmanager.dto.ImageUploadResponse;
import com.growmanager.service.ImageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for media file operations.
 * Handles image uploads, processing, and deletion.
 */
@RestController
@RequestMapping("/api/media")
@Tag(name = "Media", description = "Media file management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class MediaFileController {

    private static final Logger logger = LoggerFactory.getLogger(MediaFileController.class);

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/heic"
    );

    private final ImageService imageService;

    public MediaFileController(ImageService imageService) {
        this.imageService = imageService;
    }

    /**
     * Upload an image file.
     * Generates both full-size (max 2048x2048px, 85% quality) and thumbnail
     * (400x400px cropped center, 80% quality) versions.
     *
     * @param file the image file to upload
     * @param entityType the type of entity (e.g., "observation", "activity")
     * @param entityId the ID of the entity
     * @return URLs for full-size and thumbnail images
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Upload image",
            description = "Upload an image file. Generates full-size and thumbnail versions. "
                    + "Max file size: 10MB. Supported formats: JPEG, PNG, HEIC."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Image uploaded successfully",
                    content = @Content(schema = @Schema(implementation = ImageUploadResponse.class))
            ),
            @ApiResponse(responseCode = "400", description = "Invalid file type or size"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "500", description = "Image processing failed")
    })
    public ResponseEntity<ImageUploadResponse> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("entityType") String entityType,
            @RequestParam("entityId") UUID entityId) {

        // Validate file
        validateFile(file);

        logger.info("Upload request for {} with ID: {}, file: {}, size: {} bytes",
                entityType, entityId, file.getOriginalFilename(), file.getSize());

        try {
            String[] urls = imageService.uploadImage(file, entityType, entityId);

            ImageUploadResponse response = ImageUploadResponse.builder()
                    .fullSizeUrl(urls[0])
                    .thumbnailUrl(urls[1])
                    .build();

            logger.info("Image uploaded successfully for {} {}", entityType, entityId);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            logger.error("Failed to upload image for {} {}: {}", entityType, entityId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete an image by its URL.
     *
     * @param url the S3 URL of the image to delete
     * @return 204 NO CONTENT status
     */
    @DeleteMapping
    @Operation(
            summary = "Delete image",
            description = "Delete an image from S3 by its URL"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Image deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing token"),
            @ApiResponse(responseCode = "400", description = "Invalid URL")
    })
    public ResponseEntity<Void> deleteImage(@RequestParam("url") String url) {
        logger.info("Delete image request for URL: {}", url);

        if (url == null || url.trim().isEmpty()) {
            logger.warn("Delete request with empty URL");
            return ResponseEntity.badRequest().build();
        }

        imageService.deleteImage(url);

        logger.info("Image deleted successfully: {}", url);
        return ResponseEntity.noContent().build();
    }

    /**
     * Validates the uploaded file for type and size.
     *
     * @param file the file to validate
     * @throws IllegalArgumentException if validation fails
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            logger.warn("Empty or null file provided");
            throw new IllegalArgumentException("File is required");
        }

        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            logger.warn("File size {} exceeds limit {}", file.getSize(), MAX_FILE_SIZE);
            throw new IllegalArgumentException(
                    String.format("File size exceeds maximum allowed size of %d MB",
                            MAX_FILE_SIZE / (1024 * 1024))
            );
        }

        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            logger.warn("Invalid content type: {}", contentType);
            throw new IllegalArgumentException(
                    "Invalid file type. Allowed types: JPEG, PNG, HEIC"
            );
        }

        logger.debug("File validation passed for: {}", file.getOriginalFilename());
    }
}