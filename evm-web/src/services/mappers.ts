/* ============================================
   EVM DASHBOARD — API Response Mappers
   Transforma snake_case del backend a camelCase del frontend
   ============================================ */

import type {
  Project,
  ProjectEVM,
  ActivityWithEVM,
  Activity,
} from '../types';

/* ----------------------------------------------------------
   Helpers
   ---------------------------------------------------------- */

/** Convierte un string numérico a number, o 0 si es inválido */
function toNum(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

/** Convierte un string numérico a number | null */
function toNumOrNull(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  const n = parseFloat(val);
  return isNaN(n) ? null : Math.round(n * 100) / 100;
}

/* ----------------------------------------------------------
   Project (from API list item o detail)
   ---------------------------------------------------------- */

interface RawProject {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  /** Opcionales — pueden venir en detail pero no en list */
  activity_count?: number;
  cpi?: string | number | null;
  spi?: string | number | null;
}

export function mapProject(raw: RawProject): Project {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    activityCount: raw.activity_count ?? 0,
    cpi: toNumOrNull(raw.cpi),
    spi: toNumOrNull(raw.spi),
  };
}

/* ----------------------------------------------------------
   Projects list (el backend envuelve en { items: [...] })
   ---------------------------------------------------------- */

interface RawProjectsResponse {
  items: RawProject[];
  total?: number;
  skip?: number;
  limit?: number;
}

export function mapProjectsResponse(raw: RawProjectsResponse): Project[] {
  return (raw.items ?? []).map(mapProject);
}

/* ----------------------------------------------------------
   ActivityWithEVM (dentro de la respuesta EVM)
   ---------------------------------------------------------- */

interface RawActivityEVM {
  activity_id: string;
  activity_name: string;
  bac: string | number;
  planned_percentage: string | number;
  actual_percentage: string | number;
  actual_cost: string | number;
  pv: string | number;
  ev: string | number;
  cv: string | number;
  sv: string | number;
  cpi: string | number | null;
  spi: string | number | null;
  eac: string | number;
  vac: string | number;
}

function mapActivityEVM(
  raw: RawActivityEVM,
  projectId: string,
): ActivityWithEVM {
  return {
    id: raw.activity_id,
    projectId,
    name: raw.activity_name,
    bac: toNum(raw.bac),
    plannedPercentage: toNum(raw.planned_percentage),
    actualPercentage: toNum(raw.actual_percentage),
    ac: toNum(raw.actual_cost),
    pv: toNum(raw.pv),
    ev: toNum(raw.ev),
    cv: toNum(raw.cv),
    sv: toNum(raw.sv),
    cpi: toNumOrNull(raw.cpi),
    spi: toNumOrNull(raw.spi),
    eac: toNum(raw.eac),
    vac: toNum(raw.vac),
  };
}

/* ----------------------------------------------------------
   ProjectEVM
   ---------------------------------------------------------- */

interface RawProjectEVM {
  project_id: string;
  project_name?: string;
  total_bac: string | number;
  total_actual_cost: string | number;
  total_pv: string | number;
  total_ev: string | number;
  cv?: string | number;
  sv?: string | number;
  cpi: string | number | null;
  spi: string | number | null;
  eac: string | number;
  vac: string | number;
  activities: RawActivityEVM[];
}

export function mapProjectEVM(raw: RawProjectEVM): ProjectEVM {
  const projectId = raw.project_id;
  return {
    projectId,
    totalBAC: toNum(raw.total_bac),
    totalPV: toNum(raw.total_pv),
    totalEV: toNum(raw.total_ev),
    totalAC: toNum(raw.total_actual_cost),
    cpi: toNumOrNull(raw.cpi),
    spi: toNumOrNull(raw.spi),
    eac: toNum(raw.eac),
    vac: toNum(raw.vac),
    activities: (raw.activities ?? []).map((a) => mapActivityEVM(a, projectId)),
  };
}

/* ----------------------------------------------------------
   Activity (respuesta CRUD individual)
   ---------------------------------------------------------- */

interface RawActivity {
  activity_id?: string;
  id?: string;
  project_id?: string;
  activity_name?: string;
  name?: string;
  bac: string | number;
  planned_percentage: string | number;
  actual_percentage: string | number;
  actual_cost: string | number;
}

export function mapActivity(raw: RawActivity): Activity {
  return {
    id: raw.activity_id ?? raw.id ?? '',
    projectId: raw.project_id ?? '',
    name: raw.activity_name ?? raw.name ?? '',
    bac: toNum(raw.bac),
    plannedPercentage: toNum(raw.planned_percentage),
    actualPercentage: toNum(raw.actual_percentage),
    ac: toNum(raw.actual_cost),
  };
}
