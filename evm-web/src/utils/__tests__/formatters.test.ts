/* ============================================
   Unit Tests — Formatters
   ============================================ */

import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatPercentage,
  formatIndex,
  formatDate,
  formatYAxis,
} from '../formatters';

describe('formatCurrency', () => {
  it('formats whole numbers with two decimals', () => {
    expect(formatCurrency(50000)).toBe('$50,000.00');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats negative values', () => {
    expect(formatCurrency(-15000)).toBe('-$15,000.00');
  });

  it('formats decimal values', () => {
    expect(formatCurrency(75187.97)).toBe('$75,187.97');
  });

  it('formats small values', () => {
    expect(formatCurrency(0.5)).toBe('$0.50');
  });
});

describe('formatPercentage', () => {
  it('formats integer percentages', () => {
    expect(formatPercentage(75)).toBe('75.00%');
  });

  it('formats decimal percentages', () => {
    expect(formatPercentage(33.3333)).toBe('33.33%');
  });

  it('formats zero', () => {
    expect(formatPercentage(0)).toBe('0.00%');
  });

  it('formats 100 percent', () => {
    expect(formatPercentage(100)).toBe('100.00%');
  });
});

describe('formatIndex', () => {
  it('formats CPI/SPI with two decimals', () => {
    expect(formatIndex(1.3333)).toBe('1.33');
  });

  it('formats exactly 1.0', () => {
    expect(formatIndex(1)).toBe('1.00');
  });

  it('formats zero', () => {
    expect(formatIndex(0)).toBe('0.00');
  });

  it('returns em-dash for null', () => {
    expect(formatIndex(null)).toBe('\u2014');
  });

  it('returns em-dash for undefined', () => {
    expect(formatIndex(undefined)).toBe('\u2014');
  });
});

describe('formatDate', () => {
  it('formats ISO date to readable format', () => {
    const result = formatDate('2026-07-26T10:00:00Z');
    expect(result).toMatch(/Jul/);
    expect(result).toMatch(/2026/);
  });

  it('handles Christmas date', () => {
    const result = formatDate('2025-12-25T00:00:00Z');
    expect(result).toMatch(/Dec/);
    expect(result).toMatch(/25/);
    expect(result).toMatch(/2025/);
  });
});

describe('formatYAxis', () => {
  it('formats thousands as k', () => {
    expect(formatYAxis(50000)).toBe('$50k');
  });

  it('formats millions as M', () => {
    expect(formatYAxis(1000000)).toBe('$1.0M');
  });

  it('formats small values as-is', () => {
    expect(formatYAxis(500)).toBe('$500');
  });

  it('formats zero', () => {
    expect(formatYAxis(0)).toBe('$0');
  });

  it('rounds thousands', () => {
    expect(formatYAxis(1234)).toBe('$1k');
  });
});
