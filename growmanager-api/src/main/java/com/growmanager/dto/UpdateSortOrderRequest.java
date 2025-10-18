package com.growmanager.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO for updating sort order of items.
 * Contains a list of item IDs with their new sort order positions.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSortOrderRequest {

    @NotEmpty(message = "Items list cannot be empty")
    @Valid
    private List<SortOrderItem> items;

    /**
     * Represents a single item with its new sort order.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SortOrderItem {

        @NotNull(message = "Item ID is required")
        private UUID id;

        @NotNull(message = "Sort order is required")
        private Integer sortOrder;
    }
}