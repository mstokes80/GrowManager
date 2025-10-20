package com.growmanager.service;

import com.growmanager.dto.CreateEnvironmentalSnapshotRequest;
import com.growmanager.dto.EnvironmentalImportResponse;
import com.growmanager.dto.EnvironmentalSnapshotResponse;
import com.growmanager.dto.PageResponse;
import com.growmanager.entity.EnvironmentalSnapshot;
import com.growmanager.entity.Grow;
import com.growmanager.entity.Plant;
import com.growmanager.exception.ResourceNotFoundException;
import com.growmanager.repository.EnvironmentalSnapshotRepository;
import com.growmanager.repository.GrowRepository;
import com.growmanager.repository.PlantRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing environmental snapshot operations.
 * Handles CRUD operations for environmental data with ownership validation.
 */
@Service
@Transactional
public class EnvironmentalSnapshotService {

    private static final Logger logger = LoggerFactory.getLogger(EnvironmentalSnapshotService.class);
    private static final long MINIMUM_INTERVAL_HOURS = 4;

    private final EnvironmentalSnapshotRepository snapshotRepository;
    private final GrowRepository growRepository;
    private final PlantRepository plantRepository;

    @Autowired
    public EnvironmentalSnapshotService(
            EnvironmentalSnapshotRepository snapshotRepository,
            GrowRepository growRepository,
            PlantRepository plantRepository
    ) {
        this.snapshotRepository = snapshotRepository;
        this.growRepository = growRepository;
        this.plantRepository = plantRepository;
    }

    /**
     * Creates a new environmental snapshot for a grow.
     * Auto-calculates VPD when temperature and humidity are provided.
     * Enforces minimum 4-hour interval between readings for the same grow.
     *
     * @param userId the ID of the current user
     * @param growId the ID of the grow
     * @param request the create environmental snapshot request
     * @return the created environmental snapshot response
     * @throws ResourceNotFoundException if grow not found or doesn't belong to user
     * @throws IllegalStateException if minimum interval not met
     */
    public EnvironmentalSnapshotResponse createSnapshotForGrow(
            UUID userId,
            UUID growId,
            CreateEnvironmentalSnapshotRequest request) {
        logger.info("Creating environmental snapshot for grow ID: {} and user ID: {}", growId, userId);

        Grow grow = growRepository.findById(growId)
                .orElseThrow(() -> new ResourceNotFoundException("Grow not found"));

        // Validate ownership
        if (!grow.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to create snapshot for grow {} owned by different user",
                    userId, growId);
            throw new ResourceNotFoundException("Grow not found");
        }

        // Enforce minimum interval (4 hours)
        enforceMinimumInterval(growId, null, request.getTimestamp());

        EnvironmentalSnapshot snapshot = buildSnapshot(grow, null, request);
        snapshot = snapshotRepository.save(snapshot);

        logger.info("Environmental snapshot created successfully for grow: {}", growId);

        return EnvironmentalSnapshotResponse.fromEntity(snapshot);
    }

    /**
     * Creates a new environmental snapshot for a plant.
     * Auto-calculates VPD when temperature and humidity are provided.
     * Enforces minimum 4-hour interval between readings for the same plant.
     *
     * @param userId the ID of the current user
     * @param plantId the ID of the plant
     * @param request the create environmental snapshot request
     * @return the created environmental snapshot response
     * @throws ResourceNotFoundException if plant not found or doesn't belong to user
     * @throws IllegalStateException if minimum interval not met
     */
    public EnvironmentalSnapshotResponse createSnapshotForPlant(
            UUID userId,
            UUID plantId,
            CreateEnvironmentalSnapshotRequest request) {
        logger.info("Creating environmental snapshot for plant ID: {} and user ID: {}", plantId, userId);

        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found"));

        // Validate ownership (via grow ownership)
        if (!plant.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to create snapshot for plant {} owned by different user",
                    userId, plantId);
            throw new ResourceNotFoundException("Plant not found");
        }

        // Enforce minimum interval (4 hours)
        enforceMinimumInterval(plant.getGrow().getId(), plantId, request.getTimestamp());

        EnvironmentalSnapshot snapshot = buildSnapshot(plant.getGrow(), plant, request);
        snapshot = snapshotRepository.save(snapshot);

        logger.info("Environmental snapshot created successfully for plant: {}", plantId);

        return EnvironmentalSnapshotResponse.fromEntity(snapshot);
    }

    /**
     * Gets all environmental snapshots for a grow.
     * Optionally filters by date range.
     *
     * @param userId the ID of the current user
     * @param growId the ID of the grow
     * @param startDate the optional start date filter
     * @param endDate the optional end date filter
     * @return list of environmental snapshot responses
     * @throws ResourceNotFoundException if grow not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public List<EnvironmentalSnapshotResponse> getSnapshotsByGrow(
            UUID userId,
            UUID growId,
            LocalDateTime startDate,
            LocalDateTime endDate) {
        logger.info("Fetching environmental snapshots for grow ID: {} and user ID: {}", growId, userId);

        Grow grow = growRepository.findById(growId)
                .orElseThrow(() -> new ResourceNotFoundException("Grow not found"));

        // Validate ownership
        if (!grow.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access snapshots for grow {} owned by different user",
                    userId, growId);
            throw new ResourceNotFoundException("Grow not found");
        }

        List<EnvironmentalSnapshot> snapshots;
        if (startDate != null && endDate != null) {
            snapshots = snapshotRepository.findByGrowIdAndTimeRange(growId, startDate, endDate);
        } else {
            snapshots = snapshotRepository.findByGrowId(growId);
        }

        return snapshots.stream()
                .map(EnvironmentalSnapshotResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Gets environmental snapshots for a grow with pagination support.
     * Does not support date range filtering.
     *
     * @param userId the ID of the current user
     * @param growId the ID of the grow
     * @param pageable the pagination information
     * @return paginated environmental snapshot responses
     * @throws ResourceNotFoundException if grow not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public PageResponse<EnvironmentalSnapshotResponse> getSnapshotsByGrowPaginated(
            UUID userId,
            UUID growId,
            Pageable pageable) {
        logger.info("Fetching paginated environmental snapshots for grow ID: {} and user ID: {} (page: {}, size: {})",
                growId, userId, pageable.getPageNumber(), pageable.getPageSize());

        Grow grow = growRepository.findById(growId)
                .orElseThrow(() -> new ResourceNotFoundException("Grow not found"));

        // Validate ownership
        if (!grow.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access snapshots for grow {} owned by different user",
                    userId, growId);
            throw new ResourceNotFoundException("Grow not found");
        }

        Page<EnvironmentalSnapshot> snapshotsPage = snapshotRepository.findByGrowId(growId, pageable);

        List<EnvironmentalSnapshotResponse> content = snapshotsPage.getContent().stream()
                .map(EnvironmentalSnapshotResponse::fromEntity)
                .collect(Collectors.toList());

        return PageResponse.<EnvironmentalSnapshotResponse>builder()
                .content(content)
                .page(snapshotsPage.getNumber())
                .size(snapshotsPage.getSize())
                .totalElements(snapshotsPage.getTotalElements())
                .totalPages(snapshotsPage.getTotalPages())
                .first(snapshotsPage.isFirst())
                .last(snapshotsPage.isLast())
                .hasNext(snapshotsPage.hasNext())
                .hasPrevious(snapshotsPage.hasPrevious())
                .build();
    }

    /**
     * Gets all environmental snapshots for a plant.
     *
     * @param userId the ID of the current user
     * @param plantId the ID of the plant
     * @return list of environmental snapshot responses
     * @throws ResourceNotFoundException if plant not found or doesn't belong to user
     */
    @Transactional(readOnly = true)
    public List<EnvironmentalSnapshotResponse> getSnapshotsByPlant(UUID userId, UUID plantId) {
        logger.info("Fetching environmental snapshots for plant ID: {} and user ID: {}", plantId, userId);

        Plant plant = plantRepository.findById(plantId)
                .orElseThrow(() -> new ResourceNotFoundException("Plant not found"));

        // Validate ownership (via grow ownership)
        if (!plant.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to access snapshots for plant {} owned by different user",
                    userId, plantId);
            throw new ResourceNotFoundException("Plant not found");
        }

        List<EnvironmentalSnapshot> snapshots = snapshotRepository.findByPlantId(plantId);

        return snapshots.stream()
                .map(EnvironmentalSnapshotResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Deletes an environmental snapshot.
     *
     * @param userId the ID of the current user
     * @param snapshotId the ID of the snapshot to delete
     * @throws ResourceNotFoundException if snapshot not found or doesn't belong to user
     */
    public void deleteSnapshot(UUID userId, UUID snapshotId) {
        logger.info("Deleting environmental snapshot ID: {} for user ID: {}", snapshotId, userId);

        EnvironmentalSnapshot snapshot = snapshotRepository.findById(snapshotId)
                .orElseThrow(() -> new ResourceNotFoundException("Environmental snapshot not found"));

        // Validate ownership (via grow ownership)
        if (!snapshot.getGrow().getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to delete snapshot {} owned by different user",
                    userId, snapshotId);
            throw new ResourceNotFoundException("Environmental snapshot not found");
        }

        snapshotRepository.delete(snapshot);

        logger.info("Environmental snapshot deleted successfully: {}", snapshotId);
    }

    /**
     * Builds an environmental snapshot entity from the request.
     *
     * @param grow the grow
     * @param plant the plant (nullable)
     * @param request the create request
     * @return the environmental snapshot entity
     */
    private EnvironmentalSnapshot buildSnapshot(
            Grow grow,
            Plant plant,
            CreateEnvironmentalSnapshotRequest request) {

        LocalDateTime timestamp = request.getTimestamp() != null
                ? request.getTimestamp()
                : LocalDateTime.now();

        EnvironmentalSnapshot snapshot = EnvironmentalSnapshot.builder()
                .grow(grow)
                .plant(plant)
                .timestamp(timestamp)
                .temperature(request.getTemperature())
                .humidity(request.getHumidity())
                .co2(request.getCo2())
                .lightIntensity(request.getLightIntensity())
                .notes(request.getNotes())
                .build();

        // Auto-calculate VPD if temperature and humidity are provided
        if (request.getTemperature() != null && request.getHumidity() != null) {
            snapshot.autoCalculateVpd();
        }

        return snapshot;
    }

    /**
     * Enforces minimum 4-hour interval between environmental readings.
     *
     * @param growId the grow ID
     * @param plantId the plant ID (nullable)
     * @param newTimestamp the timestamp of the new reading
     * @throws IllegalStateException if minimum interval not met
     */
    private void enforceMinimumInterval(UUID growId, UUID plantId, LocalDateTime newTimestamp) {
        LocalDateTime timestamp = newTimestamp != null ? newTimestamp : LocalDateTime.now();

        EnvironmentalSnapshot mostRecent;
        if (plantId != null) {
            mostRecent = snapshotRepository.findMostRecentByPlantId(plantId);
        } else {
            mostRecent = snapshotRepository.findMostRecentByGrowId(growId);
        }

        if (mostRecent != null) {
            LocalDateTime minimumAllowedTime = mostRecent.getTimestamp()
                    .plusHours(MINIMUM_INTERVAL_HOURS);

            if (timestamp.isBefore(minimumAllowedTime)) {
                logger.warn("Attempted to create snapshot before minimum interval. Last reading: {}, New reading: {}",
                        mostRecent.getTimestamp(), timestamp);
                throw new IllegalStateException(
                        "Minimum 4-hour interval required between environmental readings. " +
                        "Last reading was at " + mostRecent.getTimestamp()
                );
            }
        }
    }

    /**
     * Imports environmental data from an AC Infinity CSV file.
     * CSV format: Time, Temperature, Relative Humidity, VPD
     * Does not enforce minimum interval validation since importing historical data.
     *
     * @param userId the ID of the current user
     * @param growId the ID of the grow
     * @param file the CSV file to import
     * @return import response with statistics and errors
     * @throws ResourceNotFoundException if grow not found or doesn't belong to user
     * @throws IllegalArgumentException if file is empty or invalid format
     */
    public EnvironmentalImportResponse importAcInfinityCSV(
            UUID userId,
            UUID growId,
            MultipartFile file) throws IOException {

        logger.info("Importing AC Infinity CSV for grow {} by user {}", growId, userId);

        // Validate grow exists and user owns it
        Grow grow = growRepository.findById(growId)
                .orElseThrow(() -> new ResourceNotFoundException("Grow not found"));

        if (!grow.getUser().getId().equals(userId)) {
            logger.warn("User {} attempted to import data for grow {} owned by different user",
                    userId, growId);
            throw new ResourceNotFoundException("Grow not found");
        }

        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        List<String> errors = new ArrayList<>();
        int importedCount = 0;
        int skippedCount = 0;
        int totalRecords = 0;

        // Parse CSV
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            // Skip metadata lines until we find the header row
            String line;
            int lineNumber = 0;
            boolean headerFound = false;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                // Look for the header row (contains "Time" and "Temperature")
                if (line.contains("Time") && line.contains("Temperature")) {
                    logger.info("Found header row at line {}: {}", lineNumber, line);
                    headerFound = true;
                    // Continue reading to get past the header line
                    break;
                }
            }

            if (!headerFound) {
                throw new IllegalArgumentException("No header row found in CSV. Expected columns: Time, Temperature, Relative Humidity, VPD");
            }

            // Now parse the CSV starting after the header
            // Manually set the header names since we already skipped to the data section
            try (CSVParser csvParser = CSVParser.parse(reader,
                     CSVFormat.DEFAULT.builder()
                             .setHeader("Time", "Temperature", "Relative Humidity", "VPD")
                             .setSkipHeaderRecord(false)  // Don't skip - we're already past the header
                             .setIgnoreHeaderCase(true)
                             .setTrim(true)
                             .setIgnoreEmptyLines(true)  // Automatically skip empty lines
                             .build())) {

                // Expected columns: Time, Temperature, Relative Humidity, VPD
                List<EnvironmentalSnapshot> snapshots = new ArrayList<>();

                for (CSVRecord record : csvParser) {
                    // Skip empty rows
                    if (record.get("Time") == null || record.get("Time").trim().isEmpty()) {
                        continue;
                    }

                    totalRecords++;
                    try {
                        // Parse timestamp
                        String timeStr = record.get("Time");
                        LocalDateTime timestamp = parseAcInfinityTimestamp(timeStr);

                        // Parse temperature (assume Fahrenheit from AC Infinity)
                        String tempStr = record.get("Temperature");
                        BigDecimal temperature = parseBigDecimal(tempStr);

                        // Parse humidity
                        String humidityStr = record.get("Relative Humidity");
                        BigDecimal humidity = parseBigDecimal(humidityStr);

                        // Parse VPD (optional, will be recalculated if temp/humidity present)
                        String vpdStr = record.get("VPD");
                        BigDecimal vpd = parseBigDecimal(vpdStr);

                        // Build snapshot - don't auto-calculate VPD, use CSV value instead
                        // (AC Infinity provides temperature in Fahrenheit, which would break VPD calculation)
                        CreateEnvironmentalSnapshotRequest request = CreateEnvironmentalSnapshotRequest.builder()
                                .timestamp(timestamp)
                                .temperature(temperature)
                                .humidity(humidity)
                                .build();

                        // Build without auto-calculating VPD
                        EnvironmentalSnapshot snapshot = EnvironmentalSnapshot.builder()
                                .grow(grow)
                                .plant(null)
                                .timestamp(request.getTimestamp() != null ? request.getTimestamp() : LocalDateTime.now())
                                .temperature(request.getTemperature())
                                .humidity(request.getHumidity())
                                .vpd(vpd)  // Use VPD from CSV directly
                                .co2(request.getCo2())
                                .lightIntensity(request.getLightIntensity())
                                .notes(request.getNotes())
                                .build();

                        snapshots.add(snapshot);
                        importedCount++;

                    } catch (Exception e) {
                        skippedCount++;
                        String errorMsg = String.format("Row %d: %s", record.getRecordNumber(), e.getMessage());
                        errors.add(errorMsg);
                        logger.debug("Error parsing CSV row {}: {}", record.getRecordNumber(), e.getMessage());
                    }
                }

                // Batch save all snapshots
                if (!snapshots.isEmpty()) {
                    snapshotRepository.saveAll(snapshots);
                    logger.info("Successfully imported {} environmental snapshots for grow {}", importedCount, growId);
                }
            }

        } catch (IOException e) {
            logger.error("Error reading CSV file: {}", e.getMessage());
            throw e;
        }

        return EnvironmentalImportResponse.builder()
                .importedCount(importedCount)
                .skippedCount(skippedCount)
                .totalRecords(totalRecords)
                .errors(errors)
                .source("AC Infinity")
                .build();
    }

    /**
     * Parses an AC Infinity timestamp string.
     * Expected format: "M/d/yyyy h:mm:ss a" (e.g., "1/15/2025 3:45:30 PM")
     *
     * @param timeStr the timestamp string
     * @return parsed LocalDateTime
     * @throws DateTimeParseException if format is invalid
     */
    private LocalDateTime parseAcInfinityTimestamp(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty()) {
            throw new DateTimeParseException("Time field is empty", "", 0);
        }

        // Clean and normalize the input
        String cleanStr = timeStr.trim()
                .replaceAll("\"", "")           // Remove quotes
                .replaceAll("\\s+", " ");       // Normalize multiple spaces to single space

        logger.debug("Parsing timestamp: '{}'", cleanStr);

        // Check if it ends with AM or PM (simpler check that handles any characters before)
        String upperStr = cleanStr.toUpperCase(Locale.US);
        boolean hasAmPm = upperStr.endsWith("AM") || upperStr.endsWith("PM");

        logger.debug("Upper string: '{}', has AM/PM: {}, ends with AM: {}, ends with PM: {}",
                    upperStr, hasAmPm, upperStr.endsWith("AM"), upperStr.endsWith("PM"));

        if (hasAmPm) {
            // Manual parsing for AM/PM format due to Java DateTimeFormatter issues
            try {
                boolean isPM = upperStr.endsWith("PM");

                // Remove AM/PM from the end (just remove last 2 characters)
                // Then aggressively clean: remove ALL non-digit, non-slash, non-colon characters except one space
                String withoutAmPm = cleanStr.substring(0, cleanStr.length() - 2);

                // Remove any non-printable and weird whitespace, keep only digits, /, :, and regular space
                withoutAmPm = withoutAmPm.replaceAll("[^0-9/:]+", " ").trim();

                // Split into date and time parts
                String[] parts = withoutAmPm.split("\\s+");
                if (parts.length != 2) {
                    throw new IllegalArgumentException("Invalid date/time format");
                }

                String datePart = parts[0];      // MM/dd/yyyy
                String timePart = parts[1];      // h:mm or h:mm:ss

                // Parse date components
                String[] dateFields = datePart.split("/");
                int month = Integer.parseInt(dateFields[0]);
                int day = Integer.parseInt(dateFields[1]);
                int year = Integer.parseInt(dateFields[2]);

                // Parse time components
                String[] timeFields = timePart.split(":");
                int hour = Integer.parseInt(timeFields[0]);
                int minute = Integer.parseInt(timeFields[1]);
                int second = timeFields.length > 2 ? Integer.parseInt(timeFields[2]) : 0;

                // Convert 12-hour to 24-hour format
                if (isPM && hour != 12) {
                    hour += 12;
                } else if (!isPM && hour == 12) {
                    hour = 0;
                }

                LocalDateTime result = LocalDateTime.of(year, month, day, hour, minute, second);
                logger.debug("Successfully parsed AM/PM timestamp: {}", result);
                return result;

            } catch (Exception e) {
                logger.error("Failed to parse AM/PM timestamp: {}", e.getMessage());
                throw new DateTimeParseException("Unable to parse AM/PM timestamp: " + cleanStr, cleanStr, 0);
            }
        } else {
            // Try standard 24-hour format patterns
            DateTimeFormatter[] formatters = {
                    DateTimeFormatter.ofPattern("M/d/yyyy HH:mm"),
                    DateTimeFormatter.ofPattern("M/d/yyyy HH:mm:ss"),
                    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
                    DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")
            };

            for (DateTimeFormatter formatter : formatters) {
                try {
                    return LocalDateTime.parse(cleanStr, formatter);
                } catch (DateTimeParseException ignored) {
                    // Try next formatter
                }
            }
        }

        throw new DateTimeParseException("Unable to parse timestamp: " + timeStr, timeStr, 0);
    }

    /**
     * Safely parses a BigDecimal value from a string.
     *
     * @param value the string value
     * @return parsed BigDecimal or null if empty/invalid
     */
    private BigDecimal parseBigDecimal(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            // Remove any non-numeric characters except decimal point and minus sign
            String cleaned = value.trim().replaceAll("[^0-9.-]", "");
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            throw new NumberFormatException("Invalid numeric value: " + value);
        }
    }
}
