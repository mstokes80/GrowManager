package com.growmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for environmental data CSV import.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnvironmentalImportResponse {

    /**
     * Number of records successfully imported.
     */
    private int importedCount;

    /**
     * Number of records skipped due to errors.
     */
    private int skippedCount;

    /**
     * Total number of records in the CSV file.
     */
    private int totalRecords;

    /**
     * List of error messages for skipped records.
     */
    @Builder.Default
    private List<String> errors = new ArrayList<>();

    /**
     * Source/format of the imported data.
     */
    private String source;
}