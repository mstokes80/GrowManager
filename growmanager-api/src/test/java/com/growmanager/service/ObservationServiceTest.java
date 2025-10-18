package com.growmanager.service;

import com.growmanager.dto.CreateObservationRequest;
import com.growmanager.dto.ObservationResponse;
import com.growmanager.dto.UpdateObservationRequest;
import com.growmanager.entity.Grow;
import com.growmanager.entity.Observation;
import com.growmanager.entity.Plant;
import com.growmanager.entity.User;
import com.growmanager.exception.ResourceNotFoundException;
import com.growmanager.exception.UnauthorizedException;
import com.growmanager.repository.ObservationRepository;
import com.growmanager.repository.PlantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Test suite for ObservationService.
 * Tests CRUD operations, photo handling, and ownership validation.
 */
@ExtendWith(MockitoExtension.class)
class ObservationServiceTest {

    @Mock
    private ObservationRepository observationRepository;

    @Mock
    private PlantRepository plantRepository;

    @Mock
    private ImageService imageService;

    @InjectMocks
    private ObservationService observationService;

    private User user;
    private User otherUser;
    private Grow grow;
    private Plant plant;
    private Observation observation;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .build();

        otherUser = User.builder()
                .id(UUID.randomUUID())
                .email("other@example.com")
                .build();

        grow = Grow.builder()
                .id(UUID.randomUUID())
                .name("Test Grow")
                .user(user)
                .build();

        plant = Plant.builder()
                .id(UUID.randomUUID())
                .tag("Test Plant")
                .grow(grow)
                .build();

        observation = Observation.builder()
                .id(UUID.randomUUID())
                .plant(plant)
                .user(user)
                .observationType(Observation.ObservationType.HEALTH_CHECK)
                .note("Test observation")
                .timestamp(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should create observation without photos")
    void testCreateObservation_WithoutPhotos() throws IOException {
        UUID plantId = plant.getId();
        CreateObservationRequest request = CreateObservationRequest.builder()
                .observationType(Observation.ObservationType.HEALTH_CHECK)
                .note("Test note")
                .build();

        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));
        when(observationRepository.save(any(Observation.class))).thenReturn(observation);

        ObservationResponse response = observationService.createObservation(
                plantId, request, null, user);

        assertThat(response).isNotNull();
        assertThat(response.getNote()).isEqualTo("Test observation");
        verify(imageService, never()).uploadImage(any(), any(), any());
        verify(observationRepository).save(any(Observation.class));
    }

    @Test
    @DisplayName("Should create observation with photos")
    void testCreateObservation_WithPhotos() throws IOException {
        UUID plantId = plant.getId();
        CreateObservationRequest request = CreateObservationRequest.builder()
                .observationType(Observation.ObservationType.PROGRESS)
                .note("Test with photos")
                .build();

        MockMultipartFile photo1 = new MockMultipartFile(
                "photo", "test1.jpg", "image/jpeg", new byte[]{1, 2, 3});
        MockMultipartFile photo2 = new MockMultipartFile(
                "photo", "test2.jpg", "image/jpeg", new byte[]{4, 5, 6});
        List<MultipartFile> photos = List.of(photo1, photo2);

        String[] urls1 = {"http://s3/full1.jpg", "http://s3/thumb1.jpg"};
        String[] urls2 = {"http://s3/full2.jpg", "http://s3/thumb2.jpg"};

        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));
        when(imageService.uploadImage(eq(photo1), eq("observation"), any(UUID.class)))
                .thenReturn(urls1);
        when(imageService.uploadImage(eq(photo2), eq("observation"), any(UUID.class)))
                .thenReturn(urls2);

        observation.setPhotos(new String[]{urls1[0], urls1[1], urls2[0], urls2[1]});
        when(observationRepository.save(any(Observation.class))).thenReturn(observation);

        ObservationResponse response = observationService.createObservation(
                plantId, request, photos, user);

        assertThat(response).isNotNull();
        assertThat(response.getPhotos()).hasSize(2);
        verify(imageService, times(2)).uploadImage(any(), eq("observation"), any(UUID.class));
    }

    @Test
    @DisplayName("Should reject creation with more than 10 photos")
    void testCreateObservation_TooManyPhotos() {
        UUID plantId = plant.getId();
        CreateObservationRequest request = CreateObservationRequest.builder()
                .observationType(Observation.ObservationType.HEALTH_CHECK)
                .build();

        List<MultipartFile> photos = new ArrayList<>();
        for (int i = 0; i < 11; i++) {
            photos.add(new MockMultipartFile("photo", "test.jpg", "image/jpeg", new byte[]{1}));
        }

        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));

        assertThatThrownBy(() -> observationService.createObservation(plantId, request, photos, user))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Maximum 10 photos allowed");

        verify(observationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should reject creation for non-existent plant")
    void testCreateObservation_PlantNotFound() {
        UUID plantId = UUID.randomUUID();
        CreateObservationRequest request = CreateObservationRequest.builder()
                .observationType(Observation.ObservationType.HEALTH_CHECK)
                .build();

        when(plantRepository.findById(plantId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> observationService.createObservation(plantId, request, null, user))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Plant not found");
    }

    @Test
    @DisplayName("Should reject creation for plant user doesn't own")
    void testCreateObservation_Unauthorized() {
        UUID plantId = plant.getId();
        CreateObservationRequest request = CreateObservationRequest.builder()
                .observationType(Observation.ObservationType.HEALTH_CHECK)
                .build();

        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));

        assertThatThrownBy(() -> observationService.createObservation(plantId, request, null, otherUser))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("don't have permission");
    }

    @Test
    @DisplayName("Should get observations by plant")
    void testGetObservationsByPlant() {
        UUID plantId = plant.getId();
        List<Observation> observations = List.of(observation);

        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));
        when(observationRepository.findByPlantIdOrderByTimestampDesc(plantId))
                .thenReturn(observations);

        List<ObservationResponse> result = observationService.getObservationsByPlant(plantId, user);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getNote()).isEqualTo("Test observation");
    }

    @Test
    @DisplayName("Should reject get observations for unauthorized user")
    void testGetObservationsByPlant_Unauthorized() {
        UUID plantId = plant.getId();

        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));

        assertThatThrownBy(() -> observationService.getObservationsByPlant(plantId, otherUser))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("Should get observation by ID")
    void testGetObservationById() {
        UUID observationId = observation.getId();

        when(observationRepository.findById(observationId)).thenReturn(Optional.of(observation));

        ObservationResponse result = observationService.getObservationById(observationId, user);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(observationId);
    }

    @Test
    @DisplayName("Should reject get observation by unauthorized user")
    void testGetObservationById_Unauthorized() {
        UUID observationId = observation.getId();

        when(observationRepository.findById(observationId)).thenReturn(Optional.of(observation));

        assertThatThrownBy(() -> observationService.getObservationById(observationId, otherUser))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("Should update observation note and type")
    void testUpdateObservation_BasicFields() throws IOException {
        UUID observationId = observation.getId();
        UpdateObservationRequest request = UpdateObservationRequest.builder()
                .note("Updated note")
                .observationType("pest")
                .build();

        when(observationRepository.findById(observationId)).thenReturn(Optional.of(observation));
        when(observationRepository.save(any(Observation.class))).thenReturn(observation);

        ObservationResponse result = observationService.updateObservation(
                observationId, request, null, user);

        assertThat(result).isNotNull();
        verify(observationRepository).save(any(Observation.class));
    }

    @Test
    @DisplayName("Should update observation and add photos")
    void testUpdateObservation_AddPhotos() throws IOException {
        UUID observationId = observation.getId();
        UpdateObservationRequest request = UpdateObservationRequest.builder().build();

        MockMultipartFile newPhoto = new MockMultipartFile(
                "photo", "new.jpg", "image/jpeg", new byte[]{7, 8, 9});
        String[] newUrls = {"http://s3/full3.jpg", "http://s3/thumb3.jpg"};

        observation.setPhotos(new String[]{"http://s3/full1.jpg", "http://s3/thumb1.jpg"});

        when(observationRepository.findById(observationId)).thenReturn(Optional.of(observation));
        when(imageService.uploadImage(eq(newPhoto), eq("observation"), any(UUID.class)))
                .thenReturn(newUrls);
        when(observationRepository.save(any(Observation.class))).thenReturn(observation);

        ObservationResponse result = observationService.updateObservation(
                observationId, request, List.of(newPhoto), user);

        assertThat(result).isNotNull();
        verify(imageService).uploadImage(any(), eq("observation"), any(UUID.class));
    }

    @Test
    @DisplayName("Should update observation and remove photos")
    void testUpdateObservation_RemovePhotos() throws IOException {
        UUID observationId = observation.getId();
        String photoToRemove = "http://s3/full1.jpg";

        UpdateObservationRequest request = UpdateObservationRequest.builder()
                .photosToRemove(List.of(photoToRemove))
                .build();

        observation.setPhotos(new String[]{photoToRemove, "http://s3/thumb1.jpg"});

        when(observationRepository.findById(observationId)).thenReturn(Optional.of(observation));
        when(observationRepository.save(any(Observation.class))).thenReturn(observation);

        ObservationResponse result = observationService.updateObservation(
                observationId, request, null, user);

        assertThat(result).isNotNull();
        verify(imageService).deleteImage(photoToRemove);
    }

    @Test
    @DisplayName("Should reject update exceeding 10 photo limit")
    void testUpdateObservation_ExceedsPhotoLimit() {
        UUID observationId = observation.getId();
        UpdateObservationRequest request = UpdateObservationRequest.builder().build();

        // Start with 10 photos (5 pairs)
        String[] currentPhotos = new String[20];
        for (int i = 0; i < 20; i++) {
            currentPhotos[i] = "http://s3/photo" + i + ".jpg";
        }
        observation.setPhotos(currentPhotos);

        // Try to add 1 more
        MockMultipartFile newPhoto = new MockMultipartFile(
                "photo", "new.jpg", "image/jpeg", new byte[]{1});

        when(observationRepository.findById(observationId)).thenReturn(Optional.of(observation));

        assertThatThrownBy(() -> observationService.updateObservation(
                observationId, request, List.of(newPhoto), user))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Maximum 10 photos allowed");
    }

    @Test
    @DisplayName("Should delete observation and photos")
    void testDeleteObservation() {
        UUID observationId = observation.getId();
        String[] photos = {"http://s3/full1.jpg", "http://s3/thumb1.jpg"};
        observation.setPhotos(photos);

        when(observationRepository.findById(observationId)).thenReturn(Optional.of(observation));

        observationService.deleteObservation(observationId, user);

        verify(imageService, times(2)).deleteImage(anyString());
        verify(observationRepository).delete(observation);
    }

    @Test
    @DisplayName("Should reject delete by unauthorized user")
    void testDeleteObservation_Unauthorized() {
        UUID observationId = observation.getId();

        when(observationRepository.findById(observationId)).thenReturn(Optional.of(observation));

        assertThatThrownBy(() -> observationService.deleteObservation(observationId, otherUser))
                .isInstanceOf(UnauthorizedException.class);

        verify(observationRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Should delete observation even if photo deletion fails")
    void testDeleteObservation_PhotoDeletionFails() {
        UUID observationId = observation.getId();
        String[] photos = {"http://s3/full1.jpg", "http://s3/thumb1.jpg"};
        observation.setPhotos(photos);

        when(observationRepository.findById(observationId)).thenReturn(Optional.of(observation));
        doThrow(new RuntimeException("S3 error")).when(imageService).deleteImage(anyString());

        // Should not throw - continues deleting observation
        assertThatCode(() -> observationService.deleteObservation(observationId, user))
                .doesNotThrowAnyException();

        verify(observationRepository).delete(observation);
    }
}