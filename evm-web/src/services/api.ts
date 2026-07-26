/* ============================================
   EVM DASHBOARD — API Client
   ============================================ */

import type {
  Project,
  Activity,
  ProjectEVM,
  CreateProjectPayload,
  CreateActivityPayload,
} from '../types';

import {
  mapProjectsResponse,
  mapProject,
  mapProjectEVM,
  mapActivity,
} from './mappers';

const BASE_URL = '/api/v1';

/**
 * Builds an absolute API URL.
 * In the browser, uses window.location.origin so relative URLs work
 * with the Vite proxy. Falls back to localhost:8000 for tests.
 */
function apiUrl(path: string): string {
  if (typeof window !== 'undefined' && window.location && window.location.host) {
    return `${window.location.origin}${BASE_URL}${path}`;
  }
  return `http://localhost:8000${BASE_URL}${path}`;
}

async function request(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(apiUrl(url), {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `API Error: ${response.status} ${response.statusText}${errorBody ? ` — ${errorBody}` : ''}`,
    );
  }

  return response;
}

/** Obtener todos los proyectos */
export async function getProjects(): Promise<Project[]> {
  const res = await request('/projects');
  const raw = await res.json();
  return mapProjectsResponse(raw);
}

/** Obtener un proyecto por ID */
export async function getProject(id: string): Promise<Project> {
  const res = await request(`/projects/${id}`);
  const raw = await res.json();
  return mapProject(raw);
}

/** Crear un nuevo proyecto */
export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const res = await request('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const raw = await res.json();
  return mapProject(raw);
}

/** Eliminar un proyecto */
export function deleteProject(id: string): Promise<void> {
  return request(`/projects/${id}`, { method: 'DELETE' }).then(() => undefined);
}

/** Obtener indicadores EVM de un proyecto (incluye actividades) */
export async function getProjectEVM(projectId: string): Promise<ProjectEVM> {
  const res = await request(`/projects/${projectId}/evm`);
  const raw = await res.json();
  return mapProjectEVM(raw);
}

/** Obtener actividades de un proyecto */
export async function getActivities(projectId: string): Promise<Activity[]> {
  const res = await request(`/projects/${projectId}/activities`);
  const raw = await res.json();
  return (raw as any[]).map(mapActivity);
}

/** Crear una actividad */
export async function createActivity(
  projectId: string,
  payload: CreateActivityPayload,
): Promise<Activity> {
  const res = await request(`/projects/${projectId}/activities`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const raw = await res.json();
  return mapActivity(raw);
}

/** Actualizar una actividad */
export async function updateActivity(
  projectId: string,
  activityId: string,
  payload: CreateActivityPayload,
): Promise<Activity> {
  const res = await request(
    `/projects/${projectId}/activities/${activityId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  );
  const raw = await res.json();
  return mapActivity(raw);
}

/** Eliminar una actividad */
export function deleteActivity(
  projectId: string,
  activityId: string,
): Promise<void> {
  return request(
    `/projects/${projectId}/activities/${activityId}`,
    { method: 'DELETE' },
  ).then(() => undefined);
}
