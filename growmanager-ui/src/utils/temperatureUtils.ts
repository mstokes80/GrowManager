/**
 * Temperature conversion utilities
 * Handles conversion between Celsius and Fahrenheit
 */

export type TemperatureUnit = 'celsius' | 'fahrenheit';

// Temperature limits in Celsius
export const TEMP_MIN_CELSIUS = -50;
export const TEMP_MAX_CELSIUS = 100;

// Temperature limits in Fahrenheit
export const TEMP_MIN_FAHRENHEIT = -58;
export const TEMP_MAX_FAHRENHEIT = 212;

/**
 * Convert Celsius to Fahrenheit
 * @param celsius Temperature in Celsius
 * @returns Temperature in Fahrenheit
 */
export const celsiusToFahrenheit = (celsius: number): number => {
  return (celsius * 9) / 5 + 32;
};

/**
 * Convert Fahrenheit to Celsius
 * @param fahrenheit Temperature in Fahrenheit
 * @returns Temperature in Celsius
 */
export const fahrenheitToCelsius = (fahrenheit: number): number => {
  return ((fahrenheit - 32) * 5) / 9;
};

/**
 * Format temperature value for display with unit
 * @param value Temperature value
 * @param unit Temperature unit
 * @param precision Number of decimal places (default: 1)
 * @returns Formatted string with unit symbol
 */
export const formatTemperature = (
  value: number | undefined,
  unit: TemperatureUnit,
  precision: number = 1
): string | null => {
  if (value === undefined || value === null || isNaN(value)) {
    return null;
  }

  const symbol = unit === 'celsius' ? '°C' : '°F';
  return `${value.toFixed(precision)}${symbol}`;
};

/**
 * Get conversion text showing the equivalent temperature in the other unit
 * @param value Temperature value
 * @param currentUnit Current temperature unit
 * @param precision Number of decimal places (default: 1)
 * @returns Formatted conversion text or null
 */
export const getTemperatureConversion = (
  value: number | undefined,
  currentUnit: TemperatureUnit,
  precision: number = 1
): string | null => {
  if (value === undefined || value === null || isNaN(value)) {
    return null;
  }

  if (currentUnit === 'celsius') {
    const fahrenheit = celsiusToFahrenheit(value);
    return `${fahrenheit.toFixed(precision)}°F`;
  } else {
    const celsius = fahrenheitToCelsius(value);
    return `${celsius.toFixed(precision)}°C`;
  }
};

/**
 * Validate temperature value based on unit
 * @param value Temperature value
 * @param unit Temperature unit
 * @returns Error message or undefined if valid
 */
export const validateTemperature = (
  value: number | undefined,
  unit: TemperatureUnit
): string | undefined => {
  if (value === undefined || value === null || isNaN(value)) {
    return undefined;
  }

  if (unit === 'celsius') {
    if (value < TEMP_MIN_CELSIUS) {
      return `Temperature must be at least ${TEMP_MIN_CELSIUS}°C`;
    }
    if (value > TEMP_MAX_CELSIUS) {
      return `Temperature must not exceed ${TEMP_MAX_CELSIUS}°C`;
    }
  } else {
    if (value < TEMP_MIN_FAHRENHEIT) {
      return `Temperature must be at least ${TEMP_MIN_FAHRENHEIT}°F`;
    }
    if (value > TEMP_MAX_FAHRENHEIT) {
      return `Temperature must not exceed ${TEMP_MAX_FAHRENHEIT}°F`;
    }
  }

  return undefined;
};

/**
 * Convert temperature to Celsius if needed
 * Useful when storing temperature values that should always be in Celsius
 * @param value Temperature value
 * @param unit Current temperature unit
 * @returns Temperature in Celsius
 */
export const toCelsius = (value: number, unit: TemperatureUnit): number => {
  return unit === 'fahrenheit' ? fahrenheitToCelsius(value) : value;
};

/**
 * Convert temperature from Celsius to specified unit
 * @param celsius Temperature in Celsius
 * @param targetUnit Target temperature unit
 * @returns Temperature in target unit
 */
export const fromCelsius = (celsius: number, targetUnit: TemperatureUnit): number => {
  return targetUnit === 'fahrenheit' ? celsiusToFahrenheit(celsius) : celsius;
};