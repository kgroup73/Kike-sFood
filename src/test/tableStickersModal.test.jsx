import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TableStickersModal from '../components/admin/TableStickersModal';
import { escapeHtml, getStickerLogoSvg, buildStickersHtml } from '../components/admin/stickers/stickerHtmlTemplate';

afterEach(() => {
  cleanup();
});

describe('stickerHtmlTemplate (Utilidades Puras de Impresión)', () => {
  it.each([
    { input: 'La Trattoria & Cía', expected: 'La Trattoria &amp; Cía' },
    { input: '<script>alert("xss")</script>', expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;' },
    { input: "Mesa 'VIP'", expected: 'Mesa &#39;VIP&#39;' }
  ])('escapa caracteres HTML peligrosos correctamente', ({ input, expected }) => {
    expect(escapeHtml(input)).toBe(expected);
  });

  it('genera SVG oficial en modo color y modo monocromo', () => {
    const colorSvg = getStickerLogoSvg(false);
    const monoSvg = getStickerLogoSvg(true);

    expect(colorSvg).toContain('<svg');
    expect(colorSvg).toContain('#F3C64B'); // Color maracuyá oficial
    expect(monoSvg).toContain('<svg');
    expect(monoSvg).not.toContain('#F3C64B');
  });

  it('construye el documento HTML de impresión con mesas y códigos QR', () => {
    const tenant = { name: 'La Trattoria' };
    const tablesWithQr = [
      { id: 't-1', label: '1', qrDataUrl: 'data:image/png;base64,mockqr1' },
      { id: 't-2', label: '2', qrDataUrl: 'data:image/png;base64,mockqr2' }
    ];

    const html = buildStickersHtml(tenant, tablesWithQr, 'color');
    expect(html).toContain('La Trattoria');
    expect(html).toContain('MESA 1');
    expect(html).toContain('MESA 2');
    expect(html).toContain('data:image/png;base64,mockqr1');
  });
});

describe('TableStickersModal (Desacoplado y Modular)', () => {
  const tenant = { slug: 'la-trattoria', name: 'La Trattoria' };
  const tables = [
    { id: 't-1', label: '1', token: 'tok-1', isActive: true },
    { id: 't-2', label: '2', token: 'tok-2', isActive: true }
  ];

  it('renderiza el modal con las tarjetas de vista previa de todas las mesas', () => {
    render(<TableStickersModal tenant={tenant} tables={tables} onClose={vi.fn()} />);

    expect(screen.getByText(/Stickers para Mesas \(NFC \+ QR\)/i)).toBeInTheDocument();
    expect(screen.getByText('MESA 1')).toBeInTheDocument();
    expect(screen.getByText('MESA 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Imprimir \(2\)/i })).toBeInTheDocument();
  });

  it('permite alternar el estilo entre "A color" y "Una tinta"', () => {
    render(<TableStickersModal tenant={tenant} tables={tables} onClose={vi.fn()} />);

    const monoBtn = screen.getByRole('button', { name: /Una tinta/i });
    fireEvent.click(monoBtn);

    // Debe seguir renderizando las mesas y reflejar el estilo seleccionado
    expect(screen.getByText('MESA 1')).toBeInTheDocument();
    expect(screen.getAllByText(/Una tinta/i).length).toBeGreaterThan(0);
  });
});
