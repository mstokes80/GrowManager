/**
 * Plant Type Definitions
 * Defines types for plant entities and related enums
 */

export type PlantStage = 'seedling' | 'vegetative' | 'flowering' | 'harvested';
export type HealthStatus = 'healthy' | 'stressed' | 'sick' | 'dead';

export interface Plant {
  id: string;
  growId: string;
  cultivarId?: string;
  plantTag: string;
  plantedDate: string;
  stage: PlantStage;
  healthStatus: HealthStatus;
  notes?: string;
  harvestedDate?: string;
  createdAt: string;
  updatedAt: string;

  // Optional cultivar info populated by backend
  cultivarName?: string;
}

export interface CreatePlantRequest {
  growId: string;
  cultivarId?: string;
  plantTag: string;
  plantedDate: string;
  stage: PlantStage;
  healthStatus: HealthStatus;
  notes?: string;
}

export interface UpdatePlantRequest {
  cultivarId?: string;
  plantTag?: string;
  stage?: PlantStage;
  healthStatus?: HealthStatus;
  notes?: string;
  harvestedDate?: string;
}