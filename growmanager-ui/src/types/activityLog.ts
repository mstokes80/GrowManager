/**
 * Activity Log Type Definitions
 * Defines types for activity logs (training, pruning, maintenance, etc.)
 */

export type ActivityType = 'training' | 'pruning' | 'defoliation' | 'transplant' | 'pest_control' | 'other';

export interface ActivityLog {
  id: string;
  plantId: string;
  activityType: ActivityType;
  description: string;
  notes?: string;
  loggedAt: string;
  createdAt: string;
  updatedAt: string;

  // Optional plant info populated by backend
  plantTag?: string;
}

export interface CreateActivityLogRequest {
  plantId: string;
  activityType: ActivityType;
  description: string;
  notes?: string;
  loggedAt: string;
}

export interface UpdateActivityLogRequest {
  activityType?: ActivityType;
  description?: string;
  notes?: string;
  loggedAt?: string;
}