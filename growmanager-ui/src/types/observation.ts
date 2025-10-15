/**
 * Observation Type Definitions
 * Defines types for observation entities and related enums
 */

export type ObservationType =
  | 'health_check'
  | 'progress'
  | 'pest'
  | 'disease'
  | 'deficiency'
  | 'other';

export interface ObservationPhoto {
  fullSizeUrl: string;
  thumbnailUrl: string;
}

export interface Observation {
  id: string;
  plantId: string;
  plantName: string;
  timestamp: string; // ISO datetime
  note: string;
  observationType: ObservationType;
  photos: ObservationPhoto[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateObservationRequest {
  timestamp: string;
  note: string;
  observationType: ObservationType;
  tags?: string[];
}

export interface UpdateObservationRequest {
  timestamp?: string;
  note?: string;
  observationType?: ObservationType;
  tags?: string[];
}