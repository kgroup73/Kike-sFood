import { describe, it, expect } from 'vitest';
import { kitchenTicketHtml, escapeHtml } from './kitchenTicket';

describe('comanda impresa', () => {
  const order = {
    id: 42,
    tableLabel: '7',
    createdAt: '2026-11-09T20:15:00.000Z',
    notes: '',
    items: [{ quantity: 2, name: 'Risotto de hongos', selectedOptions: ['Cremoso', 'Parmesano extra'] }]
  };

  it('lleva la mesa, el número de comanda, cantidades y opciones', () => {
    const html = kitchenTicketHtml(order, { restaurant: 'La Trattoria' });
    expect(html).toContain('Mesa 7');
    expect(html).toContain('Comanda 42');
    expect(html).toContain('<b>2</b>');
    expect(html).toContain('Cremoso, Parmesano extra');
    expect(html).toContain('size: 80mm auto');
    expect(html).not.toContain('REIMPRESIÓN');
  });

  it('marca las reimpresiones', () => {
    expect(kitchenTicketHtml(order, { reprint: true })).toContain('REIMPRESIÓN');
  });

  it('escapa lo que escriben el comensal y el personal', () => {
    const html = kitchenTicketHtml({ ...order, tableLabel: '<img src=x onerror=alert(1)>', notes: '"sin" <b>sal</b>' }, { restaurant: 'A & B' });
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('A &amp; B');
    expect(escapeHtml(`<'">&`)).toBe('&lt;&#39;&quot;&gt;&amp;');
  });
});
