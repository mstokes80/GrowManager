package com.growmanager.controller;

import com.growmanager.dto.*;
import com.growmanager.entity.User;
import com.growmanager.exception.ResourceNotFoundException;
import com.growmanager.repository.UserRepository;
import com.growmanager.security.UserPrincipal;
import com.growmanager.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for analytics operations.
 * Provides endpoints for dashboard metrics, environmental trends,
 * feeding analytics, cultivar comparisons, yield analytics, and timeline events.
 */
@RestController
@RequestMapping("/api/analytics")
@Tag(name = "Analytics", description = "Analytics and reporting endpoints")
@SecurityRequirement(name = "bearerAuth")
public class AnalyticsController {

    private static final Logger logger = LoggerFactory.getLogger(AnalyticsController.class);

    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;

    public AnalyticsController(AnalyticsService analyticsService, UserRepository userRepository) {
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
    }

    /**
     * Helper method to get the current user from the database.
     */
    private User getCurrentUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + principal.getId()));
    }

    /**
     * Get dashboard metrics for the authenticated user.
     *
     * @param principal the authenticated user
     * @return dashboard metrics including environmental quality, plant distribution, and recent activities
     */
    @GetMapping("/dashboard")
    @Operation(
            summary = "Get dashboard metrics",
            description = "Retrieve comprehensive dashboard metrics including environmental quality, " +
                    "plant stage distribution, issue summary, and recent activities"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Dashboard metrics retrieved successfully",
                    content = @Content(schema = @Schema(implementation = DashboardMetricsResponse.class))
            ),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<DashboardMetricsResponse> getDashboardMetrics(
            @AuthenticationPrincipal UserPrincipal principal) {

        logger.info("Get dashboard metrics request from user {}", principal.getId());

        DashboardMetricsResponse response = analyticsService.getDashboardMetrics(getCurrentUser(principal));

        return ResponseEntity.ok(response);
    }

    /**
     * Get environmental trends for a specific grow.
     *
     * @param growId      the grow ID
     * @param startDate   start of time range
     * @param endDate     end of time range
     * @param aggregation aggregation level (hourly, daily, weekly, monthly)
     * @param principal   the authenticated user
     * @return environmental trends with time-series data and statistical summaries
     */
    @GetMapping("/environmental")
    @Operation(
            summary = "Get environmental trends",
            description = "Retrieve environmental trends with aggregated time-series data for temperature, " +
                    "humidity, VPD, CO2, and light. Supports multiple aggregation levels."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Environmental trends retrieved successfully",
                    content = @Content(schema = @Schema(implementation = EnvironmentalTrendsResponse.class))
            ),
            @ApiResponse(responseCode = "400", description = "Invalid parameters"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Grow not found")
    })
    public ResponseEntity<EnvironmentalTrendsResponse> getEnvironmentalTrends(
            @Parameter(description = "Grow ID", required = true)
            @RequestParam UUID growId,

            @Parameter(description = "Start date (ISO 8601 format, e.g., 2025-01-01)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @Parameter(description = "End date (ISO 8601 format, e.g., 2025-01-31)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,

            @Parameter(description = "Aggregation level: hourly, daily, weekly, monthly")
            @RequestParam(defaultValue = "daily") String aggregation,

            @AuthenticationPrincipal UserPrincipal principal) {

        logger.info("Get environmental trends for grow {} from {} to {} with {} aggregation",
                growId, startDate, endDate, aggregation);

        // Default to last 30 days if not specified, convert to LocalDateTime
        LocalDateTime startDateTime;
        LocalDateTime endDateTime;

        if (startDate == null) {
            startDateTime = LocalDateTime.now().minusDays(30).withHour(0).withMinute(0).withSecond(0);
        } else {
            startDateTime = startDate.atStartOfDay();
        }

        if (endDate == null) {
            endDateTime = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        } else {
            endDateTime = endDate.atTime(23, 59, 59);
        }

        EnvironmentalTrendsResponse response = analyticsService.getEnvironmentalTrends(
                growId,
                startDateTime,
                endDateTime,
                aggregation,
                getCurrentUser(principal)
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Get feeding analytics for a grow or specific plant.
     *
     * @param growId    the grow ID
     * @param plantId   the plant ID (optional)
     * @param startDate start of time range
     * @param endDate   end of time range
     * @param principal the authenticated user
     * @return feeding analytics with nutrient tracking and efficiency metrics
     */
    @GetMapping("/feeding")
    @Operation(
            summary = "Get feeding analytics",
            description = "Retrieve feeding analytics including nutrient input totals, efficiency metrics, " +
                    "and pH/EC trends over time"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Feeding analytics retrieved successfully",
                    content = @Content(schema = @Schema(implementation = FeedingAnalyticsResponse.class))
            ),
            @ApiResponse(responseCode = "400", description = "Invalid parameters"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Grow or plant not found")
    })
    public ResponseEntity<FeedingAnalyticsResponse> getFeedingAnalytics(
            @Parameter(description = "Grow ID")
            @RequestParam(required = false) UUID growId,

            @Parameter(description = "Plant ID (optional, filters to specific plant)")
            @RequestParam(required = false) UUID plantId,

            @Parameter(description = "Start date (ISO 8601 format, e.g., 2025-01-01)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @Parameter(description = "End date (ISO 8601 format, e.g., 2025-01-31)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,

            @AuthenticationPrincipal UserPrincipal principal) {

        logger.info("Get feeding analytics for grow {} plant {} from {} to {}",
                growId, plantId, startDate, endDate);

        // Require at least growId or plantId
        if (growId == null && plantId == null) {
            throw new IllegalArgumentException("Either growId or plantId must be provided");
        }

        // Convert LocalDate to LocalDateTime with proper time boundaries
        LocalDateTime startDateTime;
        LocalDateTime endDateTime;

        if (startDate == null) {
            startDateTime = LocalDateTime.of(2000, 1, 1, 0, 0);
        } else {
            startDateTime = startDate.atStartOfDay();
        }

        if (endDate == null) {
            endDateTime = LocalDateTime.now();
        } else {
            endDateTime = endDate.atTime(23, 59, 59);
        }

        FeedingAnalyticsResponse response = analyticsService.getFeedingAnalytics(
                growId,
                plantId,
                startDateTime,
                endDateTime,
                getCurrentUser(principal)
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Get cultivar comparison analytics.
     *
     * @param cultivarIds list of cultivar IDs to compare (2-4)
     * @param principal   the authenticated user
     * @return cultivar comparison with performance metrics and best performers
     */
    @GetMapping("/cultivars/compare")
    @Operation(
            summary = "Compare cultivars",
            description = "Compare 2-4 cultivars side-by-side across yield, growth speed, ease of cultivation, " +
                    "and environmental preferences"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Cultivar comparison retrieved successfully",
                    content = @Content(schema = @Schema(implementation = CultivarComparisonResponse.class))
            ),
            @ApiResponse(responseCode = "400", description = "Invalid number of cultivars (must be 2-4)"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "One or more cultivars not found")
    })
    public ResponseEntity<CultivarComparisonResponse> getCultivarComparison(
            @Parameter(description = "List of cultivar IDs to compare (2-4)", required = true)
            @RequestParam List<UUID> cultivarIds,

            @AuthenticationPrincipal UserPrincipal principal) {

        logger.info("Get cultivar comparison for {} cultivars", cultivarIds.size());

        CultivarComparisonResponse response = analyticsService.getCultivarComparison(
                cultivarIds,
                getCurrentUser(principal)
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Get yield analytics.
     *
     * @param startDate start of time range
     * @param endDate   end of time range
     * @param principal the authenticated user
     * @return yield analytics with production efficiency and quality metrics
     */
    @GetMapping("/yield")
    @Operation(
            summary = "Get yield analytics",
            description = "Retrieve yield and production analytics including total yields, efficiency metrics, " +
                    "quality tracking, and top performers"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Yield analytics retrieved successfully",
                    content = @Content(schema = @Schema(implementation = YieldAnalyticsResponse.class))
            ),
            @ApiResponse(responseCode = "400", description = "Invalid parameters"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<YieldAnalyticsResponse> getYieldAnalytics(
            @Parameter(description = "Start date (ISO 8601 format)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @Parameter(description = "End date (ISO 8601 format)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,

            @AuthenticationPrincipal UserPrincipal principal) {

        logger.info("Get yield analytics from {} to {}", startDate, endDate);

        // Default to all time if not specified
        if (startDate == null) {
            startDate = LocalDate.of(2000, 1, 1);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        YieldAnalyticsResponse response = analyticsService.getYieldAnalytics(
                startDate,
                endDate,
                getCurrentUser(principal)
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Get timeline events for a grow.
     *
     * @param growId     the grow ID
     * @param startDate  start of time range
     * @param endDate    end of time range
     * @param eventTypes comma-separated list of event types to filter (optional)
     * @param principal  the authenticated user
     * @return timeline events including activities, milestones, and photos
     */
    @GetMapping("/timeline")
    @Operation(
            summary = "Get timeline events",
            description = "Retrieve timeline events for calendar view including all activities, " +
                    "growth stage milestones, and photo timeline. Optionally filter by event types."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Timeline events retrieved successfully",
                    content = @Content(schema = @Schema(implementation = TimelineEventResponse.class))
            ),
            @ApiResponse(responseCode = "400", description = "Invalid parameters"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Grow not found")
    })
    public ResponseEntity<TimelineEventResponse> getTimelineEvents(
            @Parameter(description = "Grow ID", required = true)
            @RequestParam UUID growId,

            @Parameter(description = "Start date (ISO 8601 format, e.g., 2025-01-01)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @Parameter(description = "End date (ISO 8601 format, e.g., 2025-01-31)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,

            @Parameter(description = "Comma-separated event types to filter (e.g., feeding,watering,training)")
            @RequestParam(required = false) String eventTypes,

            @AuthenticationPrincipal UserPrincipal principal) {

        logger.info("Get timeline events for grow {} from {} to {} with event types: {}",
                growId, startDate, endDate, eventTypes);

        // Default to all time if not specified, convert to LocalDateTime
        LocalDateTime startDateTime;
        LocalDateTime endDateTime;

        if (startDate == null) {
            startDateTime = LocalDateTime.of(2000, 1, 1, 0, 0);
        } else {
            startDateTime = startDate.atStartOfDay();
        }

        if (endDate == null) {
            endDateTime = LocalDateTime.now();
        } else {
            endDateTime = endDate.atTime(23, 59, 59);
        }

        // Parse event types from comma-separated string
        List<String> eventTypesList = null;
        if (eventTypes != null && !eventTypes.trim().isEmpty()) {
            eventTypesList = List.of(eventTypes.split(","));
        }

        TimelineEventResponse response = analyticsService.getTimelineEvents(
                growId,
                startDateTime,
                endDateTime,
                eventTypesList,
                getCurrentUser(principal)
        );

        return ResponseEntity.ok(response);
    }
}