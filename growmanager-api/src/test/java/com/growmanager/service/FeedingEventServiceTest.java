package com.growmanager.service;

import com.growmanager.dto.FeedingEventRequestDTO;
import com.growmanager.dto.FeedingEventResponseDTO;
import com.growmanager.entity.FeedingEvent;
import com.growmanager.entity.FeedingEvent.FeedingType;
import com.growmanager.entity.Grow;
import com.growmanager.entity.Plant;
import com.growmanager.entity.User;
import com.growmanager.exception.ResourceNotFoundException;
import com.growmanager.repository.FeedingEventRepository;
import com.growmanager.repository.PlantRepository;
import com.growmanager.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Test suite for FeedingEventService.
 * Tests business logic for feeding event operations with mocked dependencies.
 */
@ExtendWith(MockitoExtension.class)
class FeedingEventServiceTest {

    @Mock
    private FeedingEventRepository feedingEventRepository;

    @Mock
    private PlantRepository plantRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private FeedingEventService feedingEventService;

    private UUID userId;
    private UUID plantId;
    private UUID growId;
    private UUID feedingEventId;
    private User user;
    private Grow grow;
    private Plant plant;
    private FeedingEvent feedingEvent;
    private FeedingEventRequestDTO requestDTO;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        plantId = UUID.randomUUID();
        growId = UUID.randomUUID();
        feedingEventId = UUID.randomUUID();

        user = User.builder()
                .id(userId)
                .email("test@example.com")
                .displayName("Test User")
                .role(User.Role.USER)
                .build();

        grow = Grow.builder()
                .id(growId)
                .user(user)
                .name("Test Grow")
                .startDate(LocalDate.now())
                .status(Grow.GrowStatus.ACTIVE)
                .build();

        plant = Plant.builder()
                .id(plantId)
                .tag("Test Plant")
                .grow(grow)
                .plantedDate(LocalDate.now())
                .status(Plant.PlantStatus.ACTIVE)
                .build();

        feedingEvent = FeedingEvent.builder()
                .id(feedingEventId)
                .plant(plant)
                .user(user)
                .feedingType(FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(500))
                .ecLevel(BigDecimal.valueOf(1.5))
                .phLevel(BigDecimal.valueOf(6.0))
                .nutrientMix("Base nutrients")
                .notes("Regular feeding")
                .fedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        requestDTO = FeedingEventRequestDTO.builder()
                .feedingType("watering")
                .amountMl(BigDecimal.valueOf(500))
                .ecLevel(BigDecimal.valueOf(1.5))
                .phLevel(BigDecimal.valueOf(6.0))
                .nutrientMix("Base nutrients")
                .notes("Regular feeding")
                .fedAt(LocalDateTime.now())
                .build();
    }

    // Create Feeding Event Tests
    @Test
    @DisplayName("Should create feeding event successfully")
    void testCreateFeedingEvent_Success() {
        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(feedingEventRepository.saveAll(anyList())).thenReturn(Arrays.asList(feedingEvent));

        List<FeedingEventResponseDTO> result = feedingEventService.createFeedingEvent(plantId, userId, requestDTO);

        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(feedingEventId);
        assertThat(result.get(0).getFeedingType()).isEqualTo("watering");

        verify(plantRepository).findById(plantId);
        verify(userRepository).findById(userId);
        verify(feedingEventRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("Should throw exception when creating feeding event for non-existent plant")
    void testCreateFeedingEvent_PlantNotFound() {
        when(plantRepository.findById(plantId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> feedingEventService.createFeedingEvent(plantId, userId, requestDTO))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Plant not found");

        verify(plantRepository).findById(plantId);
        verify(userRepository, never()).findById(any());
        verify(feedingEventRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when creating feeding event for plant user doesn't own")
    void testCreateFeedingEvent_UnauthorizedUser() {
        UUID otherUserId = UUID.randomUUID();

        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));

        assertThatThrownBy(() -> feedingEventService.createFeedingEvent(plantId, otherUserId, requestDTO))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Plant not found");

        verify(plantRepository).findById(plantId);
        verify(userRepository, never()).findById(any());
        verify(feedingEventRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should create feeding event with different feeding types")
    void testCreateFeedingEvent_DifferentTypes() {
        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        // Test watering
        feedingEvent.setFeedingType(FeedingType.WATERING);
        when(feedingEventRepository.saveAll(anyList())).thenReturn(Arrays.asList(feedingEvent));
        List<FeedingEventResponseDTO> wateringResult = feedingEventService.createFeedingEvent(plantId, userId, requestDTO);
        assertThat(wateringResult).hasSize(1);
        assertThat(wateringResult.get(0).getFeedingType()).isEqualTo("watering");

        // Test nutrients
        requestDTO.setFeedingType("nutrients");
        feedingEvent.setFeedingType(FeedingType.NUTRIENTS);
        when(feedingEventRepository.saveAll(anyList())).thenReturn(Arrays.asList(feedingEvent));
        List<FeedingEventResponseDTO> nutrientsResult = feedingEventService.createFeedingEvent(plantId, userId, requestDTO);
        assertThat(nutrientsResult).hasSize(1);
        assertThat(nutrientsResult.get(0).getFeedingType()).isEqualTo("nutrients");

        // Test foliar
        requestDTO.setFeedingType("foliar");
        feedingEvent.setFeedingType(FeedingType.FOLIAR);
        when(feedingEventRepository.saveAll(anyList())).thenReturn(Arrays.asList(feedingEvent));
        List<FeedingEventResponseDTO> foliarResult = feedingEventService.createFeedingEvent(plantId, userId, requestDTO);
        assertThat(foliarResult).hasSize(1);
        assertThat(foliarResult.get(0).getFeedingType()).isEqualTo("foliar");
    }

    // Get Feeding Event Tests
    @Test
    @DisplayName("Should get feeding event by ID successfully")
    void testGetFeedingEventById_Success() {
        when(feedingEventRepository.findById(feedingEventId)).thenReturn(Optional.of(feedingEvent));

        FeedingEventResponseDTO result = feedingEventService.getFeedingEventById(feedingEventId, userId);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(feedingEventId);

        verify(feedingEventRepository).findById(feedingEventId);
    }

    @Test
    @DisplayName("Should throw exception when getting non-existent feeding event")
    void testGetFeedingEventById_NotFound() {
        when(feedingEventRepository.findById(feedingEventId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> feedingEventService.getFeedingEventById(feedingEventId, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Feeding event not found");

        verify(feedingEventRepository).findById(feedingEventId);
    }

    @Test
    @DisplayName("Should throw exception when getting feeding event user doesn't own")
    void testGetFeedingEventById_Unauthorized() {
        UUID otherUserId = UUID.randomUUID();
        when(feedingEventRepository.findById(feedingEventId)).thenReturn(Optional.of(feedingEvent));

        assertThatThrownBy(() -> feedingEventService.getFeedingEventById(feedingEventId, otherUserId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Feeding event not found");

        verify(feedingEventRepository).findById(feedingEventId);
    }

    // Get Feeding Events by Plant Tests
    @Test
    @DisplayName("Should get all feeding events for a plant")
    void testGetFeedingEventsByPlant_Success() {
        List<FeedingEvent> events = Arrays.asList(feedingEvent, feedingEvent);
        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));
        when(feedingEventRepository.findByPlantId(plantId)).thenReturn(events);

        List<FeedingEventResponseDTO> result = feedingEventService.getFeedingEventsByPlant(plantId, userId);

        assertThat(result).hasSize(2);
        verify(plantRepository).findById(plantId);
        verify(feedingEventRepository).findByPlantId(plantId);
    }

    @Test
    @DisplayName("Should throw exception when getting feeding events for non-existent plant")
    void testGetFeedingEventsByPlant_PlantNotFound() {
        when(plantRepository.findById(plantId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> feedingEventService.getFeedingEventsByPlant(plantId, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Plant not found");

        verify(plantRepository).findById(plantId);
        verify(feedingEventRepository, never()).findByPlantId(any());
    }

    @Test
    @DisplayName("Should throw exception when getting feeding events for plant user doesn't own")
    void testGetFeedingEventsByPlant_Unauthorized() {
        UUID otherUserId = UUID.randomUUID();
        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));

        assertThatThrownBy(() -> feedingEventService.getFeedingEventsByPlant(plantId, otherUserId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Plant not found");

        verify(plantRepository).findById(plantId);
        verify(feedingEventRepository, never()).findByPlantId(any());
    }

    // Get Feeding Events by Grow Tests
    @Test
    @DisplayName("Should get all feeding events for a grow")
    void testGetFeedingEventsByGrow_Success() {
        List<FeedingEvent> events = Arrays.asList(feedingEvent, feedingEvent);
        when(feedingEventRepository.findByGrowId(growId)).thenReturn(events);

        List<FeedingEventResponseDTO> result = feedingEventService.getFeedingEventsByGrow(growId, userId);

        assertThat(result).hasSize(2);
        verify(feedingEventRepository).findByGrowId(growId);
    }

    @Test
    @DisplayName("Should throw exception when getting feeding events for grow user doesn't own")
    void testGetFeedingEventsByGrow_Unauthorized() {
        UUID otherUserId = UUID.randomUUID();
        List<FeedingEvent> events = Arrays.asList(feedingEvent);
        when(feedingEventRepository.findByGrowId(growId)).thenReturn(events);

        assertThatThrownBy(() -> feedingEventService.getFeedingEventsByGrow(growId, otherUserId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Grow not found");

        verify(feedingEventRepository).findByGrowId(growId);
    }

    // Update Feeding Event Tests
    @Test
    @DisplayName("Should update feeding event successfully")
    void testUpdateFeedingEvent_Success() {
        FeedingEventRequestDTO updateDTO = FeedingEventRequestDTO.builder()
                .feedingType("nutrients")
                .amountMl(BigDecimal.valueOf(600))
                .ecLevel(BigDecimal.valueOf(1.8))
                .phLevel(BigDecimal.valueOf(6.2))
                .build();

        when(feedingEventRepository.findById(feedingEventId)).thenReturn(Optional.of(feedingEvent));
        when(feedingEventRepository.save(any(FeedingEvent.class))).thenReturn(feedingEvent);

        FeedingEventResponseDTO result = feedingEventService.updateFeedingEvent(feedingEventId, userId, updateDTO);

        assertThat(result).isNotNull();
        verify(feedingEventRepository).findById(feedingEventId);
        verify(feedingEventRepository).save(feedingEvent);
    }

    @Test
    @DisplayName("Should throw exception when updating non-existent feeding event")
    void testUpdateFeedingEvent_NotFound() {
        when(feedingEventRepository.findById(feedingEventId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> feedingEventService.updateFeedingEvent(feedingEventId, userId, requestDTO))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Feeding event not found");

        verify(feedingEventRepository).findById(feedingEventId);
        verify(feedingEventRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when updating feeding event user doesn't own")
    void testUpdateFeedingEvent_Unauthorized() {
        UUID otherUserId = UUID.randomUUID();
        when(feedingEventRepository.findById(feedingEventId)).thenReturn(Optional.of(feedingEvent));

        assertThatThrownBy(() -> feedingEventService.updateFeedingEvent(feedingEventId, otherUserId, requestDTO))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Feeding event not found");

        verify(feedingEventRepository).findById(feedingEventId);
        verify(feedingEventRepository, never()).save(any());
    }

    // Delete Feeding Event Tests
    @Test
    @DisplayName("Should delete feeding event successfully")
    void testDeleteFeedingEvent_Success() {
        when(feedingEventRepository.findById(feedingEventId)).thenReturn(Optional.of(feedingEvent));
        doNothing().when(feedingEventRepository).delete(feedingEvent);

        feedingEventService.deleteFeedingEvent(feedingEventId, userId);

        verify(feedingEventRepository).findById(feedingEventId);
        verify(feedingEventRepository).delete(feedingEvent);
    }

    @Test
    @DisplayName("Should throw exception when deleting non-existent feeding event")
    void testDeleteFeedingEvent_NotFound() {
        when(feedingEventRepository.findById(feedingEventId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> feedingEventService.deleteFeedingEvent(feedingEventId, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Feeding event not found");

        verify(feedingEventRepository).findById(feedingEventId);
        verify(feedingEventRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Should throw exception when deleting feeding event user doesn't own")
    void testDeleteFeedingEvent_Unauthorized() {
        UUID otherUserId = UUID.randomUUID();
        when(feedingEventRepository.findById(feedingEventId)).thenReturn(Optional.of(feedingEvent));

        assertThatThrownBy(() -> feedingEventService.deleteFeedingEvent(feedingEventId, otherUserId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Feeding event not found");

        verify(feedingEventRepository).findById(feedingEventId);
        verify(feedingEventRepository, never()).delete(any());
    }

    // Get Recent Feeding Events Tests
    @Test
    @DisplayName("Should get recent feeding events successfully")
    void testGetRecentFeedingEvents_Success() {
        List<FeedingEvent> events = Arrays.asList(feedingEvent, feedingEvent, feedingEvent);
        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));
        when(feedingEventRepository.findRecentByPlantId(plantId, 5)).thenReturn(events);

        List<FeedingEventResponseDTO> result = feedingEventService.getRecentFeedingEvents(plantId, userId, 5);

        assertThat(result).hasSize(3);
        verify(plantRepository).findById(plantId);
        verify(feedingEventRepository).findRecentByPlantId(plantId, 5);
    }

    // Get Feeding Statistics Tests
    @Test
    @DisplayName("Should calculate feeding statistics successfully")
    void testGetFeedingStatistics_Success() {
        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));
        when(feedingEventRepository.countByPlantId(plantId)).thenReturn(10L);
        when(feedingEventRepository.countByPlantIdAndType(plantId, FeedingType.WATERING)).thenReturn(5L);
        when(feedingEventRepository.countByPlantIdAndType(plantId, FeedingType.NUTRIENTS)).thenReturn(3L);
        when(feedingEventRepository.countByPlantIdAndType(plantId, FeedingType.FOLIAR)).thenReturn(2L);
        when(feedingEventRepository.calculateTotalAmountByPlantId(plantId)).thenReturn(5000.0);
        when(feedingEventRepository.calculateAverageEcByPlantId(plantId)).thenReturn(1.5);
        when(feedingEventRepository.calculateAveragePhByPlantId(plantId)).thenReturn(6.0);
        when(feedingEventRepository.findMostRecentByPlantId(plantId)).thenReturn(feedingEvent);

        Map<String, Object> stats = feedingEventService.getFeedingStatistics(plantId, userId);

        assertThat(stats).isNotNull();
        assertThat(stats.get("totalCount")).isEqualTo(10L);
        assertThat(stats.get("wateringCount")).isEqualTo(5L);
        assertThat(stats.get("nutrientsCount")).isEqualTo(3L);
        assertThat(stats.get("foliarCount")).isEqualTo(2L);

        verify(plantRepository).findById(plantId);
        verify(feedingEventRepository).countByPlantId(plantId);
        verify(feedingEventRepository).calculateTotalAmountByPlantId(plantId);
        verify(feedingEventRepository).calculateAverageEcByPlantId(plantId);
        verify(feedingEventRepository).calculateAveragePhByPlantId(plantId);
    }

    @Test
    @DisplayName("Should throw exception when getting statistics for plant user doesn't own")
    void testGetFeedingStatistics_Unauthorized() {
        UUID otherUserId = UUID.randomUUID();
        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));

        assertThatThrownBy(() -> feedingEventService.getFeedingStatistics(plantId, otherUserId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Plant not found");

        verify(plantRepository).findById(plantId);
    }

    @Test
    @DisplayName("Should handle statistics with null average values")
    void testGetFeedingStatistics_NullAverages() {
        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));
        when(feedingEventRepository.countByPlantId(plantId)).thenReturn(0L);
        when(feedingEventRepository.countByPlantIdAndType(any(), any())).thenReturn(0L);
        when(feedingEventRepository.calculateTotalAmountByPlantId(plantId)).thenReturn(0.0);
        when(feedingEventRepository.calculateAverageEcByPlantId(plantId)).thenReturn(null);
        when(feedingEventRepository.calculateAveragePhByPlantId(plantId)).thenReturn(null);
        when(feedingEventRepository.findMostRecentByPlantId(plantId)).thenReturn(null);

        Map<String, Object> stats = feedingEventService.getFeedingStatistics(plantId, userId);

        assertThat(stats).isNotNull();
        assertThat(stats.get("totalCount")).isEqualTo(0L);
        assertThat(stats.get("averageEcLevel")).isNull();
        assertThat(stats.get("averagePhLevel")).isNull();
    }
}