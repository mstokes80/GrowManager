/**
 * Environmental Snapshot Type Definitions
 * Defines types for environmental condition tracking
 */

export type DataSource = 'MANUAL' | 'SENSOR' | 'INTEGRATION';

export interface EnvironmentalSnapshot {
  id: string;
  growId: string;
  plantId?: string;
  timestamp: string; // ISO 8601 datetime
  temperature?: number; // Celsius
  humidity?: number; // Percentage (0-100)
  co2?: number; // PPM
  lightIntensity?: number; // PPFD
  vpd?: number; // kPa (Vapor Pressure Deficit)
  source: DataSource;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnvironmentalSnapshotRequest {
  timestamp?: string; // ISO 8601 datetime, defaults to now if not provided
  temperature?: number;
  humidity?: number;
  co2?: number;
  lightIntensity?: number;
  notes?: string;
}