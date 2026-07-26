/* ============================================
   Unit Tests — API Response Mappers
   Tests snake_case → camelCase transformation
   ============================================ */

import { describe, it, expect } from 'vitest';
import { mapProject, mapProjectsResponse, mapProjectEVM, mapActivity } from '../mappers';

describe('mapProject', () => {
  it('transforms snake_case to camelCase', () => {
    const raw = {
      id: 'abc-123',
      name: 'Test Project',
      description: 'A description',
      created_at: '2026-07-26T10:00:00Z',
      updated_at: '2026-07-26T12:00:00Z',
      activity_count: 3,
      cpi: 1.25,
      spi: 0.80,
    };

    const result = mapProject(raw);
    expect(result).toEqual({
      id: 'abc-123',
      name: 'Test Project',
      description: 'A description',
      createdAt: '2026-07-26T10:00:00Z',
      updatedAt: '2026-07-26T12:00:00Z',
      activityCount: 3,
      cpi: 1.25,
      spi: 0.80,
    });
  });

  it('handles missing optional fields', () => {
    const raw = {
      id: 'abc-123',
      name: 'Minimal',
      created_at: '2026-07-26T10:00:00Z',
      updated_at: '2026-07-26T12:00:00Z',
    };

    const result = mapProject(raw);
    expect(result.description).toBe('');
    expect(result.activityCount).toBe(0);
    expect(result.cpi).toBeNull();
    expect(result.spi).toBeNull();
  });

  it('converts numeric strings to numbers', () => {
    const raw = {
      id: 'abc-123',
      name: 'Test',
      created_at: '2026-07-26T10:00:00Z',
      updated_at: '2026-07-26T12:00:00Z',
      cpi: '1.33',
      spi: '0.67',
    };

    const result = mapProject(raw);
    expect(result.cpi).toBe(1.33);
    expect(result.spi).toBe(0.67);
  });

  it('handles null cpi/spi', () => {
    const raw = {
      id: 'abc-123',
      name: 'Test',
      created_at: '2026-07-26T10:00:00Z',
      updated_at: '2026-07-26T12:00:00Z',
      cpi: null,
      spi: null,
    };

    const result = mapProject(raw);
    expect(result.cpi).toBeNull();
    expect(result.spi).toBeNull();
  });
});

describe('mapProjectsResponse', () => {
  it('extracts items from paginated response', () => {
    const raw = {
      items: [
        { id: '1', name: 'A', created_at: '', updated_at: '' },
        { id: '2', name: 'B', created_at: '', updated_at: '' },
      ],
      total: 2,
      skip: 0,
      limit: 100,
    };

    const result = mapProjectsResponse(raw);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('A');
    expect(result[1].name).toBe('B');
  });

  it('returns empty array for empty items', () => {
    const result = mapProjectsResponse({ items: [] });
    expect(result).toEqual([]);
  });

  it('handles missing items field', () => {
    const result = mapProjectsResponse({} as any);
    expect(result).toEqual([]);
  });
});

describe('mapProjectEVM', () => {
  it('transforms EVM response with single activity', () => {
    const raw = {
      project_id: 'proj-1',
      total_bac: 50000,
      total_actual_cost: 25500,
      total_pv: 28000,
      total_ev: 21000,
      cv: -4500,
      sv: -7000,
      cpi: 0.82,
      spi: 0.75,
      eac: 60975.61,
      vac: -10975.61,
      activities: [
        {
          activity_id: 'act-1',
          activity_name: 'Design',
          bac: 20000,
          planned_percentage: 50,
          actual_percentage: 30,
          actual_cost: 7500,
          pv: 10000,
          ev: 6000,
          cv: -1500,
          sv: -4000,
          cpi: 0.80,
          spi: 0.60,
          eac: 25000,
          vac: -5000,
        },
      ],
    };

    const result = mapProjectEVM(raw);
    expect(result.projectId).toBe('proj-1');
    expect(result.totalBAC).toBe(50000);
    expect(result.totalPV).toBe(28000);
    expect(result.totalEV).toBe(21000);
    expect(result.totalAC).toBe(25500);
    expect(result.cpi).toBe(0.82);
    expect(result.spi).toBe(0.75);
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].name).toBe('Design');
    expect(result.activities[0].pv).toBe(10000);
    expect(result.activities[0].cpi).toBe(0.80);
  });

  it('handles empty activities', () => {
    const raw = {
      project_id: 'proj-1',
      total_bac: 0,
      total_actual_cost: 0,
      total_pv: 0,
      total_ev: 0,
      cpi: 0,
      spi: 0,
      eac: 0,
      vac: 0,
      activities: [],
    };

    const result = mapProjectEVM(raw);
    expect(result.activities).toEqual([]);
    expect(result.totalBAC).toBe(0);
  });

  it('converts string numbers to proper numbers', () => {
    const raw = {
      project_id: 'proj-1',
      total_bac: '50000.00',
      total_actual_cost: '25500.00',
      total_pv: '28000.00',
      total_ev: '21000.00',
      cpi: '0.82',
      spi: '0.75',
      eac: '60975.61',
      vac: '-10975.61',
      activities: [],
    };

    const result = mapProjectEVM(raw);
    expect(result.totalBAC).toBe(50000);
    expect(result.cpi).toBe(0.82);
    expect(result.vac).toBe(-10975.61);
  });

  it('handles null cpi/spi', () => {
    const raw = {
      project_id: 'proj-1',
      total_bac: 0,
      total_actual_cost: 0,
      total_pv: 0,
      total_ev: 0,
      cpi: null,
      spi: null,
      eac: 0,
      vac: 0,
      activities: [],
    };

    const result = mapProjectEVM(raw);
    expect(result.cpi).toBeNull();
    expect(result.spi).toBeNull();
  });
});

describe('mapActivity', () => {
  it('transforms activity from activities list response', () => {
    const raw = {
      id: 'act-1',
      project_id: 'proj-1',
      name: 'Design',
      bac: 20000,
      planned_percentage: 50,
      actual_percentage: 30,
      actual_cost: 7500,
    };

    const result = mapActivity(raw);
    expect(result).toEqual({
      id: 'act-1',
      projectId: 'proj-1',
      name: 'Design',
      bac: 20000,
      plannedPercentage: 50,
      actualPercentage: 30,
      ac: 7500,
    });
  });

  it('handles alternative field names (activity_id vs id)', () => {
    const raw = {
      activity_id: 'act-1',
      activity_name: 'Design',
      project_id: 'proj-1',
      bac: 20000,
      planned_percentage: 50,
      actual_percentage: 30,
      actual_cost: 7500,
    };

    const result = mapActivity(raw);
    expect(result.id).toBe('act-1');
    expect(result.name).toBe('Design');
  });

  it('handles missing fields with defaults', () => {
    const result = mapActivity({} as any);
    expect(result.id).toBe('');
    expect(result.projectId).toBe('');
    expect(result.name).toBe('');
    expect(result.bac).toBe(0);
    expect(result.plannedPercentage).toBe(0);
    expect(result.actualPercentage).toBe(0);
    expect(result.ac).toBe(0);
  });

  it('converts string numbers to proper numbers', () => {
    const raw = {
      id: 'act-1',
      project_id: 'proj-1',
      name: 'Design',
      bac: '20000.00',
      planned_percentage: '50.00',
      actual_percentage: '30.00',
      actual_cost: '7500.00',
    };

    const result = mapActivity(raw);
    expect(result.bac).toBe(20000);
    expect(result.plannedPercentage).toBe(50);
    expect(result.actualPercentage).toBe(30);
    expect(result.ac).toBe(7500);
  });
});
