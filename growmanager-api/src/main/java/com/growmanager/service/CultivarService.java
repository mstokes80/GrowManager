package com.growmanager.service;

import com.growmanager.dto.CreateCultivarRequest;
import com.growmanager.dto.CultivarResponse;
import com.growmanager.dto.UpdateCultivarRequest;
import com.growmanager.entity.Cultivar;
import com.growmanager.entity.User;
import com.growmanager.exception.ResourceNotFoundException;
import com.growmanager.repository.CultivarRepository;
import com.growmanager.repository.PlantRepository;
import com.growmanager.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing cultivar operations.
 * Handles CRUD operations for cultivars with ownership validation.
 */
@Service
@Transactional
public class CultivarService {

    private static final Logger logger = LoggerFactory.getLogger(CultivarService.class);

    private final CultivarRepository cultivarRepository;
    private final UserRepository userRepository;
    private final PlantRepository plantRepository;

    @Autowired
    public CultivarService(
            CultivarRepository cultivarRepository,
            UserRepository userRepository,
            PlantRepository plantRepository
    ) {
        this.cultivarRepository = cultivarRepository;
        this.userRepository = userRepository;
        this.plantRepository = plantRepository;
    }

    /**
     * Creates a new cultivar for the current user.
     *
     * @param userId the ID of the current user
     * @param request the create cultivar request
     * @return the created cultivar response
     * @throws ResourceNotFoundException if user not found
     */
    public CultivarResponse createCultivar(UUID userId, CreateCultivarRequest request) {
        logger.info("Creating cultivar for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Cultivar cultivar = Cultivar.builder()
                .user(user)
                .name(request.getName())
                .breeder(request.getBreeder())
                .genetics(request.getGenetics())
                .type(request.getType())
                .characteristics(request.getCharacteristics())
                .notes(request.getNotes())
                .build();

        cultivar = cultivarRepository.save(cultivar);

        logger.info("Cultivar created successfully with ID: {}", cultivar.getId());

        return CultivarResponse.fromEntity(cultivar);
    }

    /**
     * Gets all cultivars for the current user.
     *
     * @param userId the ID of the current user
     * @return list of cultivar responses
     */
    @Transactional(readOnly = true)
    public List<CultivarResponse> getCultivarsByUser(UUID userId) {
        logger.info("Fetching cultivars for user ID: {}", userId);

        List<Cultivar> cultivars = cultivarRepository.findByUserId(userId);

        return cultivars.stream()
                .map(CultivarResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Gets a single cultivar by ID.
     * Validates that the cultivar belongs to the current user.
     *
     * @param userId the ID of the current user
     * @param cultivarId the ID of the cultivar
     * @return the cultivar response
     * @throws ResourceNotFoundException if cultivar not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public CultivarResponse getCultivarById(UUID userId, UUID cultivarId) {
        logger.info("Fetching cultivar ID: {} for user ID: {}", cultivarId, userId);

        Cultivar cultivar = cultivarRepository.findById(cultivarId)
                .orElseThrow(() -> new ResourceNotFoundException("Cultivar not found"));

        // Validate ownership
        if (!cultivar.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access cultivar {} owned by different user",
                    userId, cultivarId);
            throw new ResourceNotFoundException("Cultivar not found");
        }

        return CultivarResponse.fromEntity(cultivar);
    }

    /**
     * Updates an existing cultivar.
     * Validates that the cultivar belongs to the current user.
     *
     * @param userId the ID of the current user
     * @param cultivarId the ID of the cultivar to update
     * @param request the update cultivar request
     * @return the updated cultivar response
     * @throws ResourceNotFoundException if cultivar not found or doesn't belong to user
     */
    public CultivarResponse updateCultivar(UUID userId, UUID cultivarId, UpdateCultivarRequest request) {
        logger.info("Updating cultivar ID: {} for user ID: {}", cultivarId, userId);

        Cultivar cultivar = cultivarRepository.findById(cultivarId)
                .orElseThrow(() -> new ResourceNotFoundException("Cultivar not found"));

        // Validate ownership
        if (!cultivar.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to update cultivar {} owned by different user",
                    userId, cultivarId);
            throw new ResourceNotFoundException("Cultivar not found");
        }

        // Update fields if provided
        if (request.getName() != null) {
            cultivar.setName(request.getName());
        }
        if (request.getBreeder() != null) {
            cultivar.setBreeder(request.getBreeder());
        }
        if (request.getGenetics() != null) {
            cultivar.setGenetics(request.getGenetics());
        }
        if (request.getType() != null) {
            cultivar.setType(request.getType());
        }
        if (request.getCharacteristics() != null) {
            cultivar.setCharacteristics(request.getCharacteristics());
        }
        if (request.getNotes() != null) {
            cultivar.setNotes(request.getNotes());
        }

        cultivar = cultivarRepository.save(cultivar);

        logger.info("Cultivar updated successfully: {}", cultivarId);

        return CultivarResponse.fromEntity(cultivar);
    }

    /**
     * Deletes a cultivar.
     * Validates that the cultivar belongs to the current user.
     * Sets cultivar_id to NULL on any linked plants before deletion.
     *
     * @param userId the ID of the current user
     * @param cultivarId the ID of the cultivar to delete
     * @throws ResourceNotFoundException if cultivar not found or doesn't belong to user
     */
    public void deleteCultivar(UUID userId, UUID cultivarId) {
        logger.info("Deleting cultivar ID: {} for user ID: {}", cultivarId, userId);

        Cultivar cultivar = cultivarRepository.findById(cultivarId)
                .orElseThrow(() -> new ResourceNotFoundException("Cultivar not found"));

        // Validate ownership
        if (!cultivar.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to delete cultivar {} owned by different user",
                    userId, cultivarId);
            throw new ResourceNotFoundException("Cultivar not found");
        }

        // Check if cultivar is linked to any plants
        long plantCount = plantRepository.countByCultivarId(cultivarId);
        if (plantCount > 0) {
            logger.info("Cultivar {} is linked to {} plants. Setting cultivar_id to NULL on plants.",
                    cultivarId, plantCount);
            // Set cultivar_id to NULL on all linked plants
            plantRepository.clearCultivarReference(cultivarId);
        }

        cultivarRepository.delete(cultivar);

        logger.info("Cultivar deleted successfully: {}", cultivarId);
    }
}
