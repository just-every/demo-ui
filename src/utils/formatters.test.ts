import { describe, it, expect } from 'vitest';
import { formatBytes, truncateText } from './formatters';

describe('formatters', () => {
  it('formats bytes to human readable string', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(0)).toBe('0 B');
  });

  it('truncates text with ellipsis', () => {
    expect(truncateText('hello world', 5)).toBe('he...');
    expect(truncateText('short', 10)).toBe('short');
  });
});
