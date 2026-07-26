/* ============================================
   EVM DASHBOARD — Mock Data para desarrollo
   ============================================
   Datos realistas para probar el frontend sin backend.
   Los números siguen las fórmulas EVM correctas.
*/

import type { Project, ProjectEVM, ActivityWithEVM, Activity } from '../types';

/* ============================================
   PROYECTOS
   ============================================ */

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-alpha',
    name: 'Proyecto Alpha',
    description: 'Desarrollo de plataforma web core',
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-26T14:30:00Z',
    activityCount: 3,
    cpi: 1.25,
    spi: 1.10,
  },
  {
    id: 'proj-beta',
    name: 'Proyecto Beta',
    description: 'Migración de infraestructura cloud',
    createdAt: '2026-06-15T08:00:00Z',
    updatedAt: '2026-07-26T12:00:00Z',
    activityCount: 5,
    cpi: 0.75,
    spi: 0.85,
  },
  {
    id: 'proj-gamma',
    name: 'Proyecto Gamma',
    description: 'App móvil de reporting',
    createdAt: '2026-07-10T09:00:00Z',
    updatedAt: '2026-07-25T16:00:00Z',
    activityCount: 2,
    cpi: 1.00,
    spi: 1.00,
  },
  {
    id: 'proj-delta',
    name: 'Proyecto Delta',
    description: 'Sistema de autenticación unificado',
    createdAt: '2026-05-20T11:00:00Z',
    updatedAt: '2026-07-26T10:00:00Z',
    activityCount: 4,
    cpi: 0.92,
    spi: 1.05,
  },
  {
    id: 'proj-epsilon',
    name: 'Proyecto Epsilon',
    description: 'Optimización de base de datos',
    createdAt: '2026-07-18T13:00:00Z',
    updatedAt: '2026-07-24T09:00:00Z',
    activityCount: 0,
    cpi: null,
    spi: null,
  },
  {
    id: 'proj-zeta',
    name: 'Proyecto Zeta',
    description: 'Dashboard de métricas en tiempo real',
    createdAt: '2026-07-05T15:00:00Z',
    updatedAt: '2026-07-26T18:00:00Z',
    activityCount: 6,
    cpi: 1.35,
    spi: 0.90,
  },
];

/* ============================================
   ACTIVIDADES POR PROYECTO (con EVM calculados)
   ============================================ */

function calculateEVM(
  bac: number,
  plannedPct: number,
  actualPct: number,
  ac: number,
): {
  pv: number;
  ev: number;
  cv: number;
  sv: number;
  cpi: number;
  spi: number;
  eac: number;
  vac: number;
} {
  const pv = bac * (plannedPct / 100);
  const ev = bac * (actualPct / 100);
  const cv = ev - ac;
  const sv = ev - pv;
  const cpi = ac === 0 ? 1 : ev / ac;
  const spi = pv === 0 ? 1 : ev / pv;
  const eac = cpi === 0 ? bac : bac / cpi;
  const vac = bac - eac;

  return {
    pv: round2(pv),
    ev: round2(ev),
    cv: round2(cv),
    sv: round2(sv),
    cpi: round2(cpi),
    spi: round2(spi),
    eac: round2(eac),
    vac: round2(vac),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function createActivity(
  id: string,
  projectId: string,
  name: string,
  bac: number,
  plannedPct: number,
  actualPct: number,
  ac: number,
): ActivityWithEVM {
  const evm = calculateEVM(bac, plannedPct, actualPct, ac);
  return {
    id,
    projectId,
    name,
    bac,
    plannedPercentage: plannedPct,
    actualPercentage: actualPct,
    ac,
    ...evm,
  };
}

/* ---- Proyecto Alpha (saludable) ---- */
const ALPHA_ACTIVITIES: ActivityWithEVM[] = [
  createActivity('act-alpha-1', 'proj-alpha', 'Diseño de arquitectura', 20000, 100, 100, 15000),
  createActivity('act-alpha-2', 'proj-alpha', 'Desarrollo backend', 50000, 60, 70, 45000),
  createActivity('act-alpha-3', 'proj-alpha', 'Pruebas QA', 15000, 40, 50, 8000),
];

/* ---- Proyecto Beta (en alerta) ---- */
const BETA_ACTIVITIES: ActivityWithEVM[] = [
  createActivity('act-beta-1', 'proj-beta', 'Migración servidores', 40000, 80, 55, 38000),
  createActivity('act-beta-2', 'proj-beta', 'Configuración redes', 15000, 60, 40, 12000),
  createActivity('act-beta-3', 'proj-beta', 'Pruebas de carga', 20000, 30, 20, 18000),
  createActivity('act-beta-4', 'proj-beta', 'Documentación', 8000, 50, 60, 4000),
  createActivity('act-beta-5', 'proj-beta', 'Capacitación equipo', 12000, 20, 15, 5000),
];

/* ---- Proyecto Gamma (en plan) ---- */
const GAMMA_ACTIVITIES: ActivityWithEVM[] = [
  createActivity('act-gamma-1', 'proj-gamma', 'Diseño UI/UX', 25000, 40, 40, 10000),
  createActivity('act-gamma-2', 'proj-gamma', 'Desarrollo mobile', 60000, 20, 20, 12000),
];

/* ---- Proyecto Delta (mixto) ---- */
const DELTA_ACTIVITIES: ActivityWithEVM[] = [
  createActivity('act-delta-1', 'proj-delta', 'Implementación SSO', 30000, 100, 100, 28000),
  createActivity('act-delta-2', 'proj-delta', 'Integración LDAP', 20000, 80, 90, 22000),
  createActivity('act-delta-3', 'proj-delta', 'Portal de usuarios', 35000, 30, 25, 15000),
  createActivity('act-delta-4', 'proj-delta', 'Auditoría seguridad', 15000, 50, 60, 10000),
];

/* ---- Proyecto Epsilon (sin actividades) ---- */
const EPSILON_ACTIVITIES: ActivityWithEVM[] = [];

/* ---- Proyecto Zeta (CPI bueno, SPI malo) ---- */
const ZETA_ACTIVITIES: ActivityWithEVM[] = [
  createActivity('act-zeta-1', 'proj-zeta', 'Diseño de dashboard', 18000, 100, 100, 12000),
  createActivity('act-zeta-2', 'proj-zeta', 'Backend streaming', 45000, 70, 80, 30000),
  createActivity('act-zeta-3', 'proj-zeta', 'Widgets en tiempo real', 30000, 50, 55, 20000),
  createActivity('act-zeta-4', 'proj-zeta', 'Alertas y notificaciones', 22000, 40, 50, 18000),
  createActivity('act-zeta-5', 'proj-zeta', 'Integración Slack', 15000, 20, 30, 10000),
  createActivity('act-zeta-6', 'proj-zeta', 'Documentación técnica', 10000, 10, 15, 5000),
];

/* ============================================
   PROYECTOS COMPLETOS CON EVM
   ============================================ */

function buildProjectEVM(
  projectId: string,
  activities: ActivityWithEVM[],
): ProjectEVM {
  const totalBAC = activities.reduce((s, a) => s + a.bac, 0);
  const totalPV = activities.reduce((s, a) => s + a.pv, 0);
  const totalEV = activities.reduce((s, a) => s + a.ev, 0);
  const totalAC = activities.reduce((s, a) => s + a.ac, 0);
  const cpi = totalAC === 0 ? null : round2(totalEV / totalAC);
  const spi = totalPV === 0 ? null : round2(totalEV / totalPV);
  const eac = cpi && cpi > 0 ? round2(totalBAC / cpi) : totalBAC;
  const vac = round2(totalBAC - eac);

  return {
    projectId,
    totalBAC,
    totalPV,
    totalEV,
    totalAC,
    cpi,
    spi,
    eac: round2(eac),
    vac,
    activities,
  };
}

/* Mapa de projectId → actividades */
export const MOCK_ACTIVITIES_MAP: Record<string, ActivityWithEVM[]> = {
  'proj-alpha': ALPHA_ACTIVITIES,
  'proj-beta': BETA_ACTIVITIES,
  'proj-gamma': GAMMA_ACTIVITIES,
  'proj-delta': DELTA_ACTIVITIES,
  'proj-epsilon': EPSILON_ACTIVITIES,
  'proj-zeta': ZETA_ACTIVITIES,
};

/* Mapa de projectId → EVM completo */
export const MOCK_EVM_MAP: Record<string, ProjectEVM> = {};
for (const [projId, activities] of Object.entries(MOCK_ACTIVITIES_MAP)) {
  MOCK_EVM_MAP[projId] = buildProjectEVM(projId, activities);
}

/* ============================================
   ACTIVIDADES CRUD (base, sin EVM)
   ============================================ */

export const MOCK_ACTIVITIES_BASE: Record<string, Activity[]> = {};
for (const [projId, activities] of Object.entries(MOCK_ACTIVITIES_MAP)) {
  MOCK_ACTIVITIES_BASE[projId] = activities.map(
    ({ id, projectId, name, bac, plannedPercentage, actualPercentage, ac }) => ({
      id,
      projectId,
      name,
      bac,
      plannedPercentage,
      actualPercentage,
      ac,
    }),
  );
}
