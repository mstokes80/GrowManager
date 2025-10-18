package com.growmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for image upload response.
 * Contains URLs for both full-size and thumbnail images.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageUploadResponse {

    /**
     * URL of the full-size image (max 2048x2048px, 85% quality).
     */
    private String fullSizeUrl;

    /**
     * URL of the thumbnail image (400x400px, cropped center, 80% quality).
     */
    private String thumbnailUrl;
}