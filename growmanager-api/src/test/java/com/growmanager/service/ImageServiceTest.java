package com.growmanager.service;

import com.growmanager.config.S3Properties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Test suite for ImageService.
 * Tests image upload, processing, and S3 operations.
 */
@ExtendWith(MockitoExtension.class)
class ImageServiceTest {

    @Mock
    private S3Client s3Client;

    @Mock
    private S3Properties s3Properties;

    @Mock
    private S3Properties.Bucket bucket;

    @InjectMocks
    private ImageService imageService;

    private static final String TEST_BUCKET = "test-photos";
    private static final String TEST_ENDPOINT = "http://localhost:9000";
    private UUID entityId;

    @BeforeEach
    void setUp() {
        entityId = UUID.randomUUID();
        lenient().when(s3Properties.getBucket()).thenReturn(bucket);
        lenient().when(bucket.getPhotos()).thenReturn(TEST_BUCKET);
        lenient().when(s3Properties.getEndpoint()).thenReturn(TEST_ENDPOINT);
    }

    @Test
    @DisplayName("Should upload image and generate thumbnail successfully")
    void testUploadImage_Success() throws IOException {
        // Create a mock image file (1x1 PNG)
        byte[] imageBytes = createTestImage();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-image.jpg",
                "image/jpeg",
                imageBytes
        );

        String[] result = imageService.uploadImage(file, "observation", entityId);

        assertThat(result).hasSize(2);
        assertThat(result[0]).startsWith(TEST_ENDPOINT + "/" + TEST_BUCKET + "/observation/" + entityId);
        assertThat(result[0]).contains("-full.jpg");
        assertThat(result[1]).startsWith(TEST_ENDPOINT + "/" + TEST_BUCKET + "/observation/" + entityId);
        assertThat(result[1]).contains("-thumb.jpg");

        // Verify S3 upload was called twice (full-size and thumbnail)
        verify(s3Client, times(2)).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    @DisplayName("Should handle PNG files correctly")
    void testUploadImage_PngFile() throws IOException {
        byte[] imageBytes = createTestImage();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-image.png",
                "image/png",
                imageBytes
        );

        String[] result = imageService.uploadImage(file, "observation", entityId);

        assertThat(result[0]).endsWith("-full.png");
        assertThat(result[1]).endsWith("-thumb.png");
    }

    @Test
    @DisplayName("Should use default extension when filename has no extension")
    void testUploadImage_NoExtension() throws IOException {
        byte[] imageBytes = createTestImage();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-image",
                "image/jpeg",
                imageBytes
        );

        String[] result = imageService.uploadImage(file, "observation", entityId);

        assertThat(result[0]).endsWith("-full.jpg");
        assertThat(result[1]).endsWith("-thumb.jpg");
    }

    @Test
    @DisplayName("Should delete image successfully")
    void testDeleteImage_Success() {
        String imageUrl = TEST_ENDPOINT + "/" + TEST_BUCKET + "/observation/" + entityId + "/test-full.jpg";

        ArgumentCaptor<DeleteObjectRequest> captor = ArgumentCaptor.forClass(DeleteObjectRequest.class);

        imageService.deleteImage(imageUrl);

        verify(s3Client).deleteObject(captor.capture());
        DeleteObjectRequest request = captor.getValue();
        assertThat(request.bucket()).isEqualTo(TEST_BUCKET);
        assertThat(request.key()).isEqualTo("observation/" + entityId + "/test-full.jpg");
    }

    @Test
    @DisplayName("Should handle delete errors gracefully")
    void testDeleteImage_Error() {
        String imageUrl = TEST_ENDPOINT + "/" + TEST_BUCKET + "/observation/" + entityId + "/test-full.jpg";
        doThrow(new RuntimeException("S3 error")).when(s3Client).deleteObject(any(DeleteObjectRequest.class));

        // Should not throw exception
        assertThatCode(() -> imageService.deleteImage(imageUrl))
                .doesNotThrowAnyException();

        verify(s3Client).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    @DisplayName("Should create bucket if it doesn't exist")
    void testEnsureBucketExists_CreatesBucket() {
        when(s3Client.headBucket(any(HeadBucketRequest.class)))
                .thenThrow(NoSuchBucketException.builder().message("Bucket does not exist").build());

        imageService.ensureBucketExists();

        verify(s3Client).headBucket(any(HeadBucketRequest.class));
        verify(s3Client).createBucket(any(CreateBucketRequest.class));
    }

    @Test
    @DisplayName("Should not create bucket if it already exists")
    void testEnsureBucketExists_BucketExists() {
        when(s3Client.headBucket(any(HeadBucketRequest.class)))
                .thenReturn(HeadBucketResponse.builder().build());

        imageService.ensureBucketExists();

        verify(s3Client).headBucket(any(HeadBucketRequest.class));
        verify(s3Client, never()).createBucket(any(CreateBucketRequest.class));
    }

    @Test
    @DisplayName("Should set correct content type when uploading")
    void testUploadImage_CorrectContentType() throws IOException {
        byte[] imageBytes = createTestImage();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.jpg",
                "image/jpeg",
                imageBytes
        );

        ArgumentCaptor<PutObjectRequest> captor = ArgumentCaptor.forClass(PutObjectRequest.class);

        imageService.uploadImage(file, "observation", entityId);

        verify(s3Client, times(2)).putObject(captor.capture(), any(RequestBody.class));

        for (PutObjectRequest request : captor.getAllValues()) {
            assertThat(request.contentType()).isEqualTo("image/jpeg");
        }
    }

    /**
     * Creates a minimal 1x1 PNG image for testing.
     */
    private byte[] createTestImage() {
        // Minimal 1x1 PNG image
        return new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, (byte) 0xC4,
                (byte) 0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54,
                0x78, (byte) 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05,
                0x00, 0x01, 0x0D, 0x0A, 0x2D, (byte) 0xB4, 0x00, 0x00,
                0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, (byte) 0xAE,
                0x42, 0x60, (byte) 0x82
        };
    }
}