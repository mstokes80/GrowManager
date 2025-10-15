package com.growmanager.controller;

import com.growmanager.dto.ImageUploadResponse;
import com.growmanager.service.ImageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Test suite for MediaFileController.
 * Tests file upload endpoints and validation.
 */
@ExtendWith(MockitoExtension.class)
class MediaFileControllerTest {

    @Mock
    private ImageService imageService;

    @InjectMocks
    private MediaFileController mediaFileController;

    private UUID entityId;
    private static final String ENTITY_TYPE = "observation";

    @BeforeEach
    void setUp() {
        entityId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Should upload image successfully")
    void testUploadImage_Success() throws IOException {
        byte[] content = new byte[]{1, 2, 3};
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.jpg",
                "image/jpeg",
                content
        );

        String[] urls = {
                "http://localhost:9000/photos/observation/123/test-full.jpg",
                "http://localhost:9000/photos/observation/123/test-thumb.jpg"
        };
        when(imageService.uploadImage(any(), eq(ENTITY_TYPE), eq(entityId))).thenReturn(urls);

        ResponseEntity<ImageUploadResponse> response = mediaFileController.uploadImage(
                file, ENTITY_TYPE, entityId
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getFullSizeUrl()).isEqualTo(urls[0]);
        assertThat(response.getBody().getThumbnailUrl()).isEqualTo(urls[1]);

        verify(imageService).uploadImage(file, ENTITY_TYPE, entityId);
    }

    @Test
    @DisplayName("Should reject empty file")
    void testUploadImage_EmptyFile() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.jpg",
                "image/jpeg",
                new byte[0]
        );

        assertThatThrownBy(() -> mediaFileController.uploadImage(file, ENTITY_TYPE, entityId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("File is required");

        verify(imageService, never()).uploadImage(any(), any(), any());
    }

    @Test
    @DisplayName("Should reject null file")
    void testUploadImage_NullFile() throws IOException {
        assertThatThrownBy(() -> mediaFileController.uploadImage(null, ENTITY_TYPE, entityId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("File is required");

        verify(imageService, never()).uploadImage(any(), any(), any());
    }

    @Test
    @DisplayName("Should reject file exceeding size limit")
    void testUploadImage_FileTooLarge() throws IOException {
        byte[] content = new byte[11 * 1024 * 1024]; // 11MB
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.jpg",
                "image/jpeg",
                content
        );

        assertThatThrownBy(() -> mediaFileController.uploadImage(file, ENTITY_TYPE, entityId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("File size exceeds maximum");

        verify(imageService, never()).uploadImage(any(), any(), any());
    }

    @Test
    @DisplayName("Should reject invalid content type")
    void testUploadImage_InvalidContentType() throws IOException {
        byte[] content = new byte[]{1, 2, 3};
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                content
        );

        assertThatThrownBy(() -> mediaFileController.uploadImage(file, ENTITY_TYPE, entityId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid file type");

        verify(imageService, never()).uploadImage(any(), any(), any());
    }

    @Test
    @DisplayName("Should accept JPEG files")
    void testUploadImage_JpegFile() throws IOException {
        byte[] content = new byte[]{1, 2, 3};
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.jpg",
                "image/jpeg",
                content
        );

        when(imageService.uploadImage(any(), any(), any())).thenReturn(new String[]{"url1", "url2"});

        ResponseEntity<ImageUploadResponse> response = mediaFileController.uploadImage(
                file, ENTITY_TYPE, entityId
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(imageService).uploadImage(file, ENTITY_TYPE, entityId);
    }

    @Test
    @DisplayName("Should accept PNG files")
    void testUploadImage_PngFile() throws IOException {
        byte[] content = new byte[]{1, 2, 3};
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.png",
                "image/png",
                content
        );

        when(imageService.uploadImage(any(), any(), any())).thenReturn(new String[]{"url1", "url2"});

        ResponseEntity<ImageUploadResponse> response = mediaFileController.uploadImage(
                file, ENTITY_TYPE, entityId
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(imageService).uploadImage(file, ENTITY_TYPE, entityId);
    }

    @Test
    @DisplayName("Should accept HEIC files")
    void testUploadImage_HeicFile() throws IOException {
        byte[] content = new byte[]{1, 2, 3};
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.heic",
                "image/heic",
                content
        );

        when(imageService.uploadImage(any(), any(), any())).thenReturn(new String[]{"url1", "url2"});

        ResponseEntity<ImageUploadResponse> response = mediaFileController.uploadImage(
                file, ENTITY_TYPE, entityId
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(imageService).uploadImage(file, ENTITY_TYPE, entityId);
    }

    @Test
    @DisplayName("Should return 500 when image processing fails")
    void testUploadImage_ProcessingFailure() throws IOException {
        byte[] content = new byte[]{1, 2, 3};
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.jpg",
                "image/jpeg",
                content
        );

        when(imageService.uploadImage(any(), any(), any())).thenThrow(new IOException("Processing failed"));

        ResponseEntity<ImageUploadResponse> response = mediaFileController.uploadImage(
                file, ENTITY_TYPE, entityId
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        verify(imageService).uploadImage(file, ENTITY_TYPE, entityId);
    }

    @Test
    @DisplayName("Should delete image successfully")
    void testDeleteImage_Success() {
        String imageUrl = "http://localhost:9000/photos/observation/123/test-full.jpg";

        ResponseEntity<Void> response = mediaFileController.deleteImage(imageUrl);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(imageService).deleteImage(imageUrl);
    }

    @Test
    @DisplayName("Should reject delete with empty URL")
    void testDeleteImage_EmptyUrl() {
        ResponseEntity<Void> response = mediaFileController.deleteImage("");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(imageService, never()).deleteImage(any());
    }

    @Test
    @DisplayName("Should reject delete with null URL")
    void testDeleteImage_NullUrl() {
        ResponseEntity<Void> response = mediaFileController.deleteImage(null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(imageService, never()).deleteImage(any());
    }
}