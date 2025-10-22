package com.growmanager.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.growmanager.config.CacheConfig;
import com.growmanager.dto.*;
import com.growmanager.entity.*;
import com.growmanager.exception.ResourceNotFoundException;
import com.growmanager.repository.*;
import com.growmanager.util.EnvironmentalCalculations;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for analytics operations.
 * Implements business logic for dashboard metrics, environmental trends,
 * feeding analytics, cultivar comparisons, yield analytics, and timeline events.
 * Uses Redis caching with 15-minute TTL for expensive queries.
 */
@Service
public class AnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(AnalyticsService.class);

    private final GrowRepository growRepository;
    private final PlantRepository plantRepository;
    private final EnvironmentalSnapshotRepository environmentalSnapshotRepository;
    private final FeedingEventRepository feedingEventRepository;
    private final ActivityLogRepository activityLogRepository;
    private final ObservationRepository observationRepository;
    private final HarvestRepository harvestRepository;
    private final CultivarRepository cultivarRepository;
    private final ObjectMapper objectMapper;

    public AnalyticsService(
            GrowRepository growRepository,
            PlantRepository plantRepository,
            EnvironmentalSnapshotRepository environmentalSnapshotRepository,
            FeedingEventRepository feedingEventRepository,
            ActivityLogRepository activityLogRepository,
            ObservationRepository observationRepository,
            HarvestRepository harvestRepository,
            CultivarRepository cultivarRepository,
            ObjectMapper objectMapper) {
        this.growRepository = growRepository;
        this.plantRepository = plantRepository;
        this.environmentalSnapshotRepository = environmentalSnapshotRepository;
        this.feedingEventRepository = feedingEventRepository;
        this.activityLogRepository = activityLogRepository;
        this.observationRepository = observationRepository;
        this.harvestRepository = harvestRepository;
        this.cultivarRepository = cultivarRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Get dashboard metrics for the authenticated user.
     * Cached with key: analytics:{userId}:dashboard
     *
     * @param user the authenticated user
     * @return dashboard metrics response
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.DASHBOARD_METRICS_CACHE, key = "#user.id")
    public DashboardMetricsResponse getDashboardMetrics(User user) {
        logger.info("Generating dashboard metrics for user {}", user.getId());

        // TODO: Implementation will be added in subsequent tasks
        // This is a placeholder that will be implemented when Task Group 8 requires it

        return DashboardMetricsResponse.builder()
                .environmentalQuality(List.of())
                .plantStageDistribution(DashboardMetricsResponse.PlantStageDistribution.builder()
                        .seedlingCount(0L)
                        .vegetativeCount(0L)
                        .floweringCount(0L)
                        .harvestCount(0L)
                        .totalActive(0L)
                        .build())
                .issueSummary(DashboardMetricsResponse.IssueSummary.builder()
                        .totalIssues(0L)
                        .unresolvedIssues(0L)
                        .recentIssues(0L)
                        .trend("stable")
                        .build())
                .recentActivities(List.of())
                .build();
    }

    /**
     * Get environmental trends for a specific grow and time range.
     * Cached with key: analytics:{userId}:environmental:{growId}:{startDate}:{endDate}:{aggregation}
     *
     * @param growId          the grow ID
     * @param startDate       start of time range
     * @param endDate         end of time range
     * @param aggregation     aggregation level (hourly, daily, weekly, monthly)
     * @param user            the authenticated user
     * @return environmental trends response
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.ENVIRONMENTAL_TRENDS_CACHE,
            key = "#user.id + ':' + #growId + ':' + #startDate + ':' + #endDate + ':' + #aggregation")
    public EnvironmentalTrendsResponse getEnvironmentalTrends(
            UUID growId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String aggregation,
            User user) {

        logger.info("Generating environmental trends for grow {} from {} to {} with {} aggregation",
                growId, startDate, endDate, aggregation);

        // Fetch the grow to get target environmental values
        Grow grow = growRepository.findById(growId)
                .orElseThrow(() -> new ResourceNotFoundException("Grow not found with id: " + growId));

        // Fetch all environmental snapshots for the time range
        List<EnvironmentalSnapshot> snapshots = environmentalSnapshotRepository
                .findByGrowIdAndTimestampBetween(growId, startDate, endDate);

        // Return empty response if no data
        if (snapshots.isEmpty()) {
            logger.debug("No environmental data found for grow {} in the specified time range", growId);
            return EnvironmentalTrendsResponse.builder()
                    .dataPoints(List.of())
                    .summary(null)
                    .stageComparison(null)
                    .build();
        }

        // Aggregate data points based on the aggregation level
        List<EnvironmentalTrendsResponse.DataPoint> dataPoints = aggregateEnvironmentalData(
                snapshots, aggregation);

        // Calculate statistical summary
        EnvironmentalTrendsResponse.StatisticalSummary summary = calculateStatisticalSummary(
                snapshots, dataPoints, grow);

        // Calculate stage comparison if applicable
        EnvironmentalTrendsResponse.StageComparison stageComparison = calculateStageComparison(
                growId, startDate, endDate);

        return EnvironmentalTrendsResponse.builder()
                .dataPoints(dataPoints)
                .summary(summary)
                .stageComparison(stageComparison)
                .build();
    }

    /**
     * Aggregates environmental snapshots into time-based buckets.
     *
     * @param snapshots   the raw environmental snapshots
     * @param aggregation the aggregation level (hourly, daily, weekly, monthly)
     * @return list of aggregated data points
     */
    private List<EnvironmentalTrendsResponse.DataPoint> aggregateEnvironmentalData(
            List<EnvironmentalSnapshot> snapshots, String aggregation) {

        // Group snapshots by time bucket
        Map<LocalDateTime, List<EnvironmentalSnapshot>> buckets = new TreeMap<>();

        for (EnvironmentalSnapshot snapshot : snapshots) {
            LocalDateTime bucketKey = getBucketKey(snapshot.getTimestamp(), aggregation);
            buckets.computeIfAbsent(bucketKey, k -> new ArrayList<>()).add(snapshot);
        }

        // Aggregate each bucket into a data point
        return buckets.entrySet().stream()
                .map(entry -> aggregateBucket(entry.getKey(), entry.getValue(), aggregation))
                .collect(Collectors.toList());
    }

    /**
     * Determines the bucket key for a timestamp based on aggregation level.
     *
     * @param timestamp   the timestamp to bucket
     * @param aggregation the aggregation level
     * @return the bucket key (truncated timestamp)
     */
    private LocalDateTime getBucketKey(LocalDateTime timestamp, String aggregation) {
        switch (aggregation.toLowerCase()) {
            case "hourly":
                return timestamp.truncatedTo(ChronoUnit.HOURS);
            case "daily":
                return timestamp.truncatedTo(ChronoUnit.DAYS);
            case "weekly":
                // Truncate to the start of the week (Monday)
                return timestamp.truncatedTo(ChronoUnit.DAYS)
                        .minusDays(timestamp.getDayOfWeek().getValue() - 1);
            case "monthly":
                return timestamp.truncatedTo(ChronoUnit.DAYS).withDayOfMonth(1);
            default:
                logger.warn("Unknown aggregation level: {}, defaulting to daily", aggregation);
                return timestamp.truncatedTo(ChronoUnit.DAYS);
        }
    }

    /**
     * Aggregates a bucket of snapshots into a single data point.
     *
     * @param bucketKey   the timestamp for this bucket
     * @param snapshots   the snapshots in this bucket
     * @param aggregation the aggregation level
     * @return aggregated data point
     */
    private EnvironmentalTrendsResponse.DataPoint aggregateBucket(
            LocalDateTime bucketKey, List<EnvironmentalSnapshot> snapshots, String aggregation) {

        // Extract values for aggregation
        List<Double> temperatures = extractValues(snapshots, s -> s.getTemperature());
        List<Double> humidities = extractValues(snapshots, s -> s.getHumidity());
        List<Double> vpds = extractValues(snapshots, s -> s.getVpd());
        List<Double> co2Values = extractValues(snapshots, s -> s.getCo2());
        List<Integer> lightValues = extractIntegerValues(snapshots, s -> s.getLightIntensity());
        List<Double> soilMoistureValues = extractValues(snapshots, s -> s.getSoilMoisture());

        return EnvironmentalTrendsResponse.DataPoint.builder()
                .timestamp(bucketKey)
                .temperature(calculateAverage(temperatures))
                .temperatureMin(calculateMin(temperatures))
                .temperatureMax(calculateMax(temperatures))
                .humidity(calculateAverage(humidities))
                .humidityMin(calculateMin(humidities))
                .humidityMax(calculateMax(humidities))
                .vpd(calculateAverage(vpds))
                .co2(calculateAverage(co2Values))
                .light(calculateAverageInteger(lightValues))
                .soilMoisture(calculateAverage(soilMoistureValues))
                .aggregationLevel(aggregation)
                .build();
    }

    /**
     * Extracts double values from snapshots using a value extractor function.
     *
     * @param snapshots       the snapshots to extract from
     * @param valueExtractor  function to extract BigDecimal value from snapshot
     * @return list of non-null double values
     */
    private List<Double> extractValues(List<EnvironmentalSnapshot> snapshots,
                                       java.util.function.Function<EnvironmentalSnapshot, BigDecimal> valueExtractor) {
        return snapshots.stream()
                .map(valueExtractor)
                .filter(Objects::nonNull)
                .map(BigDecimal::doubleValue)
                .collect(Collectors.toList());
    }

    /**
     * Extracts integer values from snapshots using a value extractor function.
     *
     * @param snapshots       the snapshots to extract from
     * @param valueExtractor  function to extract BigDecimal value from snapshot
     * @return list of non-null integer values
     */
    private List<Integer> extractIntegerValues(List<EnvironmentalSnapshot> snapshots,
                                               java.util.function.Function<EnvironmentalSnapshot, BigDecimal> valueExtractor) {
        return snapshots.stream()
                .map(valueExtractor)
                .filter(Objects::nonNull)
                .map(BigDecimal::intValue)
                .collect(Collectors.toList());
    }

    /**
     * Calculates the average of a list of values.
     *
     * @param values the values to average
     * @return the average, or null if no values
     */
    private Double calculateAverage(List<Double> values) {
        if (values.isEmpty()) {
            return null;
        }
        return values.stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);
    }

    /**
     * Calculates the average of a list of integer values.
     *
     * @param values the values to average
     * @return the average as integer, or null if no values
     */
    private Integer calculateAverageInteger(List<Integer> values) {
        if (values.isEmpty()) {
            return null;
        }
        return (int) values.stream()
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);
    }

    /**
     * Calculates the minimum of a list of values.
     *
     * @param values the values to find minimum from
     * @return the minimum, or null if no values
     */
    private Double calculateMin(List<Double> values) {
        if (values.isEmpty()) {
            return null;
        }
        return values.stream()
                .min(Double::compareTo)
                .orElse(null);
    }

    /**
     * Calculates the maximum of a list of values.
     *
     * @param values the values to find maximum from
     * @return the maximum, or null if no values
     */
    private Double calculateMax(List<Double> values) {
        if (values.isEmpty()) {
            return null;
        }
        return values.stream()
                .max(Double::compareTo)
                .orElse(null);
    }

    /**
     * Calculates statistical summary for environmental data.
     *
     * @param snapshots  the raw snapshots
     * @param dataPoints the aggregated data points
     * @param grow       the grow entity with target environmental values
     * @return statistical summary
     */
    private EnvironmentalTrendsResponse.StatisticalSummary calculateStatisticalSummary(
            List<EnvironmentalSnapshot> snapshots,
            List<EnvironmentalTrendsResponse.DataPoint> dataPoints,
            Grow grow) {

        // Extract all values for statistics
        List<Double> temperatures = extractValues(snapshots, s -> s.getTemperature());
        List<Double> humidities = extractValues(snapshots, s -> s.getHumidity());
        List<Double> vpds = extractValues(snapshots, s -> s.getVpd());
        List<Double> co2Values = extractValues(snapshots, s -> s.getCo2());
        List<Integer> lightValues = extractIntegerValues(snapshots, s -> s.getLightIntensity());
        List<Double> soilMoistureValues = extractValues(snapshots, s -> s.getSoilMoisture());

        // Calculate parameter statistics using grow-specific targets with fallback to defaults
        double tempMin = grow.getTargetTempMin() != null
                ? grow.getTargetTempMin().doubleValue()
                : EnvironmentalCalculations.OPTIMAL_TEMP_MIN;
        double tempMax = grow.getTargetTempMax() != null
                ? grow.getTargetTempMax().doubleValue()
                : EnvironmentalCalculations.OPTIMAL_TEMP_MAX;

        double humidityMin = grow.getTargetHumidityMin() != null
                ? grow.getTargetHumidityMin().doubleValue()
                : EnvironmentalCalculations.OPTIMAL_HUMIDITY_MIN;
        double humidityMax = grow.getTargetHumidityMax() != null
                ? grow.getTargetHumidityMax().doubleValue()
                : EnvironmentalCalculations.OPTIMAL_HUMIDITY_MAX;

        EnvironmentalTrendsResponse.ParameterStats tempStats = calculateParameterStats(
                temperatures,
                tempMin,
                tempMax,
                "°C");

        EnvironmentalTrendsResponse.ParameterStats humidityStats = calculateParameterStats(
                humidities,
                humidityMin,
                humidityMax,
                "%");

        EnvironmentalTrendsResponse.ParameterStats vpdStats = calculateParameterStats(
                vpds,
                EnvironmentalCalculations.OPTIMAL_VPD_MIN,
                EnvironmentalCalculations.OPTIMAL_VPD_MAX,
                "kPa");

        EnvironmentalTrendsResponse.ParameterStats co2Stats = calculateParameterStats(
                co2Values,
                EnvironmentalCalculations.OPTIMAL_CO2_MIN,
                EnvironmentalCalculations.OPTIMAL_CO2_MAX,
                "ppm");

        EnvironmentalTrendsResponse.ParameterStats lightStats = calculateParameterStats(
                lightValues.stream().map(Integer::doubleValue).collect(Collectors.toList()),
                (double) EnvironmentalCalculations.OPTIMAL_LIGHT_MIN,
                (double) EnvironmentalCalculations.OPTIMAL_LIGHT_MAX,
                "PPFD");

        // Calculate soil moisture stats (optimal range 10-50 kPa for most plants)
        EnvironmentalTrendsResponse.ParameterStats soilMoistureStats = calculateParameterStats(
                soilMoistureValues,
                10.0,  // Optimal min
                50.0,  // Optimal max
                "kPa");

        // Calculate days out of range (based on raw snapshots, not aggregated data)
        int daysOutOfRange = calculateDaysOutOfRange(snapshots, tempMin, tempMax, humidityMin, humidityMax);

        // Calculate overall stability score (weighted average of all parameter variances)
        Double stabilityScore = calculateOverallStability(tempStats, humidityStats, vpdStats);

        return EnvironmentalTrendsResponse.StatisticalSummary.builder()
                .temperature(tempStats)
                .humidity(humidityStats)
                .vpd(vpdStats)
                .co2(co2Stats)
                .light(lightStats)
                .soilMoisture(soilMoistureStats)
                .daysOutOfRange(daysOutOfRange)
                .stabilityScore(stabilityScore)
                .build();
    }

    /**
     * Calculates statistics for a single parameter.
     *
     * @param values     the parameter values
     * @param optimalMin the minimum optimal value
     * @param optimalMax the maximum optimal value
     * @param unit       the unit of measurement
     * @return parameter statistics
     */
    private EnvironmentalTrendsResponse.ParameterStats calculateParameterStats(
            List<Double> values, double optimalMin, double optimalMax, String unit) {

        if (values.isEmpty()) {
            return null;
        }

        double min = calculateMin(values);
        double max = calculateMax(values);
        double average = calculateAverage(values);

        Double variance = EnvironmentalCalculations.calculateVariance(values, average);
        Double standardDeviation = EnvironmentalCalculations.calculateStandardDeviation(variance);

        EnvironmentalTrendsResponse.OptimalRange optimalRange =
                EnvironmentalTrendsResponse.OptimalRange.builder()
                        .min(optimalMin)
                        .max(optimalMax)
                        .unit(unit)
                        .build();

        return EnvironmentalTrendsResponse.ParameterStats.builder()
                .min(min)
                .max(max)
                .average(average)
                .variance(variance)
                .standardDeviation(standardDeviation)
                .optimalRange(optimalRange)
                .build();
    }

    /**
     * Calculates the number of unique calendar days where environmental conditions were out of optimal range.
     * Uses grow-specific target values for temperature and humidity, with fallbacks to hardcoded defaults.
     * This metric counts unique days based on raw snapshots, not aggregated data, ensuring consistency
     * regardless of the aggregation level used for visualization.
     *
     * @param snapshots   the raw environmental snapshots
     * @param tempMin     the minimum optimal temperature (from grow or default)
     * @param tempMax     the maximum optimal temperature (from grow or default)
     * @param humidityMin the minimum optimal humidity (from grow or default)
     * @param humidityMax the maximum optimal humidity (from grow or default)
     * @return count of unique days out of range
     */
    private int calculateDaysOutOfRange(
            List<EnvironmentalSnapshot> snapshots,
            double tempMin,
            double tempMax,
            double humidityMin,
            double humidityMax) {

        // Collect unique dates (LocalDate) where any parameter was out of range
        Set<LocalDate> daysOutOfRange = snapshots.stream()
                .filter(snapshot -> {
                    // Extract values
                    Double temp = snapshot.getTemperature() != null ? snapshot.getTemperature().doubleValue() : null;
                    Double humidity = snapshot.getHumidity() != null ? snapshot.getHumidity().doubleValue() : null;
                    Double vpd = snapshot.getVpd() != null ? snapshot.getVpd().doubleValue() : null;

                    // Check if temperature is out of grow-specific optimal range
                    boolean tempOutOfRange = temp != null && (temp < tempMin || temp > tempMax);

                    // Check if humidity is out of grow-specific optimal range
                    boolean humidityOutOfRange = humidity != null && (humidity < humidityMin || humidity > humidityMax);

                    // VPD uses standard optimal range (not grow-specific)
                    boolean vpdOutOfRange = vpd != null && !EnvironmentalCalculations.isVpdOptimal(vpd);

                    return tempOutOfRange || humidityOutOfRange || vpdOutOfRange;
                })
                .map(snapshot -> snapshot.getTimestamp().toLocalDate()) // Extract unique dates
                .collect(Collectors.toSet()); // Use Set to ensure uniqueness

        return daysOutOfRange.size();
    }

    /**
     * Calculates overall environmental stability score.
     *
     * @param tempStats     temperature statistics
     * @param humidityStats humidity statistics
     * @param vpdStats      VPD statistics
     * @return overall stability score (0-100)
     */
    private Double calculateOverallStability(
            EnvironmentalTrendsResponse.ParameterStats tempStats,
            EnvironmentalTrendsResponse.ParameterStats humidityStats,
            EnvironmentalTrendsResponse.ParameterStats vpdStats) {

        List<Double> scores = new ArrayList<>();

        // Calculate individual stability scores with appropriate normalizers
        if (tempStats != null && tempStats.getVariance() != null) {
            Double tempScore = EnvironmentalCalculations.calculateStabilityScore(
                    tempStats.getVariance(), 5.0); // Temperature normalizer
            scores.add(tempScore);
        }

        if (humidityStats != null && humidityStats.getVariance() != null) {
            Double humidityScore = EnvironmentalCalculations.calculateStabilityScore(
                    humidityStats.getVariance(), 100.0); // Humidity normalizer
            scores.add(humidityScore);
        }

        if (vpdStats != null && vpdStats.getVariance() != null) {
            Double vpdScore = EnvironmentalCalculations.calculateStabilityScore(
                    vpdStats.getVariance(), 0.3); // VPD normalizer
            scores.add(vpdScore);
        }

        if (scores.isEmpty()) {
            return null;
        }

        // Return weighted average of all stability scores
        return scores.stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);
    }

    /**
     * Calculates stage-based comparison of environmental conditions.
     *
     * @param growId    the grow ID
     * @param startDate start of time range
     * @param endDate   end of time range
     * @return stage comparison, or null if no stage-specific data
     */
    private EnvironmentalTrendsResponse.StageComparison calculateStageComparison(
            UUID growId, LocalDateTime startDate, LocalDateTime endDate) {

        // Get all snapshots for the grow
        List<EnvironmentalSnapshot> snapshots = environmentalSnapshotRepository
                .findByGrowIdAndTimestampBetween(growId, startDate, endDate);

        if (snapshots.isEmpty()) {
            return null;
        }

        // Get plants in different stages
        List<Plant> vegetativePlants = plantRepository.findByGrowIdAndStage(
                growId, Plant.PlantStage.VEGETATIVE);
        List<Plant> floweringPlants = plantRepository.findByGrowIdAndStage(
                growId, Plant.PlantStage.FLOWERING);

        // Calculate averages for each stage
        EnvironmentalTrendsResponse.StageAverages vegAverages = null;
        EnvironmentalTrendsResponse.StageAverages flowerAverages = null;

        if (!vegetativePlants.isEmpty()) {
            vegAverages = calculateStageAverages(snapshots, vegetativePlants);
        }

        if (!floweringPlants.isEmpty()) {
            flowerAverages = calculateStageAverages(snapshots, floweringPlants);
        }

        // Only return comparison if we have data for at least one stage
        if (vegAverages == null && flowerAverages == null) {
            return null;
        }

        return EnvironmentalTrendsResponse.StageComparison.builder()
                .vegetative(vegAverages)
                .flowering(flowerAverages)
                .build();
    }

    /**
     * Calculates average environmental conditions for a specific growth stage.
     *
     * @param snapshots the environmental snapshots
     * @param plants    the plants in this stage
     * @return stage averages
     */
    private EnvironmentalTrendsResponse.StageAverages calculateStageAverages(
            List<EnvironmentalSnapshot> snapshots, List<Plant> plants) {

        // For simplicity, we'll use all snapshots for the grow
        // In a more advanced implementation, we would filter by plant-specific snapshots
        // or by timestamps when plants were in this specific stage

        List<Double> temperatures = extractValues(snapshots, s -> s.getTemperature());
        List<Double> humidities = extractValues(snapshots, s -> s.getHumidity());
        List<Double> vpds = extractValues(snapshots, s -> s.getVpd());
        List<Double> co2Values = extractValues(snapshots, s -> s.getCo2());
        List<Integer> lightValues = extractIntegerValues(snapshots, s -> s.getLightIntensity());
        List<Double> soilMoistureValues = extractValues(snapshots, s -> s.getSoilMoisture());

        return EnvironmentalTrendsResponse.StageAverages.builder()
                .avgTemperature(calculateAverage(temperatures))
                .avgHumidity(calculateAverage(humidities))
                .avgVpd(calculateAverage(vpds))
                .avgCo2(calculateAverage(co2Values))
                .avgLight(calculateAverageInteger(lightValues))
                .avgSoilMoisture(calculateAverage(soilMoistureValues))
                .dataPointCount((long) snapshots.size())
                .build();
    }

    /**
     * Get feeding analytics for a specific grow or plant.
     * Cached with key: analytics:{userId}:feeding:{growId}:{plantId}:{startDate}:{endDate}
     *
     * @param growId    the grow ID (optional if plantId provided)
     * @param plantId   the plant ID (optional if growId provided)
     * @param startDate start of time range
     * @param endDate   end of time range
     * @param user      the authenticated user
     * @return feeding analytics response
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.FEEDING_ANALYTICS_CACHE,
            key = "#user.id + ':' + #growId + ':' + #plantId + ':' + #startDate + ':' + #endDate")
    public FeedingAnalyticsResponse getFeedingAnalytics(
            UUID growId,
            UUID plantId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            User user) {

        logger.info("Generating feeding analytics for grow {} plant {} from {} to {}",
                growId, plantId, startDate, endDate);

        // Fetch feeding events
        List<FeedingEvent> feedingEvents;
        if (plantId != null) {
            feedingEvents = feedingEventRepository.findByPlantIdAndTimeRange(plantId, startDate, endDate);
        } else if (growId != null) {
            feedingEvents = feedingEventRepository.findByGrowIdAndTimeRange(growId, startDate, endDate);
        } else {
            throw new IllegalArgumentException("Either growId or plantId must be provided");
        }

        // Fetch plants for stage-based calculations
        List<Plant> plants = growId != null
                ? plantRepository.findByGrowId(growId)
                : (plantId != null ? List.of(plantRepository.findById(plantId).orElseThrow()) : List.of());

        // Fetch harvests for efficiency calculations
        List<Harvest> harvests = growId != null
                ? harvestRepository.findByGrowIdOrderByHarvestDateDesc(growId)
                : (plantId != null ? harvestRepository.findByPlantId(plantId) : List.of());

        // Calculate nutrient metrics
        FeedingAnalyticsResponse.NutrientMetrics nutrientMetrics = calculateNutrientMetrics(
                feedingEvents, plants, growId);

        // Calculate efficiency metrics
        FeedingAnalyticsResponse.EfficiencyMetrics efficiencyMetrics = calculateEfficiencyMetrics(
                feedingEvents, harvests);

        // Generate pH and EC trends
        List<FeedingAnalyticsResponse.TrendPoint> phTrend = generatePhTrend(feedingEvents, plants);
        List<FeedingAnalyticsResponse.TrendPoint> ecTrend = generateEcTrend(feedingEvents, plants);

        // Generate feeding timeline
        List<FeedingAnalyticsResponse.FeedingEventSummary> feedingTimeline = generateFeedingTimeline(feedingEvents);

        return FeedingAnalyticsResponse.builder()
                .nutrientMetrics(nutrientMetrics)
                .efficiencyMetrics(efficiencyMetrics)
                .phTrend(phTrend)
                .ecTrend(ecTrend)
                .feedingTimeline(feedingTimeline)
                .build();
    }

    /**
     * Calculates nutrient metrics including total EC, averages, and stage breakdowns.
     *
     * @param feedingEvents the feeding events
     * @param plants        the plants in the grow
     * @param growId        the grow ID
     * @return nutrient metrics
     */
    private FeedingAnalyticsResponse.NutrientMetrics calculateNutrientMetrics(
            List<FeedingEvent> feedingEvents, List<Plant> plants, UUID growId) {

        if (feedingEvents.isEmpty()) {
            return FeedingAnalyticsResponse.NutrientMetrics.builder()
                    .totalEc(0.0)
                    .avgEc(null)
                    .avgPh(null)
                    .totalWaterVolume(0.0)
                    .feedingEventCount(0L)
                    .vegetativeAvg(null)
                    .floweringAvg(null)
                    .build();
        }

        // Calculate total EC (sum of all EC values)
        double totalEc = feedingEvents.stream()
                .filter(fe -> fe.getEcLevel() != null)
                .mapToDouble(fe -> fe.getEcLevel().doubleValue())
                .sum();

        // Calculate average EC
        Double avgEc = feedingEvents.stream()
                .filter(fe -> fe.getEcLevel() != null)
                .mapToDouble(fe -> fe.getEcLevel().doubleValue())
                .average()
                .orElse(0.0);

        // Calculate average pH
        Double avgPh = feedingEvents.stream()
                .filter(fe -> fe.getPhLevel() != null)
                .mapToDouble(fe -> fe.getPhLevel().doubleValue())
                .average()
                .orElse(0.0);

        // Calculate total water volume (convert from mL to L)
        double totalWaterVolumeMl = feedingEvents.stream()
                .mapToDouble(fe -> fe.getAmountMl().doubleValue())
                .sum();

        // Calculate stage-specific breakdowns
        FeedingAnalyticsResponse.StageBreakdown vegetativeAvg = null;
        FeedingAnalyticsResponse.StageBreakdown floweringAvg = null;

        if (growId != null) {
            List<Plant> vegPlants = plantRepository.findByGrowIdAndStage(growId, Plant.PlantStage.VEGETATIVE);
            List<Plant> flowerPlants = plantRepository.findByGrowIdAndStage(growId, Plant.PlantStage.FLOWERING);

            if (!vegPlants.isEmpty()) {
                Set<UUID> vegPlantIds = vegPlants.stream().map(Plant::getId).collect(Collectors.toSet());
                List<FeedingEvent> vegEvents = feedingEvents.stream()
                        .filter(fe -> vegPlantIds.contains(fe.getPlant().getId()))
                        .collect(Collectors.toList());
                vegetativeAvg = calculateStageBreakdown(vegEvents);
            }

            if (!flowerPlants.isEmpty()) {
                Set<UUID> flowerPlantIds = flowerPlants.stream().map(Plant::getId).collect(Collectors.toSet());
                List<FeedingEvent> flowerEvents = feedingEvents.stream()
                        .filter(fe -> flowerPlantIds.contains(fe.getPlant().getId()))
                        .collect(Collectors.toList());
                floweringAvg = calculateStageBreakdown(flowerEvents);
            }
        }

        return FeedingAnalyticsResponse.NutrientMetrics.builder()
                .totalEc(totalEc)
                .avgEc(avgEc > 0 ? avgEc : null)
                .avgPh(avgPh > 0 ? avgPh : null)
                .totalWaterVolume(totalWaterVolumeMl)
                .feedingEventCount((long) feedingEvents.size())
                .vegetativeAvg(vegetativeAvg)
                .floweringAvg(floweringAvg)
                .build();
    }

    /**
     * Calculates stage breakdown for feeding events.
     *
     * @param events the feeding events for a specific stage
     * @return stage breakdown
     */
    private FeedingAnalyticsResponse.StageBreakdown calculateStageBreakdown(List<FeedingEvent> events) {
        if (events.isEmpty()) {
            return null;
        }

        Double avgEc = events.stream()
                .filter(fe -> fe.getEcLevel() != null)
                .mapToDouble(fe -> fe.getEcLevel().doubleValue())
                .average()
                .orElse(0.0);

        Double avgPh = events.stream()
                .filter(fe -> fe.getPhLevel() != null)
                .mapToDouble(fe -> fe.getPhLevel().doubleValue())
                .average()
                .orElse(0.0);

        Double avgWaterVolume = events.stream()
                .mapToDouble(fe -> fe.getAmountMl().doubleValue())
                .average()
                .orElse(0.0);

        return FeedingAnalyticsResponse.StageBreakdown.builder()
                .avgEc(avgEc > 0 ? avgEc : null)
                .avgPh(avgPh > 0 ? avgPh : null)
                .avgWaterVolume(avgWaterVolume)
                .eventCount((long) events.size())
                .build();
    }

    /**
     * Calculates efficiency metrics including feed efficiency and water use efficiency.
     *
     * @param feedingEvents the feeding events
     * @param harvests      the harvests
     * @return efficiency metrics
     */
    private FeedingAnalyticsResponse.EfficiencyMetrics calculateEfficiencyMetrics(
            List<FeedingEvent> feedingEvents, List<Harvest> harvests) {

        // Calculate total yield from harvests (use dry weight if available, otherwise wet weight)
        Double totalYield = null;
        if (!harvests.isEmpty()) {
            totalYield = harvests.stream()
                    .mapToDouble(h -> {
                        if (h.getDryWeight() != null) {
                            return h.getDryWeight().doubleValue();
                        } else if (h.getWetWeight() != null) {
                            return h.getWetWeight().doubleValue();
                        }
                        return 0.0;
                    })
                    .sum();
        }

        if (feedingEvents.isEmpty() || totalYield == null || totalYield == 0.0) {
            return FeedingAnalyticsResponse.EfficiencyMetrics.builder()
                    .feedEfficiency(null)
                    .waterUseEfficiency(null)
                    .feedEfficiencyUnit("g/EC")
                    .waterEfficiencyUnit("g/L")
                    .totalYield(totalYield)
                    .build();
        }

        // Calculate total EC input
        double totalEc = feedingEvents.stream()
                .filter(fe -> fe.getEcLevel() != null)
                .mapToDouble(fe -> fe.getEcLevel().doubleValue())
                .sum();

        // Calculate total water volume (mL to L)
        double totalWaterMl = feedingEvents.stream()
                .mapToDouble(fe -> fe.getAmountMl().doubleValue())
                .sum();
        double totalWaterL = totalWaterMl / 1000.0;

        // Calculate Feed Efficiency = Yield ÷ Total EC
        Double feedEfficiency = null;
        if (totalEc > 0) {
            feedEfficiency = BigDecimal.valueOf(totalYield / totalEc)
                    .setScale(2, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        // Calculate Water Use Efficiency = Yield ÷ Total Water (L)
        Double waterUseEfficiency = null;
        if (totalWaterL > 0) {
            waterUseEfficiency = BigDecimal.valueOf(totalYield / totalWaterL)
                    .setScale(2, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        return FeedingAnalyticsResponse.EfficiencyMetrics.builder()
                .feedEfficiency(feedEfficiency)
                .waterUseEfficiency(waterUseEfficiency)
                .feedEfficiencyUnit("g/EC")
                .waterEfficiencyUnit("g/L")
                .totalYield(totalYield)
                .build();
    }

    /**
     * Generates pH trend over time with variance for drift detection.
     *
     * @param feedingEvents the feeding events
     * @param plants        the plants
     * @return pH trend points
     */
    private List<FeedingAnalyticsResponse.TrendPoint> generatePhTrend(
            List<FeedingEvent> feedingEvents, List<Plant> plants) {

        if (feedingEvents.isEmpty()) {
            return List.of();
        }

        // Group by plant stage if plants are available
        Map<Plant.PlantStage, List<FeedingEvent>> eventsByStage = new HashMap<>();

        for (FeedingEvent event : feedingEvents) {
            if (event.getPhLevel() != null) {
                Plant.PlantStage stage = event.getPlant().getStage();
                eventsByStage.computeIfAbsent(stage, k -> new ArrayList<>()).add(event);
            }
        }

        // Create trend points for each stage
        List<FeedingAnalyticsResponse.TrendPoint> trendPoints = new ArrayList<>();

        for (Map.Entry<Plant.PlantStage, List<FeedingEvent>> entry : eventsByStage.entrySet()) {
            List<FeedingEvent> stageEvents = entry.getValue();

            // Calculate average pH for this stage
            Double avgPh = stageEvents.stream()
                    .mapToDouble(fe -> fe.getPhLevel().doubleValue())
                    .average()
                    .orElse(0.0);

            // Calculate variance for drift detection
            List<Double> phValues = stageEvents.stream()
                    .map(fe -> fe.getPhLevel().doubleValue())
                    .collect(Collectors.toList());

            Double variance = EnvironmentalCalculations.calculateVariance(phValues, avgPh);

            // Use the most recent timestamp for this stage
            LocalDateTime timestamp = stageEvents.stream()
                    .map(FeedingEvent::getFedAt)
                    .max(LocalDateTime::compareTo)
                    .orElse(LocalDateTime.now());

            trendPoints.add(FeedingAnalyticsResponse.TrendPoint.builder()
                    .timestamp(timestamp)
                    .value(avgPh)
                    .variance(variance)
                    .plantStage(entry.getKey().getValue())
                    .build());
        }

        return trendPoints;
    }

    /**
     * Generates EC trend over time with variance for drift detection.
     *
     * @param feedingEvents the feeding events
     * @param plants        the plants
     * @return EC trend points
     */
    private List<FeedingAnalyticsResponse.TrendPoint> generateEcTrend(
            List<FeedingEvent> feedingEvents, List<Plant> plants) {

        if (feedingEvents.isEmpty()) {
            return List.of();
        }

        // Group by plant stage if plants are available
        Map<Plant.PlantStage, List<FeedingEvent>> eventsByStage = new HashMap<>();

        for (FeedingEvent event : feedingEvents) {
            if (event.getEcLevel() != null) {
                Plant.PlantStage stage = event.getPlant().getStage();
                eventsByStage.computeIfAbsent(stage, k -> new ArrayList<>()).add(event);
            }
        }

        // Create trend points for each stage
        List<FeedingAnalyticsResponse.TrendPoint> trendPoints = new ArrayList<>();

        for (Map.Entry<Plant.PlantStage, List<FeedingEvent>> entry : eventsByStage.entrySet()) {
            List<FeedingEvent> stageEvents = entry.getValue();

            // Calculate average EC for this stage
            Double avgEc = stageEvents.stream()
                    .mapToDouble(fe -> fe.getEcLevel().doubleValue())
                    .average()
                    .orElse(0.0);

            // Calculate variance for drift detection
            List<Double> ecValues = stageEvents.stream()
                    .map(fe -> fe.getEcLevel().doubleValue())
                    .collect(Collectors.toList());

            Double variance = EnvironmentalCalculations.calculateVariance(ecValues, avgEc);

            // Use the most recent timestamp for this stage
            LocalDateTime timestamp = stageEvents.stream()
                    .map(FeedingEvent::getFedAt)
                    .max(LocalDateTime::compareTo)
                    .orElse(LocalDateTime.now());

            trendPoints.add(FeedingAnalyticsResponse.TrendPoint.builder()
                    .timestamp(timestamp)
                    .value(avgEc)
                    .variance(variance)
                    .plantStage(entry.getKey().getValue())
                    .build());
        }

        return trendPoints;
    }

    /**
     * Generates feeding timeline for visualization.
     *
     * @param feedingEvents the feeding events
     * @return feeding event summaries
     */
    private List<FeedingAnalyticsResponse.FeedingEventSummary> generateFeedingTimeline(
            List<FeedingEvent> feedingEvents) {

        return feedingEvents.stream()
                .sorted(Comparator.comparing(FeedingEvent::getFedAt).reversed())
                .limit(50) // Limit to most recent 50 events
                .map(fe -> FeedingAnalyticsResponse.FeedingEventSummary.builder()
                        .id(fe.getId().toString())
                        .timestamp(fe.getFedAt())
                        .plantId(fe.getPlant().getId().toString())
                        .plantTag(fe.getPlant().getTag())
                        .ec(fe.getEcLevel() != null ? fe.getEcLevel().doubleValue() : null)
                        .ph(fe.getPhLevel() != null ? fe.getPhLevel().doubleValue() : null)
                        .waterVolume(fe.getAmountMl().doubleValue())
                        .feedingType(fe.getFeedingType().getValue())
                        .nutrients(fe.getNutrientMix() != null ? List.of(fe.getNutrientMix()) : List.of())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Get cultivar comparison analytics.
     * Cached with key: analytics:{userId}:cultivar:{cultivarIds}
     *
     * @param cultivarIds list of cultivar IDs to compare (2-4)
     * @param user        the authenticated user
     * @return cultivar comparison response
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.CULTIVAR_COMPARISON_CACHE,
            key = "#user.id + ':' + #cultivarIds.toString()")
    public CultivarComparisonResponse getCultivarComparison(List<UUID> cultivarIds, User user) {
        logger.info("Generating cultivar comparison for {} cultivars", cultivarIds.size());

        if (cultivarIds.size() < 2 || cultivarIds.size() > 4) {
            throw new IllegalArgumentException("Cultivar comparison requires 2-4 cultivars");
        }

        // Fetch cultivar data and calculate metrics for each
        List<CultivarComparisonResponse.CultivarMetrics> cultivarMetrics = new ArrayList<>();

        for (UUID cultivarId : cultivarIds) {
            Cultivar cultivar = cultivarRepository.findById(cultivarId)
                    .orElseThrow(() -> new ResourceNotFoundException("Cultivar not found: " + cultivarId));

            // Get all plants for this cultivar
            List<Plant> plants = plantRepository.findByCultivarId(cultivarId);

            if (plants.isEmpty()) {
                logger.warn("No plants found for cultivar {}, skipping", cultivarId);
                continue;
            }

            // Calculate metrics
            CultivarComparisonResponse.CultivarMetrics metrics = calculateCultivarMetrics(cultivar, plants);
            cultivarMetrics.add(metrics);
        }

        // Identify best performers
        CultivarComparisonResponse.BestPerformers bestPerformers = identifyBestPerformers(cultivarMetrics);

        return CultivarComparisonResponse.builder()
                .cultivars(cultivarMetrics)
                .bestPerformers(bestPerformers)
                .build();
    }

    /**
     * Calculates comprehensive metrics for a single cultivar.
     *
     * @param cultivar the cultivar
     * @param plants   all plants of this cultivar
     * @return cultivar metrics
     */
    private CultivarComparisonResponse.CultivarMetrics calculateCultivarMetrics(Cultivar cultivar, List<Plant> plants) {
        // Get all harvests for these plants
        List<Harvest> allHarvests = new ArrayList<>();
        for (Plant plant : plants) {
            allHarvests.addAll(harvestRepository.findByPlantId(plant.getId()));
        }

        // Calculate performance metrics
        CultivarComparisonResponse.PerformanceMetrics performance = calculateCultivarPerformance(plants, allHarvests);

        // Calculate environmental preferences
        CultivarComparisonResponse.EnvironmentalPreferences environmentalPreferences =
                calculateEnvironmentalPreferences(plants);

        // Calculate quality metrics
        CultivarComparisonResponse.QualityMetrics quality = calculateCultivarQuality(allHarvests);

        // Count unique grows
        int totalGrows = (int) plants.stream()
                .map(p -> p.getGrow().getId())
                .distinct()
                .count();

        return CultivarComparisonResponse.CultivarMetrics.builder()
                .cultivarId(cultivar.getId().toString())
                .cultivarName(cultivar.getName())
                .type(cultivar.getType().getValue())
                .performance(performance)
                .environmentalPreferences(environmentalPreferences)
                .quality(quality)
                .totalGrows(totalGrows)
                .totalPlants(plants.size())
                .build();
    }

    /**
     * Calculates performance metrics for a cultivar.
     *
     * @param plants   all plants of the cultivar
     * @param harvests all harvests for the cultivar
     * @return performance metrics
     */
    private CultivarComparisonResponse.PerformanceMetrics calculateCultivarPerformance(
            List<Plant> plants, List<Harvest> harvests) {

        Double avgYieldPerPlant = null;
        Double wetToDryRatio = null;
        Integer avgDaysToHarvest = null;

        if (!harvests.isEmpty()) {
            // Calculate average yield per plant
            double totalYield = harvests.stream()
                    .mapToDouble(h -> {
                        if (h.getDryWeight() != null) {
                            return h.getDryWeight().doubleValue();
                        } else if (h.getWetWeight() != null) {
                            return h.getWetWeight().doubleValue();
                        }
                        return 0.0;
                    })
                    .sum();

            int harvestedPlantCount = (int) harvests.stream()
                    .map(h -> h.getPlant().getId())
                    .distinct()
                    .count();

            avgYieldPerPlant = harvestedPlantCount > 0 ? totalYield / harvestedPlantCount : 0.0;

            // Calculate wet to dry ratio
            Double avgWetWeight = harvests.stream()
                    .filter(h -> h.getWetWeight() != null)
                    .mapToDouble(h -> h.getWetWeight().doubleValue())
                    .average()
                    .orElse(0.0);

            Double avgDryWeight = harvests.stream()
                    .filter(h -> h.getDryWeight() != null)
                    .mapToDouble(h -> h.getDryWeight().doubleValue())
                    .average()
                    .orElse(0.0);

            if (avgDryWeight != null && avgDryWeight > 0 && avgWetWeight != null && avgWetWeight > 0) {
                wetToDryRatio = BigDecimal.valueOf(avgWetWeight / avgDryWeight)
                        .setScale(2, RoundingMode.HALF_UP)
                        .doubleValue();
            }

            // Calculate average days to harvest
            List<Integer> daysToHarvest = harvests.stream()
                    .filter(h -> h.getPlant().getPlantedDate() != null)
                    .map(h -> (int) ChronoUnit.DAYS.between(h.getPlant().getPlantedDate(), h.getHarvestDate()))
                    .collect(Collectors.toList());

            if (!daysToHarvest.isEmpty()) {
                avgDaysToHarvest = (int) daysToHarvest.stream()
                        .mapToInt(Integer::intValue)
                        .average()
                        .orElse(0.0);
            }
        }

        // Calculate success rate
        Double successRate = null;
        if (!plants.isEmpty()) {
            long harvestedPlants = harvests.stream()
                    .map(h -> h.getPlant().getId())
                    .distinct()
                    .count();
            successRate = BigDecimal.valueOf((double) harvestedPlants / plants.size() * 100.0)
                    .setScale(2, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        // Calculate ease of growth score (based on issues/pest control activities)
        Double easeOfGrowthScore = calculateEaseOfGrowthScore(plants);

        // Placeholder for yield per sq ft (would need grow area data)
        Double avgYieldPerSqFt = null;

        return CultivarComparisonResponse.PerformanceMetrics.builder()
                .avgYieldPerPlant(avgYieldPerPlant)
                .avgYieldPerSqFt(avgYieldPerSqFt)
                .successRate(successRate)
                .easeOfGrowthScore(easeOfGrowthScore)
                .avgDaysToHarvest(avgDaysToHarvest)
                .wetToDryRatio(wetToDryRatio)
                .build();
    }

    /**
     * Calculates ease of growth score based on issues and pest control activities.
     * Score of 100 = no issues, lower scores indicate more problems.
     *
     * @param plants the plants to analyze
     * @return ease of growth score (0-100)
     */
    private Double calculateEaseOfGrowthScore(List<Plant> plants) {
        int totalIssues = 0;
        int totalPlants = plants.size();

        for (Plant plant : plants) {
            // Count pest control and disease-related activities
            List<ActivityLog> activities = activityLogRepository.findByPlantId(plant.getId());
            long issueCount = activities.stream()
                    .filter(a -> a.getActivityType() == ActivityLog.ActivityType.PEST_CONTROL)
                    .count();
            totalIssues += issueCount;
        }

        // Calculate score: 100 - (issues per plant * penalty)
        // Each issue reduces score by 10 points, minimum score is 0
        double issuesPerPlant = totalPlants > 0 ? (double) totalIssues / totalPlants : 0;
        double score = Math.max(0, 100.0 - (issuesPerPlant * 10.0));

        return BigDecimal.valueOf(score)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    /**
     * Calculates optimal environmental conditions for a cultivar.
     *
     * @param plants all plants of the cultivar
     * @return environmental preferences
     */
    private CultivarComparisonResponse.EnvironmentalPreferences calculateEnvironmentalPreferences(List<Plant> plants) {
        List<EnvironmentalSnapshot> allSnapshots = new ArrayList<>();

        // Gather environmental data from all grows
        for (Plant plant : plants) {
            List<EnvironmentalSnapshot> snapshots = environmentalSnapshotRepository
                    .findByGrowIdAndTimestampBetween(
                            plant.getGrow().getId(),
                            plant.getGrow().getStartDate().atStartOfDay(),
                            plant.getGrow().getEndDate() != null
                                    ? plant.getGrow().getEndDate().atTime(23, 59)
                                    : LocalDateTime.now()
                    );
            allSnapshots.addAll(snapshots);
        }

        if (allSnapshots.isEmpty()) {
            return null;
        }

        // Calculate averages
        List<Double> temperatures = extractValues(allSnapshots, s -> s.getTemperature());
        List<Double> humidities = extractValues(allSnapshots, s -> s.getHumidity());
        List<Double> vpds = extractValues(allSnapshots, s -> s.getVpd());
        List<Double> co2Values = extractValues(allSnapshots, s -> s.getCo2());
        List<Integer> lightValues = extractIntegerValues(allSnapshots, s -> s.getLightIntensity());

        return CultivarComparisonResponse.EnvironmentalPreferences.builder()
                .optimalTemperature(calculateAverage(temperatures))
                .optimalHumidity(calculateAverage(humidities))
                .optimalVpd(calculateAverage(vpds))
                .optimalCo2(calculateAverage(co2Values) != null ? calculateAverage(co2Values).intValue() : null)
                .optimalLight(calculateAverageInteger(lightValues))
                .build();
    }

    /**
     * Calculates quality metrics for a cultivar.
     *
     * @param harvests all harvests for the cultivar
     * @return quality metrics
     */
    private CultivarComparisonResponse.QualityMetrics calculateCultivarQuality(List<Harvest> harvests) {
        if (harvests.isEmpty()) {
            return null;
        }

        // Calculate average potency
        Double avgPotency = harvests.stream()
                .filter(h -> h.getThcPercent() != null)
                .mapToDouble(h -> h.getThcPercent().doubleValue())
                .average()
                .orElse(0.0);

        // Calculate average quality score
        Double avgQualityScore = harvests.stream()
                .filter(h -> h.getQualityRating() != null)
                .mapToDouble(h -> h.getQualityRating().doubleValue())
                .average()
                .orElse(0.0);

        return CultivarComparisonResponse.QualityMetrics.builder()
                .avgPotency(avgPotency > 0 ? avgPotency : null)
                .avgQualityScore(avgQualityScore > 0 ? avgQualityScore : null)
                .dominantTerpene(null) // Would need terpene profile parsing
                .defectCounts(new HashMap<>()) // Would need defect tracking
                .build();
    }

    /**
     * Identifies the best performing cultivar in each category.
     *
     * @param cultivarMetrics list of all cultivar metrics
     * @return best performers
     */
    private CultivarComparisonResponse.BestPerformers identifyBestPerformers(
            List<CultivarComparisonResponse.CultivarMetrics> cultivarMetrics) {

        if (cultivarMetrics.isEmpty()) {
            return null;
        }

        // Find highest yield
        String highestYield = cultivarMetrics.stream()
                .filter(m -> m.getPerformance() != null && m.getPerformance().getAvgYieldPerPlant() != null)
                .max(Comparator.comparing(m -> m.getPerformance().getAvgYieldPerPlant()))
                .map(CultivarComparisonResponse.CultivarMetrics::getCultivarId)
                .orElse(null);

        // Find fastest growth
        String fastestGrowth = cultivarMetrics.stream()
                .filter(m -> m.getPerformance() != null && m.getPerformance().getAvgDaysToHarvest() != null)
                .min(Comparator.comparing(m -> m.getPerformance().getAvgDaysToHarvest()))
                .map(CultivarComparisonResponse.CultivarMetrics::getCultivarId)
                .orElse(null);

        // Find easiest to grow
        String easiestToGrow = cultivarMetrics.stream()
                .filter(m -> m.getPerformance() != null && m.getPerformance().getEaseOfGrowthScore() != null)
                .max(Comparator.comparing(m -> m.getPerformance().getEaseOfGrowthScore()))
                .map(CultivarComparisonResponse.CultivarMetrics::getCultivarId)
                .orElse(null);

        // Find highest quality
        String highestQuality = cultivarMetrics.stream()
                .filter(m -> m.getQuality() != null && m.getQuality().getAvgQualityScore() != null)
                .max(Comparator.comparing(m -> m.getQuality().getAvgQualityScore()))
                .map(CultivarComparisonResponse.CultivarMetrics::getCultivarId)
                .orElse(null);

        return CultivarComparisonResponse.BestPerformers.builder()
                .highestYield(highestYield)
                .fastestGrowth(fastestGrowth)
                .easiestToGrow(easiestToGrow)
                .highestQuality(highestQuality)
                .build();
    }

    /**
     * Get yield analytics for the authenticated user.
     * Cached with key: analytics:{userId}:yield:{startDate}:{endDate}
     *
     * @param startDate start of time range
     * @param endDate   end of time range
     * @param user      the authenticated user
     * @return yield analytics response
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.YIELD_ANALYTICS_CACHE,
            key = "#user.id + ':' + #startDate + ':' + #endDate")
    public YieldAnalyticsResponse getYieldAnalytics(
            LocalDate startDate,
            LocalDate endDate,
            User user) {

        logger.info("Generating yield analytics from {} to {}", startDate, endDate);

        // Fetch all harvests for the user
        List<Harvest> allHarvests = harvestRepository.findAll();

        // Filter by user and date range
        List<Harvest> filteredHarvests = allHarvests.stream()
                .filter(h -> h.getGrow().getUser().getId().equals(user.getId()))
                .filter(h -> !h.getHarvestDate().isBefore(startDate) && !h.getHarvestDate().isAfter(endDate))
                .collect(Collectors.toList());

        // Fetch all plants for the user (for success rate calculation)
        List<Plant> allPlants = plantRepository.findAll().stream()
                .filter(p -> p.getGrow().getUser().getId().equals(user.getId()))
                .collect(Collectors.toList());

        // Calculate yield metrics
        YieldAnalyticsResponse.YieldMetrics yieldMetrics = calculateYieldMetrics(filteredHarvests, allPlants);

        // Calculate production efficiency
        YieldAnalyticsResponse.ProductionEfficiency productionEfficiency = calculateProductionEfficiency(
                filteredHarvests, allPlants);

        // Calculate quality tracking
        YieldAnalyticsResponse.QualityTracking qualityTracking = calculateQualityTracking(filteredHarvests);

        // Generate yield trend
        List<YieldAnalyticsResponse.YieldTrendPoint> yieldTrend = generateYieldTrend(filteredHarvests);

        // Identify top performers
        List<YieldAnalyticsResponse.TopPerformer> topPerformers = identifyTopPerformers(filteredHarvests);

        return YieldAnalyticsResponse.builder()
                .yieldMetrics(yieldMetrics)
                .productionEfficiency(productionEfficiency)
                .qualityTracking(qualityTracking)
                .yieldTrend(yieldTrend)
                .topPerformers(topPerformers)
                .build();
    }

    /**
     * Calculates yield metrics including total yield, averages, and ratios.
     *
     * @param harvests the harvests
     * @param plants   all plants
     * @return yield metrics
     */
    private YieldAnalyticsResponse.YieldMetrics calculateYieldMetrics(
            List<Harvest> harvests, List<Plant> plants) {

        if (harvests.isEmpty()) {
            return YieldAnalyticsResponse.YieldMetrics.builder()
                    .totalYield(null)
                    .avgYieldPerPlant(null)
                    .avgYieldPerCultivar(null)
                    .avgYieldPerGrow(null)
                    .avgWetWeight(null)
                    .avgDryWeight(null)
                    .avgWetToDryRatio(null)
                    .totalHarvests(0)
                    .totalPlantsHarvested(0)
                    .build();
        }

        // Calculate total yield (dry weight if available, otherwise wet weight)
        double totalYield = harvests.stream()
                .mapToDouble(h -> {
                    if (h.getDryWeight() != null) {
                        return h.getDryWeight().doubleValue();
                    } else if (h.getWetWeight() != null) {
                        return h.getWetWeight().doubleValue();
                    }
                    return 0.0;
                })
                .sum();

        // Calculate averages
        Double avgWetWeight = harvests.stream()
                .filter(h -> h.getWetWeight() != null)
                .mapToDouble(h -> h.getWetWeight().doubleValue())
                .average()
                .orElse(0.0);

        Double avgDryWeight = harvests.stream()
                .filter(h -> h.getDryWeight() != null)
                .mapToDouble(h -> h.getDryWeight().doubleValue())
                .average()
                .orElse(0.0);

        // Calculate wet to dry ratio
        Double avgWetToDryRatio = null;
        if (avgDryWeight != null && avgDryWeight > 0 && avgWetWeight != null && avgWetWeight > 0) {
            avgWetToDryRatio = BigDecimal.valueOf(avgWetWeight / avgDryWeight)
                    .setScale(2, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        // Count unique plants harvested
        int totalPlantsHarvested = (int) harvests.stream()
                .map(h -> h.getPlant().getId())
                .distinct()
                .count();

        // Count unique grows
        long uniqueGrows = harvests.stream()
                .map(h -> h.getGrow().getId())
                .distinct()
                .count();

        // Count unique cultivars
        long uniqueCultivars = harvests.stream()
                .map(h -> h.getPlant().getCultivar() != null ? h.getPlant().getCultivar().getId() : null)
                .filter(Objects::nonNull)
                .distinct()
                .count();

        // Calculate averages per plant, grow, and cultivar
        Double avgYieldPerPlant = totalPlantsHarvested > 0 ? totalYield / totalPlantsHarvested : null;
        Double avgYieldPerGrow = uniqueGrows > 0 ? totalYield / uniqueGrows : null;
        Double avgYieldPerCultivar = uniqueCultivars > 0 ? totalYield / uniqueCultivars : null;

        // Calculate hash yield metrics
        double totalHashYield = harvests.stream()
                .filter(h -> h.getHashYield() != null)
                .mapToDouble(h -> h.getHashYield().doubleValue())
                .sum();

        Double avgHashYieldPerPlant = totalPlantsHarvested > 0 && totalHashYield > 0
                ? totalHashYield / totalPlantsHarvested
                : null;

        // Calculate average hash yield percentage (hash yield / wet weight * 100)
        Double avgHashYieldPercentage = harvests.stream()
                .filter(h -> h.getHashYield() != null && h.getWetWeight() != null && h.getWetWeight().doubleValue() > 0)
                .mapToDouble(h -> (h.getHashYield().doubleValue() / h.getWetWeight().doubleValue()) * 100)
                .average()
                .orElse(0.0);

        if (avgHashYieldPercentage != null && avgHashYieldPercentage == 0.0) {
            avgHashYieldPercentage = null;
        }

        return YieldAnalyticsResponse.YieldMetrics.builder()
                .totalYield(totalYield)
                .avgYieldPerPlant(avgYieldPerPlant)
                .avgYieldPerCultivar(avgYieldPerCultivar)
                .avgYieldPerGrow(avgYieldPerGrow)
                .avgWetWeight(avgWetWeight > 0 ? avgWetWeight : null)
                .avgDryWeight(avgDryWeight > 0 ? avgDryWeight : null)
                .avgWetToDryRatio(avgWetToDryRatio)
                .totalHashYield(totalHashYield > 0 ? totalHashYield : null)
                .avgHashYieldPerPlant(avgHashYieldPerPlant)
                .avgHashYieldPercentage(avgHashYieldPercentage)
                .totalHarvests(harvests.size())
                .totalPlantsHarvested(totalPlantsHarvested)
                .build();
    }

    /**
     * Calculates production efficiency metrics.
     *
     * @param harvests the harvests
     * @param plants   all plants
     * @return production efficiency
     */
    private YieldAnalyticsResponse.ProductionEfficiency calculateProductionEfficiency(
            List<Harvest> harvests, List<Plant> plants) {

        // Calculate success rate (percentage of plants that reached harvest)
        Double successRate = null;
        if (!plants.isEmpty()) {
            long harvestedPlants = harvests.stream()
                    .map(h -> h.getPlant().getId())
                    .distinct()
                    .count();
            successRate = BigDecimal.valueOf((double) harvestedPlants / plants.size() * 100.0)
                    .setScale(2, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        // Calculate average days to harvest (from planting to harvest)
        Integer avgDaysToHarvest = null;
        if (!harvests.isEmpty()) {
            List<Integer> daysToHarvest = harvests.stream()
                    .filter(h -> h.getPlant().getPlantedDate() != null)
                    .map(h -> (int) ChronoUnit.DAYS.between(h.getPlant().getPlantedDate(), h.getHarvestDate()))
                    .collect(Collectors.toList());

            if (!daysToHarvest.isEmpty()) {
                avgDaysToHarvest = (int) daysToHarvest.stream()
                        .mapToInt(Integer::intValue)
                        .average()
                        .orElse(0.0);
            }
        }

        // Placeholder values for metrics that require additional data
        Double gramsPerWatt = null; // Would need light wattage data
        Double yieldPerSqFt = null; // Would need grow area data
        String trend = "stable"; // Would require historical comparison

        return YieldAnalyticsResponse.ProductionEfficiency.builder()
                .gramsPerWatt(gramsPerWatt)
                .successRate(successRate)
                .avgDaysToHarvest(avgDaysToHarvest)
                .yieldPerSqFt(yieldPerSqFt)
                .trend(trend)
                .build();
    }

    /**
     * Calculates quality tracking metrics.
     *
     * @param harvests the harvests
     * @return quality tracking
     */
    private YieldAnalyticsResponse.QualityTracking calculateQualityTracking(List<Harvest> harvests) {

        if (harvests.isEmpty()) {
            return YieldAnalyticsResponse.QualityTracking.builder()
                    .avgPotency(null)
                    .qualityDistribution(null)
                    .defectCount(0)
                    .commonDefects(List.of())
                    .build();
        }

        // Calculate average potency (THC percentage)
        Double avgPotency = harvests.stream()
                .filter(h -> h.getThcPercent() != null)
                .mapToDouble(h -> h.getThcPercent().doubleValue())
                .average()
                .orElse(0.0);

        // Calculate quality distribution
        int excellent = 0; // 9-10 rating
        int good = 0; // 7-8 rating
        int average = 0; // 5-6 rating
        int poor = 0; // 0-4 rating

        for (Harvest harvest : harvests) {
            if (harvest.getQualityRating() != null) {
                int rating = harvest.getQualityRating();
                if (rating >= 9) {
                    excellent++;
                } else if (rating >= 7) {
                    good++;
                } else if (rating >= 5) {
                    average++;
                } else {
                    poor++;
                }
            }
        }

        YieldAnalyticsResponse.QualityDistribution qualityDistribution =
                YieldAnalyticsResponse.QualityDistribution.builder()
                        .excellent(excellent)
                        .good(good)
                        .average(average)
                        .poor(poor)
                        .build();

        return YieldAnalyticsResponse.QualityTracking.builder()
                .avgPotency(avgPotency > 0 ? avgPotency : null)
                .qualityDistribution(qualityDistribution)
                .defectCount(0) // Would require defect tracking data
                .commonDefects(List.of()) // Would require defect tracking data
                .build();
    }

    /**
     * Generates yield trend over time.
     *
     * @param harvests the harvests
     * @return yield trend points
     */
    private List<YieldAnalyticsResponse.YieldTrendPoint> generateYieldTrend(List<Harvest> harvests) {

        if (harvests.isEmpty()) {
            return List.of();
        }

        // Group harvests by grow
        Map<UUID, List<Harvest>> harvestsByGrow = harvests.stream()
                .collect(Collectors.groupingBy(h -> h.getGrow().getId()));

        // Create trend points for each grow
        return harvestsByGrow.entrySet().stream()
                .map(entry -> {
                    List<Harvest> growHarvests = entry.getValue();
                    Harvest firstHarvest = growHarvests.get(0);

                    double totalYield = growHarvests.stream()
                            .mapToDouble(h -> {
                                if (h.getDryWeight() != null) {
                                    return h.getDryWeight().doubleValue();
                                } else if (h.getWetWeight() != null) {
                                    return h.getWetWeight().doubleValue();
                                }
                                return 0.0;
                            })
                            .sum();

                    int plantCount = (int) growHarvests.stream()
                            .map(h -> h.getPlant().getId())
                            .distinct()
                            .count();

                    double avgYieldPerPlant = plantCount > 0 ? totalYield / plantCount : 0.0;

                    String cultivarName = firstHarvest.getPlant().getCultivar() != null
                            ? firstHarvest.getPlant().getCultivar().getName()
                            : "Unknown";

                    String cultivarId = firstHarvest.getPlant().getCultivar() != null
                            ? firstHarvest.getPlant().getCultivar().getId().toString()
                            : null;

                    return YieldAnalyticsResponse.YieldTrendPoint.builder()
                            .harvestDate(firstHarvest.getHarvestDate())
                            .growId(firstHarvest.getGrow().getId().toString())
                            .growName(firstHarvest.getGrow().getName())
                            .cultivarId(cultivarId)
                            .cultivarName(cultivarName)
                            .totalYield(totalYield)
                            .plantCount(plantCount)
                            .avgYieldPerPlant(avgYieldPerPlant)
                            .build();
                })
                .sorted(Comparator.comparing(YieldAnalyticsResponse.YieldTrendPoint::getHarvestDate))
                .collect(Collectors.toList());
    }

    /**
     * Identifies top performing grows and plants.
     *
     * @param harvests the harvests
     * @return top performers
     */
    private List<YieldAnalyticsResponse.TopPerformer> identifyTopPerformers(List<Harvest> harvests) {

        if (harvests.isEmpty()) {
            return List.of();
        }

        // Sort harvests by dry weight (or wet weight if dry not available)
        return harvests.stream()
                .sorted((h1, h2) -> {
                    double yield1 = h1.getDryWeight() != null ? h1.getDryWeight().doubleValue()
                            : (h1.getWetWeight() != null ? h1.getWetWeight().doubleValue() : 0.0);
                    double yield2 = h2.getDryWeight() != null ? h2.getDryWeight().doubleValue()
                            : (h2.getWetWeight() != null ? h2.getWetWeight().doubleValue() : 0.0);
                    return Double.compare(yield2, yield1); // Descending order
                })
                .limit(5) // Top 5 performers
                .map(h -> {
                    double yield = h.getDryWeight() != null ? h.getDryWeight().doubleValue()
                            : (h.getWetWeight() != null ? h.getWetWeight().doubleValue() : 0.0);

                    double quality = h.getQualityRating() != null ? h.getQualityRating().doubleValue() : 0.0;

                    String cultivarName = h.getPlant().getCultivar() != null
                            ? h.getPlant().getCultivar().getName()
                            : "Unknown";

                    return YieldAnalyticsResponse.TopPerformer.builder()
                            .id(h.getPlant().getId().toString())
                            .type("plant")
                            .name(h.getPlant().getTag())
                            .cultivarName(cultivarName)
                            .yield(yield)
                            .quality(quality)
                            .harvestDate(h.getHarvestDate())
                            .build();
                })
                .collect(Collectors.toList());
    }

/**
     * Get timeline events for a specific grow.
     * Cached with key: analytics:{userId}:timeline:{growId}:{startDate}:{endDate}:{eventTypes}
     *
     * @param growId     the grow ID
     * @param startDate  start of time range
     * @param endDate    end of time range
     * @param eventTypes optional list of event types to filter (null = all types)
     * @param user       the authenticated user
     * @return timeline events response
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.TIMELINE_EVENTS_CACHE,
            key = "#user.id + ':' + #growId + ':' + #startDate + ':' + #endDate + ':' + (#eventTypes != null ? #eventTypes.toString() : 'all')")
    public TimelineEventResponse getTimelineEvents(
            UUID growId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            List<String> eventTypes,
            User user) {

        logger.info("Generating timeline events for grow {} from {} to {} with event types: {}",
                growId, startDate, endDate, eventTypes);

        // Fetch all relevant data for the time range
        List<FeedingEvent> feedingEvents = feedingEventRepository.findByGrowIdAndTimeRange(growId, startDate, endDate);
        List<ActivityLog> activityLogs = activityLogRepository.findByGrowIdAndTimeRange(growId, startDate, endDate);
        List<Observation> observations = observationRepository.findByGrowIdAndCreatedAtBetween(growId, startDate, endDate);
        List<Harvest> harvests = harvestRepository.findByGrowIdOrderByHarvestDateDesc(growId).stream()
                .filter(h -> !h.getHarvestDate().atStartOfDay().isBefore(startDate.toLocalDate().atStartOfDay()))
                .filter(h -> !h.getHarvestDate().atStartOfDay().isAfter(endDate.toLocalDate().atStartOfDay()))
                .collect(Collectors.toList());

        // Convert to timeline events
        List<TimelineEventResponse.TimelineEvent> events = new ArrayList<>();

        // Add feeding events
        for (FeedingEvent fe : feedingEvents) {
            // Parse amendments from JSON string
            List<AmendmentDTO> amendments = null;
            if (fe.getAmendments() != null && !fe.getAmendments().isEmpty()) {
                try {
                    amendments = objectMapper.readValue(
                            fe.getAmendments(),
                            new TypeReference<List<AmendmentDTO>>() {}
                    );
                } catch (Exception e) {
                    logger.warn("Failed to parse amendments for feeding event {}: {}",
                            fe.getId(), e.getMessage());
                    amendments = List.of();
                }
            }

            TimelineEventResponse.EventDetails details = TimelineEventResponse.EventDetails.builder()
                    .ec(fe.getEcLevel() != null ? fe.getEcLevel().doubleValue() : null)
                    .ph(fe.getPhLevel() != null ? fe.getPhLevel().doubleValue() : null)
                    .waterVolume(fe.getAmountMl().doubleValue())
                    .nutrients(fe.getNutrientMix() != null ? List.of(fe.getNutrientMix()) : List.of())
                    .amendments(amendments)
                    .build();

            events.add(TimelineEventResponse.TimelineEvent.builder()
                    .id(fe.getId().toString())
                    .eventType("feeding")
                    .timestamp(fe.getFedAt())
                    .growId(fe.getPlant().getGrow().getId().toString())
                    .growName(fe.getPlant().getGrow().getName())
                    .plantId(fe.getPlant().getId().toString())
                    .plantTag(fe.getPlant().getTag())
                    .description("Fed with " + fe.getFeedingType().getValue())
                    .details(details)
                    .build());
        }

        // Add activity logs
        for (ActivityLog al : activityLogs) {
            TimelineEventResponse.EventDetails details = TimelineEventResponse.EventDetails.builder()
                    .activityType(al.getActivityType().getValue())
                    .notes(al.getNotes())
                    .build();

            events.add(TimelineEventResponse.TimelineEvent.builder()
                    .id(al.getId().toString())
                    .eventType(al.getActivityType().getValue())
                    .timestamp(al.getLoggedAt())
                    .growId(al.getPlant().getGrow().getId().toString())
                    .growName(al.getPlant().getGrow().getName())
                    .plantId(al.getPlant().getId().toString())
                    .plantTag(al.getPlant().getTag())
                    .description(al.getActivityType().getValue())
                    .details(details)
                    .build());
        }

        // Add observations
        for (Observation obs : observations) {
            TimelineEventResponse.EventDetails details = TimelineEventResponse.EventDetails.builder()
                    .observationType(obs.getObservationType().getValue())
                    .photoUrls(obs.getPhotos() != null ? Arrays.asList(obs.getPhotos()) : List.of())
                    .tags(obs.getTags() != null ? Arrays.asList(obs.getTags()) : List.of())
                    .build();

            events.add(TimelineEventResponse.TimelineEvent.builder()
                    .id(obs.getId().toString())
                    .eventType("observation")
                    .timestamp(obs.getCreatedAt())
                    .growId(obs.getPlant().getGrow().getId().toString())
                    .growName(obs.getPlant().getGrow().getName())
                    .plantId(obs.getPlant().getId().toString())
                    .plantTag(obs.getPlant().getTag())
                    .description(obs.getObservationType().getValue())
                    .details(details)
                    .build());
        }

        // Add harvest events
        for (Harvest h : harvests) {
            TimelineEventResponse.EventDetails details = TimelineEventResponse.EventDetails.builder()
                    .wetWeight(h.getWetWeight() != null ? h.getWetWeight().doubleValue() : null)
                    .dryWeight(h.getDryWeight() != null ? h.getDryWeight().doubleValue() : null)
                    .build();

            events.add(TimelineEventResponse.TimelineEvent.builder()
                    .id(h.getId().toString())
                    .eventType("harvest")
                    .timestamp(h.getHarvestDate().atStartOfDay())
                    .growId(h.getGrow().getId().toString())
                    .growName(h.getGrow().getName())
                    .plantId(h.getPlant().getId().toString())
                    .plantTag(h.getPlant().getTag())
                    .description("Harvested plant")
                    .details(details)
                    .build());
        }

        // Filter by event types if specified
        if (eventTypes != null && !eventTypes.isEmpty()) {
            logger.info("Filtering events by types: {}", eventTypes);
            events = events.stream()
                    .filter(event -> eventTypes.contains(event.getEventType()))
                    .collect(Collectors.toList());
        }

        // Sort events by timestamp (most recent first)
        events.sort(Comparator.comparing(TimelineEventResponse.TimelineEvent::getTimestamp).reversed());

        // Create milestones from stage changes
        List<TimelineEventResponse.Milestone> milestones = createStageMilestones(activityLogs);

        // Create photo timeline
        List<TimelineEventResponse.PhotoEntry> photos = createPhotoTimeline(observations);

        return TimelineEventResponse.builder()
                .events(events)
                .milestones(milestones)
                .photos(photos)
                .build();
    }

    /**
     * Creates stage transition milestones from activity logs.
     *
     * @param activityLogs all activity logs
     * @return list of milestones
     */
    private List<TimelineEventResponse.Milestone> createStageMilestones(List<ActivityLog> activityLogs) {
        // Filter for stage change activities
        // TODO: Stage transition milestones require a STAGE_CHANGE activity type or historical stage tracking
        // Since these are not currently implemented, we return an empty list
        return new ArrayList<>();
    }

    /**
     * Determines the previous stage based on the current stage.
     *
     * @param currentStage the current plant stage
     * @return the previous stage name
     */
    private String determineFromStage(String currentStage) {
        switch (currentStage.toLowerCase()) {
            case "vegetative":
                return "seedling";
            case "flowering":
                return "vegetative";
            case "harvest":
                return "flowering";
            default:
                return "unknown";
        }
    }

    /**
     * Creates photo timeline from observations.
     *
     * @param observations all observations
     * @return list of photo entries
     */
    private List<TimelineEventResponse.PhotoEntry> createPhotoTimeline(List<Observation> observations) {
        List<TimelineEventResponse.PhotoEntry> photos = new ArrayList<>();

        for (Observation obs : observations) {
            if (obs.getPhotos() != null && obs.getPhotos().length > 0) {
                for (String imageUrl : obs.getPhotos()) {
                    photos.add(TimelineEventResponse.PhotoEntry.builder()
                            .observationId(obs.getId().toString())
                            .timestamp(obs.getCreatedAt())
                            .plantId(obs.getPlant().getId().toString())
                            .plantTag(obs.getPlant().getTag())
                            .plantStage(obs.getPlant().getStage().getValue())
                            .photoUrl(imageUrl)
                            .thumbnailUrl(imageUrl) // Would need thumbnail generation
                            .caption(obs.getNote())
                            .build());
                }
            }
        }

        // Sort by timestamp (most recent first)
        photos.sort(Comparator.comparing(TimelineEventResponse.PhotoEntry::getTimestamp).reversed());

        return photos;
    }
}
