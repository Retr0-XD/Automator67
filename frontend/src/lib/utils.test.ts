import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges class names', () => {
    const result = cn('px-2', 'py-1');
    expect(result).toBe('px-2 py-1');
  });

  it('handles conditional classes', () => {
    const isBold = true;
    const isSmall = false;
    const result = cn('px-2', isSmall && 'py-1', isBold && 'font-bold');
    expect(result).toContain('px-2');
    expect(result).toContain('font-bold');
    expect(result).not.toContain('py-1');
  });

  it('merges tailwind conflicting utilities', () => {
    const result = cn('px-2 px-4');
    expect(result).toContain('px-4');
  });

  it('handles object syntax', () => {
    const result = cn({
      'px-2': true,
      'py-1': false,
      'font-bold': true,
    });
    expect(result).toContain('px-2');
    expect(result).toContain('font-bold');
  });
});
