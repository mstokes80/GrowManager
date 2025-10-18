/**
 * Harvest-related types for the GrowManager application.
 */

export type WeightUnit = 'GRAMS' | 'OUNCES';

export interface Harvest {
  id: string;
  plantId: string;
  plantTag: string;
  growId: string;
  cultivarName: string | null;
  harvestDate: string; // ISO date string
  wetWeight: number;
  dryWeight: number | null;
  weightUnit: WeightUnit;
  thcPercent: number | null;
  cbdPercent: number | null;
  terpeneProfile: string | null;
  qualityRating: number | null; // 1-10
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHarvestRequest {
  harvestDate: string; // ISO date string
  wetWeight: number;
  dryWeight?: number;
  weightUnit: WeightUnit;
  thcPercent?: number;
  cbdPercent?: number;
  terpeneProfile?: string;
  qualityRating?: number; // 1-10
  notes?: string;
}

export interface UpdateHarvestRequest {
  dryWeight?: number;
  thcPercent?: number;
  cbdPercent?: number;
  terpeneProfile?: string;
  qualityRating?: number; // 1-10
  notes?: string;
}

export interface HarvestSummary {
  totalPlantsHarvested: number;
  totalWetWeight: number;
  totalDryWeight: number;
  averageQuality: number;
  harvests: Harvest[];
}