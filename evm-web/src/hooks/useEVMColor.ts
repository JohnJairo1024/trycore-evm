/* ============================================
   EVM DASHBOARD — Hook de Color Semántico
   ============================================ */

import { useMemo } from 'react';
import type { IndicatorType, EVMColorResult } from '../types';

/**
 * Determina el color, clases y etiqueta para un indicador EVM.
 * 
 * CPI/SPI: >= 1 es bueno (verde), < 1 es malo (rojo)
 * CV/SV: >= 0 es bueno (verde), < 0 es malo (rojo)
 */
export function useEVMColor(
  value: number | null | undefined,
  type: IndicatorType,
): EVMColorResult {
  return useMemo(() => {
    if (value === null || value === undefined) {
      return {
        color: '#6b7280',
        bgClass: 'bg-evm-neutral-light',
        textClass: 'text-evm-neutral',
        label: 'Sin datos',
        icon: 'neutral',
      };
    }

    const isGood = (type === 'cpi' || type === 'spi') ? value >= 1 : value >= 0;

    const labels: Record<IndicatorType, { good: string; bad: string }> = {
      cpi: { good: 'Under budget', bad: 'Over budget' },
      spi: { good: 'Ahead of schedule', bad: 'Behind schedule' },
      cv: { good: 'Under budget', bad: 'Over budget' },
      sv: { good: 'Ahead of schedule', bad: 'Behind schedule' },
    };

    if (isGood) {
      return {
        color: '#16a34a',
        bgClass: 'bg-evm-success-light',
        textClass: 'text-evm-success',
        label: labels[type].good,
        icon: 'up',
      };
    }

    return {
      color: '#dc2626',
      bgClass: 'bg-evm-danger-light',
      textClass: 'text-evm-danger',
      label: labels[type].bad,
      icon: 'down',
    };
  }, [value, type]);
}
