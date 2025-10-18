/**
 * Date utility functions for handling date parsing and formatting
 * without timezone conversion issues
 */

/**
 * Parses a LocalDate string (YYYY-MM-DD) from the backend as a local date
 * without timezone conversion. This prevents dates from shifting due to UTC conversion.
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object representing the local date, or null if parsing fails
 */
export function parseLocalDate(dateString: string): Date | null {
  if (!dateString) {
    return null;
  }

  // Check if it's in YYYY-MM-DD format
  const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dateString.match(isoDatePattern);

  if (match) {
    const year = match[1]!;
    const month = match[2]!;
    const day = match[3]!;
    // Create date using local timezone (month is 0-indexed)
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  }

  // Fallback: try to parse normally (may have timezone issues)
  try {
    return new Date(dateString);
  } catch (error) {
    return null;
  }
}

/**
 * Parses a LocalDateTime/timestamp string from the backend
 * Handles both ISO 8601 format and other date formats
 *
 * @param timestamp - Timestamp string
 * @returns Date object or null if parsing fails
 */
export function parseTimestamp(timestamp: string): Date | null {
  if (!timestamp) {
    return null;
  }

  try {
    return new Date(timestamp);
  } catch (error) {
    return null;
  }
}