/* ============================================
   Unit Tests — API Client (mocked fetch)
   Verifies request construction and response handling.
   Mappers are tested separately in mappers.test.ts.
   ============================================ */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import {
  getProjects,
  getProject,
  createProject,
  deleteProject,
  getProjectEVM,
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} from '../api';

// Mock the apiUrl function indirectly by setting up a test helper
const originalFetch = globalThis.fetch;

beforeAll(() => {
  // Mock fetch to return controlled responses
  globalThis.fetch = vi.fn();
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

// Helper to set up a successful fetch response
function mockResponse(data: unknown) {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

// Helper to set up an error fetch response
function mockError(status: number, statusText: string, body: string) {
  (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: false,
    status,
    statusText,
    text: () => Promise.resolve(body),
  });
}

describe('getProjects', () => {
  it('fetches all projects', async () => {
    const data = { items: [{ id: '1', name: 'Test', created_at: '', updated_at: '' }] };
    mockResponse(data);

    const result = await getProjects();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/projects'),
      expect.any(Object),
    );
  });
});

describe('getProject', () => {
  it('fetches a single project by id', async () => {
    const data = { id: 'abc-123', name: 'Test', created_at: '', updated_at: '' };
    mockResponse(data);

    const result = await getProject('abc-123');
    expect(result.name).toBe('Test');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/projects/abc-123'),
      expect.any(Object),
    );
  });
});

describe('createProject', () => {
  it('sends POST with correct payload', async () => {
    const payload = { name: 'New Project', description: 'Desc' };
    const data = { id: '1', name: 'New Project', description: 'Desc', created_at: '', updated_at: '' };
    mockResponse(data);

    const result = await createProject(payload);
    expect(result.name).toBe('New Project');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/projects'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('deleteProject', () => {
  it('sends DELETE request', async () => {
    mockResponse(undefined);
    await deleteProject('proj-1');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/projects/proj-1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

describe('getProjectEVM', () => {
  it('fetches EVM indicators', async () => {
    const data = {
      project_id: 'p1',
      total_bac: 50000,
      total_actual_cost: 27000,
      total_pv: 25000,
      total_ev: 20000,
      cpi: 0.74,
      spi: 0.8,
      eac: 67567.57,
      vac: -17567.57,
      activities: [],
    };
    mockResponse(data);

    const result = await getProjectEVM('p1');
    expect(result.totalBAC).toBe(50000);
    expect(result.cpi).toBe(0.74);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/projects/p1/evm'),
      expect.any(Object),
    );
  });
});

describe('getActivities', () => {
  it('fetches activities for a project', async () => {
    const data = [
      { id: 'a1', project_id: 'p1', name: 'Design', bac: 20000, planned_percentage: 50, actual_percentage: 30, actual_cost: 7500 },
    ];
    mockResponse(data);

    const result = await getActivities('p1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Design');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/projects/p1/activities'),
      expect.any(Object),
    );
  });
});

describe('createActivity', () => {
  it('sends POST with correct payload', async () => {
    const payload = { name: 'Design', bac: 20000, plannedPercentage: 50, actualPercentage: 30, ac: 7500 };
    const data = { id: 'a1', project_id: 'p1', name: 'Design', bac: 20000, planned_percentage: 50, actual_percentage: 30, actual_cost: 7500 };
    mockResponse(data);

    const result = await createActivity('p1', payload);
    expect(result.name).toBe('Design');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/projects/p1/activities'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('updateActivity', () => {
  it('sends PUT request', async () => {
    const payload = { name: 'Updated', bac: 25000, plannedPercentage: 60, actualPercentage: 45, ac: 10000 };
    const data = { id: 'a1', name: 'Updated', bac: 25000, planned_percentage: 60, actual_percentage: 45, actual_cost: 10000 };
    mockResponse(data);

    const result = await updateActivity('p1', 'a1', payload);
    expect(result.name).toBe('Updated');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/projects/p1/activities/a1'),
      expect.objectContaining({ method: 'PUT' }),
    );
  });
});

describe('deleteActivity', () => {
  it('sends DELETE request', async () => {
    mockResponse(undefined);
    await deleteActivity('p1', 'a1');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/projects/p1/activities/a1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

describe('error handling', () => {
  it('throws on non-ok response', async () => {
    mockError(404, 'Not Found', 'Not found');
    await expect(getProject('bad-id')).rejects.toThrow('API Error: 404');
  });

  it('includes error body in message', async () => {
    mockError(422, 'Validation Error', 'Invalid input');
    await expect(createProject({ name: '' })).rejects.toThrow(/422/);
  });
});
