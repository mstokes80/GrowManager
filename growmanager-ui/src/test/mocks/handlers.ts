import { http, HttpResponse, delay } from 'msw';
import { Plant, CreatePlantRequest, UpdatePlantRequest } from '@/types/plant';
import {
  FeedingEvent,
  CreateFeedingEventRequest,
  UpdateFeedingEventRequest,
} from '@/types/feedingEvent';
import {
  ActivityLog,
  CreateActivityLogRequest,
  UpdateActivityLogRequest,
} from '@/types/activityLog';

// Mock data factories
export const createMockPlant = (overrides?: Partial<Plant>): Plant => ({
  id: 'plant-1',
  growId: 'grow-1',
  cultivarId: 'cultivar-1',
  plantTag: 'Plant #1',
  plantedDate: '2025-01-01T00:00:00Z',
  stage: 'vegetative',
  healthStatus: 'healthy',
  notes: 'Test plant notes',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-05T00:00:00Z',
  cultivarName: 'Blue Dream',
  ...overrides,
});

export const createMockFeedingEvent = (overrides?: Partial<FeedingEvent>): FeedingEvent => ({
  id: 'feeding-1',
  plantId: 'plant-1',
  feedingType: 'nutrients',
  amountMl: 500,
  ecLevel: 1.5,
  phLevel: 6.2,
  nutrientMix: 'Grow nutrients',
  notes: 'Fed with grow nutrients',
  fedAt: '2025-01-05T10:00:00Z',
  createdAt: '2025-01-05T10:00:00Z',
  updatedAt: '2025-01-05T10:00:00Z',
  plantTag: 'Plant #1',
  ...overrides,
});

export const createMockActivityLog = (overrides?: Partial<ActivityLog>): ActivityLog => ({
  id: 'activity-1',
  plantId: 'plant-1',
  activityType: 'training',
  description: 'LST training',
  notes: 'Bent main stem to promote lateral growth',
  loggedAt: '2025-01-04T14:00:00Z',
  createdAt: '2025-01-04T14:00:00Z',
  updatedAt: '2025-01-04T14:00:00Z',
  plantTag: 'Plant #1',
  ...overrides,
});

// Mock handlers
export const handlers = [
  // Plants API
  http.get('/api/plants', async () => {
    await delay(100);
    return HttpResponse.json([
      createMockPlant(),
      createMockPlant({
        id: 'plant-2',
        plantTag: 'Plant #2',
        stage: 'flowering',
        healthStatus: 'stressed',
      }),
      createMockPlant({
        id: 'plant-3',
        plantTag: 'Plant #3',
        stage: 'seedling',
        healthStatus: 'healthy',
      }),
    ]);
  }),

  http.get('/api/plants/:plantId', async ({ params }) => {
    await delay(100);
    const { plantId } = params;
    return HttpResponse.json(createMockPlant({ id: plantId as string }));
  }),

  http.post('/api/plants', async ({ request }) => {
    await delay(100);
    const body = (await request.json()) as CreatePlantRequest;
    return HttpResponse.json(
      createMockPlant({
        ...body,
        id: 'new-plant-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      { status: 201 }
    );
  }),

  http.put('/api/plants/:plantId', async ({ params, request }) => {
    await delay(100);
    const { plantId } = params;
    const body = (await request.json()) as UpdatePlantRequest;
    return HttpResponse.json(
      createMockPlant({
        id: plantId as string,
        ...body,
        updatedAt: new Date().toISOString(),
      })
    );
  }),

  http.delete('/api/plants/:plantId', async () => {
    await delay(100);
    return new HttpResponse(null, { status: 204 });
  }),

  // Feeding Events API
  http.get('/api/plants/:plantId/feeding-events', async ({ params }) => {
    await delay(100);
    const { plantId } = params;
    return HttpResponse.json([
      createMockFeedingEvent({ plantId: plantId as string }),
      createMockFeedingEvent({
        id: 'feeding-2',
        plantId: plantId as string,
        feedingType: 'watering',
        amountMl: 300,
        ecLevel: undefined,
        phLevel: 6.5,
        nutrientMix: undefined,
        notes: 'Plain water',
        fedAt: '2025-01-03T10:00:00Z',
      }),
    ]);
  }),

  http.post('/api/plants/:plantId/feeding-events', async ({ params, request }) => {
    await delay(100);
    const { plantId } = params;
    const body = (await request.json()) as CreateFeedingEventRequest;
    return HttpResponse.json(
      createMockFeedingEvent({
        ...body,
        plantId: plantId as string,
        id: 'new-feeding-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      { status: 201 }
    );
  }),

  http.put('/api/feeding-events/:eventId', async ({ params, request }) => {
    await delay(100);
    const { eventId } = params;
    const body = (await request.json()) as UpdateFeedingEventRequest;
    return HttpResponse.json(
      createMockFeedingEvent({
        id: eventId as string,
        ...body,
        updatedAt: new Date().toISOString(),
      })
    );
  }),

  http.delete('/api/feeding-events/:eventId', async () => {
    await delay(100);
    return new HttpResponse(null, { status: 204 });
  }),

  // Activity Logs API
  http.get('/api/plants/:plantId/activity-logs', async ({ params }) => {
    await delay(100);
    const { plantId } = params;
    return HttpResponse.json([
      createMockActivityLog({ plantId: plantId as string }),
      createMockActivityLog({
        id: 'activity-2',
        plantId: plantId as string,
        activityType: 'pruning',
        description: 'Removed lower fan leaves',
        notes: 'Improved air circulation',
        loggedAt: '2025-01-02T14:00:00Z',
      }),
    ]);
  }),

  http.post('/api/plants/:plantId/activity-logs', async ({ params, request }) => {
    await delay(100);
    const { plantId } = params;
    const body = (await request.json()) as CreateActivityLogRequest;
    return HttpResponse.json(
      createMockActivityLog({
        ...body,
        plantId: plantId as string,
        id: 'new-activity-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      { status: 201 }
    );
  }),

  http.put('/api/activity-logs/:logId', async ({ params, request }) => {
    await delay(100);
    const { logId } = params;
    const body = (await request.json()) as UpdateActivityLogRequest;
    return HttpResponse.json(
      createMockActivityLog({
        id: logId as string,
        ...body,
        updatedAt: new Date().toISOString(),
      })
    );
  }),

  http.delete('/api/activity-logs/:logId', async () => {
    await delay(100);
    return new HttpResponse(null, { status: 204 });
  }),

  // Cultivars API (needed for plant form)
  http.get('/api/cultivars', async () => {
    await delay(100);
    return HttpResponse.json([
      {
        id: 'cultivar-1',
        userId: 'user-1',
        name: 'Blue Dream',
        breeder: 'HSC',
        description: 'Sativa-dominant hybrid',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: 'cultivar-2',
        userId: 'user-1',
        name: 'OG Kush',
        breeder: 'Unknown',
        description: 'Classic indica',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ]);
  }),

  // Grows API (needed for plants list page)
  http.get('/api/grows', async () => {
    await delay(100);
    return HttpResponse.json([
      {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Summer 2025',
        startDate: '2025-01-01T00:00:00Z',
        status: 'vegetative',
        environmentType: 'indoor',
        notes: 'First grow of the year',
        isArchived: false,
        plantCount: 3,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-05T00:00:00Z',
      },
      {
        id: 'grow-2',
        userId: 'user-1',
        name: 'Fall 2024',
        startDate: '2024-09-01T00:00:00Z',
        status: 'harvested',
        environmentType: 'outdoor',
        notes: 'Outdoor harvest',
        isArchived: true,
        plantCount: 6,
        createdAt: '2024-09-01T00:00:00Z',
        updatedAt: '2024-11-15T00:00:00Z',
      },
    ]);
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = {
  plantsError: http.get('/api/plants', async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Failed to fetch plants' }, { status: 500 });
  }),

  createPlantError: http.post('/api/plants', async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Failed to create plant' }, { status: 500 });
  }),

  feedingEventsError: http.get('/api/plants/:plantId/feeding-events', async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Failed to fetch feeding events' }, { status: 500 });
  }),

  createFeedingError: http.post('/api/plants/:plantId/feeding-events', async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Failed to create feeding event' }, { status: 500 });
  }),

  activityLogsError: http.get('/api/plants/:plantId/activity-logs', async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Failed to fetch activity logs' }, { status: 500 });
  }),

  createActivityError: http.post('/api/plants/:plantId/activity-logs', async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Failed to create activity log' }, { status: 500 });
  }),
};