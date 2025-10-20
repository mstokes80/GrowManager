package com.growmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Generic paginated response wrapper.
 * Provides pagination metadata along with the data.
 *
 * @param <T> the type of data being paginated
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    /**
     * The list of items in the current page.
     */
    private List<T> content;

    /**
     * The current page number (0-indexed).
     */
    private int page;

    /**
     * The number of items per page.
     */
    private int size;

    /**
     * The total number of elements across all pages.
     */
    private long totalElements;

    /**
     * The total number of pages.
     */
    private int totalPages;

    /**
     * Whether this is the first page.
     */
    private boolean first;

    /**
     * Whether this is the last page.
     */
    private boolean last;

    /**
     * Whether there are more pages after this one.
     */
    private boolean hasNext;

    /**
     * Whether there are pages before this one.
     */
    private boolean hasPrevious;
}