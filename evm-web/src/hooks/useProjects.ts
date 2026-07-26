/* ============================================
   EVM DASHBOARD — TanStack Query Hooks
   ============================================ */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';
import type {
  Project,
  ProjectEVM,
  CreateProjectPayload,
  CreateActivityPayload,
  Activity,
} from '../types';

/* ---- Query Keys ---- */
export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
  evm: (projectId: string) => ['projects', projectId, 'evm'] as const,
  activities: (projectId: string) => ['projects', projectId, 'activities'] as const,
};

/* ---- Projects ---- */

/** Listar todos los proyectos */
export function useProjects() {
  return useQuery<Project[]>({
    queryKey: projectKeys.all,
    queryFn: api.getProjects,
  });
}

/** Obtener un proyecto por ID */
export function useProject(id: string) {
  return useQuery<Project>({
    queryKey: projectKeys.detail(id),
    queryFn: () => api.getProject(id),
    enabled: !!id,
  });
}

/** Crear un nuevo proyecto */
export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation<Project, Error, CreateProjectPayload>({
    mutationFn: api.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/** Eliminar un proyecto */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: api.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/* ---- EVM / Activities ---- */

/** Obtener indicadores EVM de un proyecto */
export function useProjectEVM(projectId: string) {
  return useQuery<ProjectEVM>({
    queryKey: projectKeys.evm(projectId),
    queryFn: () => api.getProjectEVM(projectId),
    enabled: !!projectId,
  });
}

/** Crear una actividad */
export function useCreateActivity(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation<Activity, Error, CreateActivityPayload>({
    mutationFn: (payload) => api.createActivity(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.evm(projectId) });
    },
  });
}

/** Actualizar una actividad */
export function useUpdateActivity(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation<Activity, Error, { activityId: string; payload: CreateActivityPayload }>({
    mutationFn: ({ activityId, payload }) =>
      api.updateActivity(projectId, activityId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.evm(projectId) });
    },
  });
}

/** Eliminar una actividad */
export function useDeleteActivity(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (activityId) => api.deleteActivity(projectId, activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.evm(projectId) });
    },
  });
}
