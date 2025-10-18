package com.growmanager.service;

import com.growmanager.dto.CreateObservationRequest;
import com.growmanager.dto.ObservationResponse;
import com.growmanager.dto.UpdateObservationRequest;
import com.growmanager.entity.Observation;
import com.growmanager.entity.Plant;
import com.growmanager.entity.User;
import com.growmanager.exception.ResourceNotFoundException;
import com.growmanager.exception.UnauthorizedException;
import com.growmanager.repository.ObservationRepository;
import com.growmanager.repository.PlantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing observations.
 * Handles photo uploads, validation, and ownership checks.
 */
@Service
public class ObservationService {

    private static final Logger logger = LoggerFactory.getLogger(ObservationService.class);
    private static final int MAX_PHOTOS = 10;

    private final ObservationRepository observationRepository;
    private final PlantRepository plantRepository;
    private final ImageService imageService;

    public ObservationService(
            ObservationRepository observationRepository,
            PlantRepository plantRepository,
            ImageService imageService) {
        this.observationRepository = observationRepository;
        this.plantRepository = plantRepository;
        this.imageService = imageService;
    }

    /**
     * Create a new observation with optional photos.
     *
     * @param plantId the plant ID
     * @param request the observation data
     * @param photos  optional photo files (max 10)
     * @param user    the current user
     * @return the created observation
     * @throws IOException if photo upload fails
     */
    @Transactional
    public ObservationResponse createObservation(
            UUID plantId,
            CreateObservationRequest request,
            List<MultipartFile> photos,
            User user) throws IOException {

        logger.info("Creating observation for plant {} by user {}", plantId, user.getId());

        // Validate plant ownership
        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found: " + plantId));

        if (!plant.getGrow().getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You don't have permission to add observations to this plant");
        }

        // Validate photo count
        if (photos != null && photos.size() > MAX_PHOTOS) {
            throw new IllegalArgumentException(
                    String.format("Maximum %d photos allowed, got %d", MAX_PHOTOS, photos.size()));
        }

        // Upload photos to S3
        List<String> photoUrls = new ArrayList<>();
        if (photos != null && !photos.isEmpty()) {
            logger.info("Uploading {} photos for observation", photos.size());
            for (MultipartFile photo : photos) {
                if (!photo.isEmpty()) {
                    String[] urls = imageService.uploadImage(photo, "observation", UUID.randomUUID());
                    photoUrls.add(urls[0]); // Full-size URL
                    photoUrls.add(urls[1]); // Thumbnail URL
                }
            }
        }

        // Create observation entity
        Observation observation = Observation.builder()
                .plant(plant)
                .user(user)
                .observationType(request.getObservationType())
                .note(request.getNote())
                .photos(photoUrls.isEmpty() ? null : photoUrls.toArray(new String[0]))
                .tags(request.getTags() != null && !request.getTags().isEmpty()
                        ? request.getTags().toArray(new String[0])
                        : null)
                .timestamp(request.getTimestamp() != null
                        ? request.getTimestamp()
                        : LocalDateTime.now())
                .build();

        observation = observationRepository.save(observation);

        logger.info("Created observation {} with {} photos", observation.getId(), photoUrls.size() / 2);

        return ObservationResponse.fromEntity(observation);
    }

    /**
     * Get all observations for a plant.
     *
     * @param plantId the plant ID
     * @param user    the current user
     * @return list of observations
     */
    @Transactional(readOnly = true)
    public List<ObservationResponse> getObservationsByPlant(UUID plantId, User user) {
        logger.info("Fetching observations for plant {}", plantId);

        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found: " + plantId));

        if (!plant.getGrow().getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You don't have permission to view observations for this plant");
        }

        return observationRepository.findByPlantIdOrderByTimestampDesc(plantId)
                .stream()
                .map(ObservationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get a single observation by ID.
     *
     * @param id   the observation ID
     * @param user the current user
     * @return the observation
     */
    @Transactional(readOnly = true)
    public ObservationResponse getObservationById(UUID id, User user) {
        logger.info("Fetching observation {}", id);

        Observation observation = observationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Observation not found: " + id));

        if (!observation.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You don't have permission to view this observation");
        }

        return ObservationResponse.fromEntity(observation);
    }

    /**
     * Update an existing observation.
     *
     * @param id      the observation ID
     * @param request the update data
     * @param photos  optional new photos to add
     * @param user    the current user
     * @return the updated observation
     * @throws IOException if photo upload/deletion fails
     */
    @Transactional
    public ObservationResponse updateObservation(
            UUID id,
            UpdateObservationRequest request,
            List<MultipartFile> photos,
            User user) throws IOException {

        logger.info("Updating observation {} by user {}", id, user.getId());

        Observation observation = observationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Observation not found: " + id));

        if (!observation.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You don't have permission to update this observation");
        }

        // Update basic fields
        if (request.getTimestamp() != null) {
            observation.setTimestamp(request.getTimestamp());
        }
        if (request.getNote() != null) {
            observation.setNote(request.getNote());
        }
        if (request.getObservationType() != null) {
            observation.setObservationType(
                    Observation.ObservationType.fromValue(request.getObservationType()));
        }
        if (request.getTags() != null) {
            observation.setTags(request.getTags().isEmpty()
                    ? null
                    : request.getTags().toArray(new String[0]));
        }

        // Handle photo removal
        List<String> currentPhotoUrls = observation.getPhotos() != null
                ? new ArrayList<>(Arrays.asList(observation.getPhotos()))
                : new ArrayList<>();

        if (request.getPhotosToRemove() != null && !request.getPhotosToRemove().isEmpty()) {
            logger.info("Removing {} photos from observation {}", request.getPhotosToRemove().size(), id);
            for (String urlToRemove : request.getPhotosToRemove()) {
                // Remove both full and thumb URLs
                currentPhotoUrls.remove(urlToRemove);
                // Delete from S3
                imageService.deleteImage(urlToRemove);
            }
        }

        // Handle photo addition
        if (photos != null && !photos.isEmpty()) {
            int currentPhotoCount = currentPhotoUrls.size() / 2; // Each photo has 2 URLs
            int newPhotoCount = photos.size();

            if (currentPhotoCount + newPhotoCount > MAX_PHOTOS) {
                throw new IllegalArgumentException(
                        String.format("Maximum %d photos allowed. Current: %d, trying to add: %d",
                                MAX_PHOTOS, currentPhotoCount, newPhotoCount));
            }

            logger.info("Adding {} photos to observation {}", newPhotoCount, id);
            for (MultipartFile photo : photos) {
                if (!photo.isEmpty()) {
                    String[] urls = imageService.uploadImage(photo, "observation", UUID.randomUUID());
                    currentPhotoUrls.add(urls[0]); // Full-size
                    currentPhotoUrls.add(urls[1]); // Thumbnail
                }
            }
        }

        observation.setPhotos(currentPhotoUrls.isEmpty()
                ? null
                : currentPhotoUrls.toArray(new String[0]));

        observation = observationRepository.save(observation);

        logger.info("Updated observation {}", id);

        return ObservationResponse.fromEntity(observation);
    }

    /**
     * Delete an observation and all its photos.
     *
     * @param id   the observation ID
     * @param user the current user
     */
    @Transactional
    public void deleteObservation(UUID id, User user) {
        logger.info("Deleting observation {} by user {}", id, user.getId());

        Observation observation = observationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Observation not found: " + id));

        if (!observation.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You don't have permission to delete this observation");
        }

        // Delete all photos from S3
        if (observation.getPhotos() != null) {
            logger.info("Deleting {} photo URLs from S3", observation.getPhotos().length);
            for (String photoUrl : observation.getPhotos()) {
                try {
                    imageService.deleteImage(photoUrl);
                } catch (Exception e) {
                    logger.error("Failed to delete photo {} from S3", photoUrl, e);
                    // Continue deleting other photos
                }
            }
        }

        observationRepository.delete(observation);

        logger.info("Deleted observation {}", id);
    }
}