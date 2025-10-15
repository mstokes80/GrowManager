/**
 * Feeding Event Type Definitions
 * Defines types for feeding events (watering, nutrients, foliar)
 */

export type FeedingType = 'watering' | 'nutrients' | 'foliar';

export type AmendmentUnit =
  | 'teaspoons'
  | 'tablespoons'
  | 'cups'
  | 'grams'
  | 'kilograms'
  | 'ounces'
  | 'pounds'
  | 'milliliters'
  | 'liters';

export interface Amendment {
  name: string;
  amount: number;
  unit: AmendmentUnit;
}

export interface FeedingEvent {
  id: string;
  plantId: string;
  feedingType: FeedingType;
  amountMl: number;
  ecLevel?: number;
  phLevel?: number;
  nutrientMix?: string;
  amendments?: Amendment[];
  notes?: string;
  fedAt: string;
  createdAt: string;
  updatedAt: string;

  // Optional plant info populated by backend
  plantTag?: string;
}

export interface CreateFeedingEventRequest {
  plantId: string;
  feedingType: FeedingType;
  amountMl: number;
  ecLevel?: number;
  phLevel?: number;
  nutrientMix?: string;
  notes?: string;
  fedAt: string;
}

export interface UpdateFeedingEventRequest {
  feedingType?: FeedingType;
  amountMl?: number;
  ecLevel?: number;
  phLevel?: number;
  nutrientMix?: string;
  notes?: string;
  fedAt?: string;
}

export interface FeedingEventStats {
  totalFeedings: number;
  totalWaterings: number;
  totalNutrientFeedings: number;
  totalFoliarFeedings: number;
  totalAmountMl: number;
  averageAmountMl: number;
  lastFeedingDate?: string;
}