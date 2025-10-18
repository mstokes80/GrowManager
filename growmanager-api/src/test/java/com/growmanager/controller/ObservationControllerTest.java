package com.growmanager.controller;

import com.growmanager.dto.CreateObservationRequest;
import com.growmanager.dto.ObservationResponse;
import com.growmanager.dto.UpdateObservationRequest;
import com.growmanager.entity.Observation;
import com.growmanager.entity.User;
import com.growmanager.repository.UserRepository;
import com.growmanager.security.UserPrincipal;
import com.growmanager.service.ObservationService;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Test suite for ObservationController.
 * Tests REST endpoints for observation management.
 */
@ExtendWith(MockitoExtension.class)
class ObservationControllerTest {

    @Mock
    private ObservationService observationService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ObservationController observationController;

    private User user;
    private UserPrincipal principal;
    private UUID plantId;
    private UUID observationId;
    private ObservationResponse observationResponse;

    @BeforeEach
    void setUp() {
        UUID userId = UUID.randomUUID();
        user = User.builder()
                .id(userId)
                .email("test@example.com")
                .build();

        principal = UserPrincipal.builder()
                .id(userId)
                .email("test@example.com")
                .password("password")
                .role("USER")
                .emailVerified(true)
                .accountLocked(false)
                .build();
        plantId = UUID.randomUUID();
        observationId = UUID.randomUUID();

        observationResponse = ObservationResponse.builder()
                .id(observationId)
                .plantId(plantId)
                .plantName("Test Plant")
                .observationType("health_check")
                .note("Test observation")
                .timestamp(LocalDateTime.now())
                .photos(new ArrayList<>())
                .tags(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("Should create observation without photos")
    void testCreateObservation_WithoutPhotos() throws IOException {
        CreateObservationRequest request = CreateObservationRequest.builder()
                .observationType(Observation.ObservationType.HEALTH_CHECK)
                .note("Test note")
                .build();

        when(userRepository.findById(principal.getId())).thenReturn(Optional.of(user));
        when(observationService.createObservation(eq(plantId), eq(request), eq(null), eq(user)))
                .thenReturn(observationResponse);

        ResponseEntity<ObservationResponse> response = observationController.createObservation(
                plantId, request, null, principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getId()).isEqualTo(observationId);

        verify(observationService).createObservation(eq(plantId), eq(request), eq(null), eq(user));
    }

    @Test
    @DisplayName("Should create observation with photos")
    void testCreateObservation_WithPhotos() throws IOException {
        CreateObservationRequest request = CreateObservationRequest.builder()
                .observationType(Observation.ObservationType.PROGRESS)
                .note("Test with photos")
                .build();

        MockMultipartFile photo1 = new MockMultipartFile(
                "photos", "test1.jpg", "image/jpeg", new byte[]{1, 2, 3});
        MockMultipartFile photo2 = new MockMultipartFile(
                "photos", "test2.jpg", "image/jpeg", new byte[]{4, 5, 6});
        List<MultipartFile> photos = List.of(photo1, photo2);

        List<ObservationResponse.PhotoUrl> photoUrls = List.of(
                ObservationResponse.PhotoUrl.builder()
                        .fullSizeUrl("http://s3/full1.jpg")
                        .thumbnailUrl("http://s3/thumb1.jpg")
                        .build(),
                ObservationResponse.PhotoUrl.builder()
                        .fullSizeUrl("http://s3/full2.jpg")
                        .thumbnailUrl("http://s3/thumb2.jpg")
                        .build()
        );
        observationResponse.setPhotos(photoUrls);

        when(userRepository.findById(principal.getId())).thenReturn(Optional.of(user));
        when(observationService.createObservation(eq(plantId), eq(request), anyList(), eq(user)))
                .thenReturn(observationResponse);

        ResponseEntity<ObservationResponse> response = observationController.createObservation(
                plantId, request, photos, principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getPhotos()).hasSize(2);
    }

    @Test
    @DisplayName("Should return 500 when photo upload fails")
    void testCreateObservation_UploadFails() throws IOException {
        CreateObservationRequest request = CreateObservationRequest.builder()
                .observationType(Observation.ObservationType.HEALTH_CHECK)
                .build();

        MockMultipartFile photo = new MockMultipartFile(
                "photos", "test.jpg", "image/jpeg", new byte[]{1, 2, 3});

        when(userRepository.findById(principal.getId())).thenReturn(Optional.of(user));
        when(observationService.createObservation(any(), any(), any(), any()))
                .thenThrow(new IOException("Upload failed"));

        ResponseEntity<ObservationResponse> response = observationController.createObservation(
                plantId, request, List.of(photo), principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNull();
    }

    @Test
    @DisplayName("Should get observations by plant")
    void testGetObservationsByPlant() {
        List<ObservationResponse> observations = List.of(observationResponse);

        when(userRepository.findById(principal.getId())).thenReturn(Optional.of(user));
        when(observationService.getObservationsByPlant(plantId, user)).thenReturn(observations);

        ResponseEntity<List<ObservationResponse>> response = observationController
                .getObservationsByPlant(plantId, principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).getId()).isEqualTo(observationId);
    }

    @Test
    @DisplayName("Should get empty list when plant has no observations")
    void testGetObservationsByPlant_Empty() {
        when(userRepository.findById(principal.getId())).thenReturn(Optional.of(user));
        when(observationService.getObservationsByPlant(plantId, user))
                .thenReturn(new ArrayList<>());

        ResponseEntity<List<ObservationResponse>> response = observationController
                .getObservationsByPlant(plantId, principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    @DisplayName("Should get observation by ID")
    void testGetObservationById() {
        when(userRepository.findById(principal.getId())).thenReturn(Optional.of(user));
        when(observationService.getObservationById(observationId, user))
                .thenReturn(observationResponse);

        ResponseEntity<ObservationResponse> response = observationController
                .getObservationById(observationId, principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getId()).isEqualTo(observationId);
    }

    @Test
    @DisplayName("Should update observation")
    void testUpdateObservation() throws IOException {
        UpdateObservationRequest request = UpdateObservationRequest.builder()
                .note("Updated note")
                .observationType("pest")
                .build();

        observationResponse.setNote("Updated note");
        observationResponse.setObservationType("pest");

        when(userRepository.findById(principal.getId())).thenReturn(Optional.of(user));
        when(observationService.updateObservation(eq(observationId), eq(request), eq(null), eq(user)))
                .thenReturn(observationResponse);

        ResponseEntity<ObservationResponse> response = observationController.updateObservation(
                observationId, request, null, principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getNote()).isEqualTo("Updated note");
        assertThat(response.getBody().getObservationType()).isEqualTo("pest");
    }

    @Test
    @DisplayName("Should update observation and add photos")
    void testUpdateObservation_AddPhotos() throws IOException {
        UpdateObservationRequest request = UpdateObservationRequest.builder().build();

        MockMultipartFile newPhoto = new MockMultipartFile(
                "photos", "new.jpg", "image/jpeg", new byte[]{7, 8, 9});

        when(userRepository.findById(principal.getId())).thenReturn(Optional.of(user));
        when(observationService.updateObservation(
                eq(observationId), eq(request), anyList(), eq(user)))
                .thenReturn(observationResponse);

        ResponseEntity<ObservationResponse> response = observationController.updateObservation(
                observationId, request, List.of(newPhoto), principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(observationService).updateObservation(
                eq(observationId), eq(request), anyList(), eq(user));
    }

    @Test
    @DisplayName("Should return 500 when update photo operations fail")
    void testUpdateObservation_PhotoOperationsFail() throws IOException {
        UpdateObservationRequest request = UpdateObservationRequest.builder()
                .photosToRemove(List.of("http://s3/photo.jpg"))
                .build();

        when(userRepository.findById(principal.getId())).thenReturn(Optional.of(user));
        when(observationService.updateObservation(any(), any(), any(), any()))
                .thenThrow(new IOException("Photo operation failed"));

        ResponseEntity<ObservationResponse> response = observationController.updateObservation(
                observationId, request, null, principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNull();
    }

    @Test
    @DisplayName("Should delete observation")
    void testDeleteObservation() {
        when(userRepository.findById(principal.getId())).thenReturn(Optional.of(user));
        doNothing().when(observationService).deleteObservation(observationId, user);

        ResponseEntity<Void> response = observationController.deleteObservation(
                observationId, principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getBody()).isNull();

        verify(observationService).deleteObservation(observationId, user);
    }

    @Test
    @DisplayName("Should delete observation with photos")
    void testDeleteObservation_WithPhotos() {
        when(userRepository.findById(principal.getId())).thenReturn(Optional.of(user));
        doNothing().when(observationService).deleteObservation(observationId, user);

        ResponseEntity<Void> response = observationController.deleteObservation(
                observationId, principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(observationService).deleteObservation(observationId, user);
    }
}