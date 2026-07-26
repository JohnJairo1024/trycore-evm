/* ============================================
   Unit Tests — useEVMColor hook
   ============================================ */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEVMColor } from '../useEVMColor';
import type { IndicatorType } from '../../types';

describe('useEVMColor', () => {
  describe('CPI indicator', () => {
    const type: IndicatorType = 'cpi';

    it('returns green for CPI >= 1', () => {
      const { result } = renderHook(() => useEVMColor(1.33, type));
      expect(result.current.color).toBe('#16a34a');
      expect(result.current.label).toBe('Under budget');
      expect(result.current.icon).toBe('up');
    });

    it('returns green for CPI exactly 1', () => {
      const { result } = renderHook(() => useEVMColor(1, type));
      expect(result.current.color).toBe('#16a34a');
      expect(result.current.label).toBe('Under budget');
    });

    it('returns red for CPI < 1', () => {
      const { result } = renderHook(() => useEVMColor(0.67, type));
      expect(result.current.color).toBe('#dc2626');
      expect(result.current.label).toBe('Over budget');
      expect(result.current.icon).toBe('down');
    });

    it('returns neutral for null', () => {
      const { result } = renderHook(() => useEVMColor(null, type));
      expect(result.current.color).toBe('#6b7280');
      expect(result.current.label).toBe('Sin datos');
      expect(result.current.icon).toBe('neutral');
    });
  });

  describe('SPI indicator', () => {
    const type: IndicatorType = 'spi';

    it('returns green for SPI >= 1', () => {
      const { result } = renderHook(() => useEVMColor(1.2, type));
      expect(result.current.label).toBe('Ahead of schedule');
      expect(result.current.icon).toBe('up');
    });

    it('returns red for SPI < 1', () => {
      const { result } = renderHook(() => useEVMColor(0.6, type));
      expect(result.current.label).toBe('Behind schedule');
      expect(result.current.icon).toBe('down');
    });
  });

  describe('CV indicator', () => {
    const type: IndicatorType = 'cv';

    it('returns green for CV >= 0', () => {
      const { result } = renderHook(() => useEVMColor(15000, type));
      expect(result.current.label).toBe('Under budget');
      expect(result.current.icon).toBe('up');
    });

    it('returns red for negative CV', () => {
      const { result } = renderHook(() => useEVMColor(-15000, type));
      expect(result.current.label).toBe('Over budget');
      expect(result.current.icon).toBe('down');
    });
  });

  describe('SV indicator', () => {
    const type: IndicatorType = 'sv';

    it('returns green for SV >= 0', () => {
      const { result } = renderHook(() => useEVMColor(10000, type));
      expect(result.current.label).toBe('Ahead of schedule');
      expect(result.current.icon).toBe('up');
    });

    it('returns red for negative SV', () => {
      const { result } = renderHook(() => useEVMColor(-20000, type));
      expect(result.current.label).toBe('Behind schedule');
      expect(result.current.icon).toBe('down');
    });
  });

  describe('edge cases', () => {
    it('handles undefined value', () => {
      const { result } = renderHook(() => useEVMColor(undefined, 'cpi'));
      expect(result.current.color).toBe('#6b7280');
      expect(result.current.label).toBe('Sin datos');
    });

    it('handles zero CPI (special case)', () => {
      const { result } = renderHook(() => useEVMColor(0, 'cpi'));
      // 0 < 1 → red
      expect(result.current.color).toBe('#dc2626');
      expect(result.current.label).toBe('Over budget');
    });
  });
});
