package com.growmanager.controller;

import com.growmanager.dto.*;
import com.growmanager.entity.User;
import com.growmanager.repository.UserRepository;
import com.growmanager.security.JwtTokenProvider;
import com.growmanager.service.AnalyticsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for AnalyticsController.
 * Tests controller layer, request mapping, validation, and response formatting.
 */
@WebMvcTest(AnalyticsController.class)
class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AnalyticsService analyticsService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    private User testUser;
    private UUID testGrowId;
    private UUID testPlantId;
    private UUID testCultivarId;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");

        testGrowId = UUID.randomUUID();
        testPlantId = UUID.randomUUID();
        testCultivarId = UUID.randomUUID();

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void testGetDashboardMetrics_Success() throws Exception {
        // Arrange
        DashboardMetricsResponse mockResponse = DashboardMetricsResponse.builder()
                .plantStageDistribution(DashboardMetricsResponse.PlantStageDistribution.builder()
                        .seedlingCount(5L)
                        .vegetativeCount(10L)
                        .floweringCount(8L)
                        .harvestCount(2L)
                        .totalActive(23L)
                        .build())
                .issueSummary(DashboardMetricsResponse.IssueSummary.builder()
                        .totalIssues(3L)
                        .unresolvedIssues(1L)
                        .recentIssues(2L)
                        .trend("stable")
                        .build())
                .environmentalQuality(List.of())
                .recentActivities(List.of())
                .build();

        when(analyticsService.getDashboardMetrics(any(User.class))).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(get("/api/analytics/dashboard")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.plantStageDistribution.seedlingCount").value(5))
                .andExpect(jsonPath("$.plantStageDistribution.vegetativeCount").value(10))
                .andExpect(jsonPath("$.issueSummary.totalIssues").value(3));
    }

    @Test
    void testGetDashboardMetrics_Unauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/analytics/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void testGetEnvironmentalTrends_WithAllParameters() throws Exception {
        // Arrange
        EnvironmentalTrendsResponse mockResponse = EnvironmentalTrendsResponse.builder()
                .dataPoints(List.of())
                .summary(null)
                .stageComparison(null)
                .build();

        when(analyticsService.getEnvironmentalTrends(
                eq(testGrowId),
                any(LocalDateTime.class),
                any(LocalDateTime.class),
                eq("daily"),
                any(User.class)
        )).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(get("/api/analytics/environmental")
                        .param("growId", testGrowId.toString())
                        .param("startDate", "2024-01-01")
                        .param("endDate", "2024-01-31")
                        .param("aggregation", "daily")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void testGetEnvironmentalTrends_WithDefaultDates() throws Exception {
        // Arrange
        EnvironmentalTrendsResponse mockResponse = EnvironmentalTrendsResponse.builder()
                .dataPoints(List.of())
                .build();

        when(analyticsService.getEnvironmentalTrends(
                eq(testGrowId),
                any(LocalDateTime.class),
                any(LocalDateTime.class),
                eq("daily"),
                any(User.class)
        )).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(get("/api/analytics/environmental")
                        .param("growId", testGrowId.toString())
                        .with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void testGetFeedingAnalytics_WithGrowId() throws Exception {
        // Arrange
        FeedingAnalyticsResponse mockResponse = FeedingAnalyticsResponse.builder()
                .phTrend(List.of())
                .ecTrend(List.of())
                .feedingTimeline(List.of())
                .build();

        when(analyticsService.getFeedingAnalytics(
                eq(testGrowId),
                isNull(),
                any(LocalDateTime.class),
                any(LocalDateTime.class),
                any(User.class)
        )).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(get("/api/analytics/feeding")
                        .param("growId", testGrowId.toString())
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void testGetFeedingAnalytics_WithPlantId() throws Exception {
        // Arrange
        FeedingAnalyticsResponse mockResponse = FeedingAnalyticsResponse.builder()
                .phTrend(List.of())
                .ecTrend(List.of())
                .build();

        when(analyticsService.getFeedingAnalytics(
                isNull(),
                eq(testPlantId),
                any(LocalDateTime.class),
                any(LocalDateTime.class),
                any(User.class)
        )).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(get("/api/analytics/feeding")
                        .param("plantId", testPlantId.toString())
                        .with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void testGetFeedingAnalytics_MissingBothIds_BadRequest() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/analytics/feeding")
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void testGetCultivarComparison_Success() throws Exception {
        // Arrange
        UUID cultivar1 = UUID.randomUUID();
        UUID cultivar2 = UUID.randomUUID();

        CultivarComparisonResponse mockResponse = CultivarComparisonResponse.builder()
                .cultivars(List.of())
                .bestPerformers(null)
                .build();

        when(analyticsService.getCultivarComparison(anyList(), any(User.class)))
                .thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(get("/api/analytics/cultivars/compare")
                        .param("cultivarIds", cultivar1.toString(), cultivar2.toString())
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void testGetYieldAnalytics_WithDateRange() throws Exception {
        // Arrange
        YieldAnalyticsResponse mockResponse = YieldAnalyticsResponse.builder()
                .yieldTrend(List.of())
                .topPerformers(List.of())
                .build();

        when(analyticsService.getYieldAnalytics(
                any(LocalDate.class),
                any(LocalDate.class),
                any(User.class)
        )).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(get("/api/analytics/yield")
                        .param("startDate", "2024-01-01")
                        .param("endDate", "2024-12-31")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void testGetYieldAnalytics_WithDefaultDates() throws Exception {
        // Arrange
        YieldAnalyticsResponse mockResponse = YieldAnalyticsResponse.builder()
                .yieldTrend(List.of())
                .build();

        when(analyticsService.getYieldAnalytics(
                any(LocalDate.class),
                any(LocalDate.class),
                any(User.class)
        )).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(get("/api/analytics/yield")
                        .with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void testGetTimelineEvents_Success() throws Exception {
        // Arrange
        TimelineEventResponse mockResponse = TimelineEventResponse.builder()
                .events(List.of())
                .milestones(List.of())
                .photos(List.of())
                .build();

        when(analyticsService.getTimelineEvents(
                eq(testGrowId),
                any(LocalDateTime.class),
                any(LocalDateTime.class),
                any(),
                any(User.class)
        )).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(get("/api/analytics/timeline")
                        .param("growId", testGrowId.toString())
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void testGetTimelineEvents_WithDateRange() throws Exception {
        // Arrange
        TimelineEventResponse mockResponse = TimelineEventResponse.builder()
                .events(List.of())
                .build();

        when(analyticsService.getTimelineEvents(
                eq(testGrowId),
                any(LocalDateTime.class),
                any(LocalDateTime.class),
                any(),
                any(User.class)
        )).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(get("/api/analytics/timeline")
                        .param("growId", testGrowId.toString())
                        .param("startDate", "2024-01-01T00:00:00")
                        .param("endDate", "2024-01-31T23:59:59")
                        .with(csrf()))
                .andExpect(status().isOk());
    }
}