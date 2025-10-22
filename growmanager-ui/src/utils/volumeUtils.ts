/**
 * Volume conversion utilities
 * Handles conversion between Milliliters and Gallons
 */

export type VolumeUnit = 'milliliters' | 'gallons';

// Volume limits in milliliters
export const VOLUME_MIN_ML = 0;
export const VOLUME_MAX_ML = 500000; // 500 liters or ~132 gallons

// Volume limits in gallons
export const VOLUME_MIN_GALLONS = 0;
export const VOLUME_MAX_GALLONS = 132; // ~500 liters

/**
 * Convert Milliliters to Gallons
 * @param ml Volume in milliliters
 * @returns Volume in gallons
 */
export const millilitersToGallons = (ml: number): number => {
  return ml / 3785.41;
};

/**
 * Convert Gallons to Milliliters
 * @param gallons Volume in gallons
 * @returns Volume in milliliters
 */
export const gallonsToMilliliters = (gallons: number): number => {
  return gallons * 3785.41;
};

/**
 * Format volume value for display with unit
 * @param value Volume value
 * @param unit Volume unit
 * @param precision Number of decimal places (default: 2)
 * @returns Formatted string with unit symbol
 */
export const formatVolume = (
  value: number | undefined,
  unit: VolumeUnit,
  precision: number = 2
): string | null => {
  if (value === undefined || value === null || isNaN(value)) {
    return null;
  }

  const symbol = unit === 'milliliters' ? 'ml' : 'gal';
  return `${value.toFixed(precision)}${symbol}`;
};

/**
 * Get conversion text showing the equivalent volume in the other unit
 * @param value Volume value
 * @param currentUnit Current volume unit
 * @param precision Number of decimal places (default: 2)
 * @returns Formatted conversion text or null
 */
export const getVolumeConversion = (
  value: number | undefined,
  currentUnit: VolumeUnit,
  precision: number = 2
): string | null => {
  if (value === undefined || value === null || isNaN(value)) {
    return null;
  }

  if (currentUnit === 'milliliters') {
    const gallons = millilitersToGallons(value);
    return `${gallons.toFixed(precision)} gal`;
  } else {
    const ml = gallonsToMilliliters(value);
    return `${ml.toFixed(0)} ml`;
  }
};

/**
 * Validate volume value based on unit
 * @param value Volume value
 * @param unit Volume unit
 * @returns Error message or undefined if valid
 */
export const validateVolume = (
  value: number | undefined,
  unit: VolumeUnit
): string | undefined => {
  if (value === undefined || value === null || isNaN(value)) {
    return undefined;
  }

  if (unit === 'milliliters') {
    if (value < VOLUME_MIN_ML) {
      return `Volume must be at least ${VOLUME_MIN_ML} ml`;
    }
    if (value > VOLUME_MAX_ML) {
      return `Volume must not exceed ${VOLUME_MAX_ML} ml`;
    }
  } else {
    if (value < VOLUME_MIN_GALLONS) {
      return `Volume must be at least ${VOLUME_MIN_GALLONS} gal`;
    }
    if (value > VOLUME_MAX_GALLONS) {
      return `Volume must not exceed ${VOLUME_MAX_GALLONS} gal`;
    }
  }

  return undefined;
};

/**
 * Convert volume to milliliters if needed
 * Useful when storing volume values that should always be in milliliters
 * @param value Volume value
 * @param unit Current volume unit
 * @returns Volume in milliliters
 */
export const toMilliliters = (value: number, unit: VolumeUnit): number => {
  return unit === 'gallons' ? gallonsToMilliliters(value) : value;
};

/**
 * Convert volume from milliliters to specified unit
 * @param ml Volume in milliliters
 * @param targetUnit Target volume unit
 * @returns Volume in target unit
 */
export const fromMilliliters = (ml: number, targetUnit: VolumeUnit): number => {
  return targetUnit === 'gallons' ? millilitersToGallons(ml) : ml;
};