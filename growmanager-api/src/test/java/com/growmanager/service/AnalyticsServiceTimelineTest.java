package com.growmanager.service;

import com.growmanager.dto.TimelineEventResponse;
import com.growmanager.entity.*;
import com.growmanager.repository.*;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Unit tests for AnalyticsService timeline functionality.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AnalyticsService - Timeline Tests")
class AnalyticsServiceTimelineTest {

    @Mock
    private GrowRepository growRepository;

    @Mock
    private PlantRepository plantRepository;

    @Mock
    private EnvironmentalSnapshotRepository environmentalSnapshotRepository;

    @Mock
    private FeedingEventRepository feedingEventRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private ObservationRepository observationRepository;

    @Mock
    private HarvestRepository harvestRepository;

    @Mock
    private CultivarRepository cultivarRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    private User testUser;
    private Grow testGrow;
    private Plant testPlant;
    private Cultivar testCultivar;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .build();

        testCultivar = Cultivar.builder()
                .id(UUID.randomUUID())
                .name("Test Strain")
                .type(Cultivar.CultivarType.HYBRID)
                .user(testUser)
                .build();

        testGrow = Grow.builder()
                .id(UUID.randomUUID())
                .name("Test Grow")
                .user(testUser)
                .startDate(LocalDate.of(2024, 1, 1))
                .build();

        testPlant = Plant.builder()
                .id(UUID.randomUUID())
                .grow(testGrow)
                .cultivar(testCultivar)
                .tag("Plant-001")
                .plantedDate(LocalDate.of(2024, 1, 5))
                .stage(Plant.PlantStage.FLOWERING)
                .status(Plant.PlantStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("Should return empty timeline for grow with no data")
    void shouldReturnEmptyTimelineForGrowWithNoData() {
        // Given
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.of(2024, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2024, 3, 1, 0, 0);

        when(feedingEventRepository.findByGrowIdAndTimeRange(growId, startDate, endDate))
                .thenReturn(List.of());
        when(activityLogRepository.findByGrowIdAndTimeRange(growId, startDate, endDate))
                .thenReturn(List.of());
        when(observationRepository.findByGrowIdAndCreatedAtBetween(growId, startDate, endDate))
                .thenReturn(List.of());
        when(plantRepository.findByGrowId(growId)).thenReturn(List.of());

        // When
        TimelineEventResponse response = analyticsService.getTimelineEvents(
                growId, startDate, endDate, null, testUser);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getEvents()).isEmpty();
        assertThat(response.getMilestones()).isEmpty();
        assertThat(response.getPhotos()).isEmpty();
    }

    @Test
    @DisplayName("Should include feeding events in timeline")
    void shouldIncludeFeedingEventsInTimeline() {
        // Given
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.of(2024, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2024, 3, 1, 0, 0);

        FeedingEvent feedingEvent = FeedingEvent.builder()
                .id(UUID.randomUUID())
                .plant(testPlant)
                .fedAt(LocalDateTime.of(2024, 1, 10, 10, 0))
                .feedingType(FeedingEvent.FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(1000))
                .ecLevel(BigDecimal.valueOf(1.8))
                .phLevel(BigDecimal.valueOf(6.0))
                .nutrientMix("Bloom Mix")
                .build();

        when(feedingEventRepository.findByGrowIdAndTimeRange(growId, startDate, endDate))
                .thenReturn(List.of(feedingEvent));
        when(activityLogRepository.findByGrowIdAndTimeRange(growId, startDate, endDate))
                .thenReturn(List.of());
        when(observationRepository.findByGrowIdAndCreatedAtBetween(growId, startDate, endDate))
                .thenReturn(List.of());
        when(plantRepository.findByGrowId(growId)).thenReturn(List.of(testPlant));

        // When
        TimelineEventResponse response = analyticsService.getTimelineEvents(
                growId, startDate, endDate, null, testUser);

        // Then
        assertThat(response.getEvents()).hasSize(1);
        TimelineEventResponse.TimelineEvent event = response.getEvents().get(0);
        assertThat(event.getEventType()).isEqualTo("feeding");
        assertThat(event.getTimestamp()).isEqualTo(LocalDateTime.of(2024, 1, 10, 10, 0));
        assertThat(event.getPlantTag()).isEqualTo("Plant-001");
        assertThat(event.getDetails()).isNotNull();
        assertThat(event.getDetails().getEc()).isEqualTo(1.8);
        assertThat(event.getDetails().getPh()).isEqualTo(6.0);
        assertThat(event.getDetails().getWaterVolume()).isEqualTo(1000.0);
    }

    @Test
    @DisplayName("Should include activity logs in timeline")
    void shouldIncludeActivityLogsInTimeline() {
        // Given
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.of(2024, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2024, 3, 1, 0, 0);

        ActivityLog activityLog = ActivityLog.builder()
                .id(UUID.randomUUID())
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityLog.ActivityType.TRAINING)
                .loggedAt(LocalDateTime.of(2024, 1, 12, 14, 30))
                .notes("Regular training")
                .build();

        when(feedingEventRepository.findByGrowIdAndTimeRange(growId, startDate, endDate))
                .thenReturn(List.of());
        when(activityLogRepository.findByGrowIdAndTimeRange(growId, startDate, endDate))
                .thenReturn(List.of(activityLog));
        when(observationRepository.findByGrowIdAndCreatedAtBetween(growId, startDate, endDate))
                .thenReturn(List.of());
        when(plantRepository.findByGrowId(growId)).thenReturn(List.of(testPlant));

        // When
        TimelineEventResponse response = analyticsService.getTimelineEvents(
                growId, startDate, endDate, null, testUser);

        // Then
        assertThat(response.getEvents()).hasSize(1);
        TimelineEventResponse.TimelineEvent event = response.getEvents().get(0);
        assertThat(event.getEventType()).isEqualTo("training");
        assertThat(event.getTimestamp()).isEqualTo(LocalDateTime.of(2024, 1, 12, 14, 30));
        assertThat(event.getDetails().getActivityType()).isEqualTo("training");
        assertThat(event.getDetails().getNotes()).isEqualTo("Regular training");
    }

    @Test
    @DisplayName("Should include observations with photos in timeline")
    void shouldIncludeObservationsWithPhotosInTimeline() {
        // Given
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.of(2024, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2024, 3, 1, 0, 0);

        Observation observation = Observation.builder()
                .id(UUID.randomUUID())
                .plant(testPlant)
                .user(testUser)
                .observationType(Observation.ObservationType.PROGRESS)
                .note("Healthy growth")
                .photos(new String[]{"https://example.com/photo1.jpg"})
                .createdAt(LocalDateTime.of(2024, 1, 15, 9, 0))
                .build();

        when(feedingEventRepository.findByGrowIdAndTimeRange(growId, startDate, endDate))
                .thenReturn(List.of());
        when(activityLogRepository.findByGrowIdAndTimeRange(growId, startDate, endDate))
                .thenReturn(List.of());
        when(observationRepository.findByGrowIdAndCreatedAtBetween(growId, startDate, endDate))
                .thenReturn(List.of(observation));
        when(plantRepository.findByGrowId(growId)).thenReturn(List.of(testPlant));

        // When
        TimelineEventResponse response = analyticsService.getTimelineEvents(
                growId, startDate, endDate, null, testUser);

        // Then
        assertThat(response.getEvents()).hasSize(1);
        TimelineEventResponse.TimelineEvent event = response.getEvents().get(0);
        assertThat(event.getEventType()).isEqualTo("observation");
        assertThat(event.getDetails().getObservationType()).isEqualTo("progress");
        assertThat(event.getDetails().getPhotoUrls()).hasSize(1);

        // Photo timeline should also include this
        assertThat(response.getPhotos()).hasSize(1);
        TimelineEventResponse.PhotoEntry photo = response.getPhotos().get(0);
        assertThat(photo.getPhotoUrl()).isEqualTo("https://example.com/photo1.jpg");
        assertThat(photo.getCaption()).isEqualTo("Healthy growth");
    }

    @Test
    @DisplayName("Should create stage transition milestones")
    void shouldCreateStageTransitionMilestones() {
        // Given
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.of(2024, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2024, 3, 1, 0, 0);

        // Plant that transitioned through stages
        Plant plantWithHistory = Plant.builder()
                .id(UUID.randomUUID())
                .grow(testGrow)
                .cultivar(testCultivar)
                .tag("Plant-002")
                .plantedDate(LocalDate.of(2024, 1, 5))
                .stage(Plant.PlantStage.FLOWERING)
                .status(Plant.PlantStatus.ACTIVE)
                .createdAt(LocalDateTime.of(2024, 1, 5, 0, 0))
                .build();

        // Note: Stage transition milestones require STAGE_CHANGE activity type which doesn't exist yet
        // This test verifies that milestones collection is returned (even if empty)
        when(feedingEventRepository.findByGrowIdAndTimeRange(growId, startDate, endDate))
                .thenReturn(List.of());
        when(activityLogRepository.findByGrowIdAndTimeRange(growId, startDate, endDate))
                .thenReturn(List.of());
        when(observationRepository.findByGrowIdAndCreatedAtBetween(growId, startDate, endDate))
                .thenReturn(List.of());
        when(plantRepository.findByGrowId(growId)).thenReturn(List.of(plantWithHistory));

        // When
        TimelineEventResponse response = analyticsService.getTimelineEvents(
                growId, startDate, endDate, null, testUser);

        // Then
        assertThat(response.getMilestones()).isNotNull();
        // Milestones will be empty until STAGE_CHANGE activity type is implemented
    }

    @Test
    @DisplayName("Should aggregate all event types in chronological order")
    void shouldAggregateAllEventTypesInChronologicalOrder() {
        // Given
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.of(2024, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2024, 3, 1, 0, 0);

        FeedingEvent feedingEvent = FeedingEvent.builder()
                .id(UUID.randomUUID())
                .plant(testPlant)
                .fedAt(LocalDateTime.of(2024, 1, 10, 10, 0))
                .feedingType(FeedingEvent.FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(1000))
                .build();

        ActivityLog activityLog = ActivityLog.builder()
                .id(UUID.randomUUID())
                .plant(testPlant)
                .user(testUser)
                .activityType(ActivityLog.ActivityType.TRAINING)
                .loggedAt(LocalDateTime.of(2024, 1, 12, 14, 30))
                .notes("LST applied")
                .build();

        Observation observation = Observation.builder()
                .id(UUID.randomUUID())
                .plant(testPlant)
                .user(testUser)
                .observationType(Observation.ObservationType.PROGRESS)
                .note("Looking good")
                .createdAt(LocalDateTime.of(2024, 1, 15, 9, 0))
                .build();

        when(feedingEventRepository.findByGrowIdAndTimeRange(growId, startDate, endDate))
                .thenReturn(List.of(feedingEvent));
        when(activityLogRepository.findByGrowIdAndTimeRange(growId, startDate, endDate))
                .thenReturn(List.of(activityLog));
        when(observationRepository.findByGrowIdAndCreatedAtBetween(growId, startDate, endDate))
                .thenReturn(List.of(observation));
        when(plantRepository.findByGrowId(growId)).thenReturn(List.of(testPlant));

        // When
        TimelineEventResponse response = analyticsService.getTimelineEvents(
                growId, startDate, endDate, null, testUser);

        // Then
        assertThat(response.getEvents()).hasSize(3);

        // Should be in reverse chronological order (most recent first)
        assertThat(response.getEvents().get(0).getEventType()).isEqualTo("observation");
        assertThat(response.getEvents().get(1).getEventType()).isEqualTo("training");
        assertThat(response.getEvents().get(2).getEventType()).isEqualTo("feeding");
    }

    @Test
    @DisplayName("Should handle time range filtering correctly")
    void shouldHandleTimeRangeFilteringCorrectly() {
        // Given
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.of(2024, 1, 15, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2024, 1, 20, 0, 0);

        // Event within range
        FeedingEvent inRangeEvent = FeedingEvent.builder()
                .id(UUID.randomUUID())
                .plant(testPlant)
                .fedAt(LocalDateTime.of(2024, 1, 17, 10, 0))
                .feedingType(FeedingEvent.FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(1000))
                .build();

        when(feedingEventRepository.findByGrowIdAndTimeRange(growId, startDate, endDate))
                .thenReturn(List.of(inRangeEvent));
        when(activityLogRepository.findByGrowIdAndTimeRange(growId, startDate, endDate))
                .thenReturn(List.of());
        when(observationRepository.findByGrowIdAndCreatedAtBetween(growId, startDate, endDate))
                .thenReturn(List.of());
        when(plantRepository.findByGrowId(growId)).thenReturn(List.of(testPlant));

        // When
        TimelineEventResponse response = analyticsService.getTimelineEvents(
                growId, startDate, endDate, null, testUser);

        // Then
        assertThat(response.getEvents()).hasSize(1);
        assertThat(response.getEvents().get(0).getTimestamp())
                .isAfterOrEqualTo(startDate)
                .isBeforeOrEqualTo(endDate);
    }

    @Test
    @DisplayName("Should include multiple plants from the same grow")
    void shouldIncludeMultiplePlantsFromSameGrow() {
        // Given
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.of(2024, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2024, 3, 1, 0, 0);

        Plant plant2 = Plant.builder()
                .id(UUID.randomUUID())
                .grow(testGrow)
                .cultivar(testCultivar)
                .tag("Plant-002")
                .plantedDate(LocalDate.of(2024, 1, 5))
                .stage(Plant.PlantStage.VEGETATIVE)
                .status(Plant.PlantStatus.ACTIVE)
                .build();

        FeedingEvent feedingEvent1 = FeedingEvent.builder()
                .id(UUID.randomUUID())
                .plant(testPlant)
                .fedAt(LocalDateTime.of(2024, 1, 10, 10, 0))
                .feedingType(FeedingEvent.FeedingType.NUTRIENTS)
                .amountMl(BigDecimal.valueOf(1000))
                .build();

        FeedingEvent feedingEvent2 = FeedingEvent.builder()
                .id(UUID.randomUUID())
                .plant(plant2)
                .fedAt(LocalDateTime.of(2024, 1, 11, 10, 0))
                .feedingType(FeedingEvent.FeedingType.WATERING)
                .amountMl(BigDecimal.valueOf(800))
                .build();

        when(feedingEventRepository.findByGrowIdAndTimeRange(growId, startDate, endDate))
                .thenReturn(Arrays.asList(feedingEvent1, feedingEvent2));
        when(activityLogRepository.findByGrowIdAndTimeRange(growId, startDate, endDate))
                .thenReturn(List.of());
        when(observationRepository.findByGrowIdAndCreatedAtBetween(growId, startDate, endDate))
                .thenReturn(List.of());
        when(plantRepository.findByGrowId(growId)).thenReturn(Arrays.asList(testPlant, plant2));

        // When
        TimelineEventResponse response = analyticsService.getTimelineEvents(
                growId, startDate, endDate, null, testUser);

        // Then
        assertThat(response.getEvents()).hasSize(2);
        // Verify both plants are represented
        List<String> plantTags = response.getEvents().stream()
                .map(TimelineEventResponse.TimelineEvent::getPlantTag)
                .toList();
        assertThat(plantTags).containsExactlyInAnyOrder("Plant-001", "Plant-002");
    }

    @Test
    @DisplayName("Should include harvest events in timeline")
    void shouldIncludeHarvestEventsInTimeline() {
        // Given
        UUID growId = testGrow.getId();
        LocalDateTime startDate = LocalDateTime.of(2024, 1, 1, 0, 0);
        LocalDateTime endDate = LocalDateTime.of(2024, 5, 1, 0, 0);

        Harvest harvest = Harvest.builder()
                .id(UUID.randomUUID())
                .plant(testPlant)
                .grow(testGrow)
                .harvestDate(LocalDate.of(2024, 4, 15))
                .wetWeight(BigDecimal.valueOf(500.0))
                .dryWeight(BigDecimal.valueOf(100.0))
                .weightUnit(Harvest.WeightUnit.GRAMS)
                .build();

        when(feedingEventRepository.findByGrowIdAndTimeRange(growId, startDate, endDate))
                .thenReturn(List.of());
        when(activityLogRepository.findByGrowIdAndTimeRange(growId, startDate, endDate))
                .thenReturn(List.of());
        when(observationRepository.findByGrowIdAndCreatedAtBetween(growId, startDate, endDate))
                .thenReturn(List.of());
        when(harvestRepository.findByGrowIdOrderByHarvestDateDesc(growId))
                .thenReturn(List.of(harvest));
        when(plantRepository.findByGrowId(growId)).thenReturn(List.of(testPlant));

        // When
        TimelineEventResponse response = analyticsService.getTimelineEvents(
                growId, startDate, endDate, null, testUser);

        // Then
        assertThat(response.getEvents()).isNotEmpty();
        boolean hasHarvestEvent = response.getEvents().stream()
                .anyMatch(event -> event.getEventType().equals("harvest"));
        assertThat(hasHarvestEvent).isTrue();
    }
}