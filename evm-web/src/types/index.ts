/* ============================================
   EVM DASHBOARD — TypeScript Interfaces
   ============================================ */

/** Proyecto */
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  activityCount: number;
  cpi: number | null;
  spi: number | null;
}

/** Actividad dentro de un proyecto */
export interface Activity {
  id: string;
  projectId: string;
  name: string;
  bac: number;
  plannedPercentage: number;
  actualPercentage: number;
  ac: number;
}

/** Indicadores EVM calculados por el backend */
export interface EVMIndicators {
  pv: number;
  ev: number;
  cv: number;
  sv: number;
  cpi: number | null;
  spi: number | null;
  eac: number;
  vac: number;
}

/** Actividad con todos los indicadores EVM */
export interface ActivityWithEVM extends Activity, EVMIndicators {}

/** Resumen EVM del proyecto */
export interface ProjectEVM {
  projectId: string;
  totalBAC: number;
  totalPV: number;
  totalEV: number;
  totalAC: number;
  cpi: number | null;
  spi: number | null;
  eac: number;
  vac: number;
  activities: ActivityWithEVM[];
}

/** Datos para la gráfica */
export interface ChartDataPoint {
  name: string;
  pv: number;
  ev: number;
  ac: number;
}

/** Payload para crear un proyecto */
export interface CreateProjectPayload {
  name: string;
  description?: string;
}

/** Payload para crear/editar una actividad */
export interface CreateActivityPayload {
  name: string;
  bac: number;
  plannedPercentage: number;
  actualPercentage: number;
  ac: number;
}

/** Tipo de indicador para determinar color */
export type IndicatorType = 'cpi' | 'spi' | 'cv' | 'sv';

/** Resultado de evaluación de color */
export interface EVMColorResult {
  color: string;
  bgClass: string;
  textClass: string;
  label: string;
  icon: 'up' | 'down' | 'neutral';
}
