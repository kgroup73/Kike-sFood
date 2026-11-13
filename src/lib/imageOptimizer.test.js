import { describe, it, expect } from 'vitest';
import { calculateDimensions, formatFileSize } from './imageOptimizer';

describe('imageOptimizer', () => {
  it('mantiene las dimensiones si son menores al máximo permitido', () => {
    const dim = calculateDimensions(800, 600, 1080);
    expect(dim.width).toBe(800);
    expect(dim.height).toBe(600);
  });

  it('escala proporcionalmente una imagen horizontal más ancha que 1080px', () => {
    const dim = calculateDimensions(2160, 1080, 1080);
    expect(dim.width).toBe(1080);
    expect(dim.height).toBe(540);
  });

  it('escala proporcionalmente una imagen vertical más alta que 1080px', () => {
    const dim = calculateDimensions(1080, 2160, 1080);
    expect(dim.width).toBe(540);
    expect(dim.height).toBe(1080);
  });

  it('escala imágenes cuadradas de alta resolución', () => {
    const dim = calculateDimensions(3000, 3000, 1080);
    expect(dim.width).toBe(1080);
    expect(dim.height).toBe(1080);
  });

  it('formatea el tamaño de archivo en KB y MB correctamente', () => {
    expect(formatFileSize(0)).toBe('0 KB');
    expect(formatFileSize(150 * 1024)).toBe('150 KB');
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });
});
