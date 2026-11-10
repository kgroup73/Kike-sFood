import { test } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { encode, wrap, Ticket } from '../lib/escpos.mjs';
import { renderTrabajo, pesos } from '../lib/plantillas.mjs';
import { enviar, parseRed } from '../lib/salida.mjs';
import { crearAgente } from '../lib/agente.mjs';
import { unirEstaciones, buscarEstacion } from '../lib/config.mjs';
import { crearApi } from '../lib/api.mjs';

const latin1 = (buf) => Buffer.from(buf).toString('latin1');

test('las tildes salen en PC858 y lo desconocido se aproxima', () => {
  assert.deepEqual(encode('ñÑáé¿¡'), [0xa4, 0xa5, 0xa0, 0x82, 0xa8, 0xad]);
  assert.deepEqual(encode('—…'), [...Buffer.from('-...')]);
  assert.deepEqual(encode('ñ', 'ascii'), [...Buffer.from('n')]);
  assert.deepEqual(encode('漢'), [0x3f]);
});

test('corta renglones sin partir palabras y alinea precios a la derecha', () => {
  assert.deepEqual(wrap('Risotto de hongos silvestres', 12), ['Risotto de', 'hongos', 'silvestres']);
  assert.deepEqual(wrap('abcdefghij', 4), ['abcd', 'efgh', 'ij']);
  const bytes = new Ticket({ columnas: 20, codigos: 'ascii' }).lr('Total', '$9.000').bytes();
  assert.ok(latin1(bytes).includes('Total         $9.000\n'));
  assert.equal(pesos(1234567), '$1.234.567');
});

test('la comanda lleva estación, mesa, platos, opciones, reimpresión y corte', () => {
  const job = {
    kind: 'comanda',
    payload: { station: 'Barra', tableLabel: '9', orderId: 42, createdAt: '2026-11-10T20:15:00Z', reprint: true,
      items: [{ quantity: 2, name: 'Sangría', options: ['Sin hielo'] }], notes: 'Rápido' }
  };
  const txt = latin1(renderTrabajo(job));
  assert.ok(txt.includes('BARRA'));
  assert.ok(txt.includes('MESA 9'));
  assert.ok(txt.includes('Comanda 42'));
  assert.ok(txt.includes('2 x Sangr\xeda'.replace('\xed', '\xa1')));
  assert.ok(txt.includes('Sin hielo'));
  assert.ok(txt.includes('REIMPRESI'));
  assert.ok(txt.includes('Nota: R\xa0pido'));
  assert.ok(txt.endsWith('\x1dVB\x03'), 'termina con el corte de papel');
});

test('el tiquete abre el cajón solo si se pagó en efectivo y la estación lo tiene', () => {
  const p = { restaurant: 'La Trattoria', kind: 'pos', number: 'POS-7', paymentMethod: 'efectivo', items: [{ quantity: 1, name: 'Tiramisú', totalPrice: 18000 }],
    itemsTotal: 18000, taxBase: 16667, tax: 1333, taxType: 'INC', taxRate: 8, tip: 1800, total: 19800, dianStatus: 'no_aplica' };
  const conCajon = latin1(renderTrabajo({ kind: 'tiquete', payload: p }, { cajon: true }));
  assert.ok(conCajon.includes('POS-7'));
  assert.ok(conCajon.includes('$19.800'));
  assert.ok(conCajon.includes('Propina voluntaria'));
  assert.ok(conCajon.endsWith('\x1bp\x00\x19\xfa'));
  const tarjeta = latin1(renderTrabajo({ kind: 'tiquete', payload: { ...p, paymentMethod: 'tarjeta' } }, { cajon: true }));
  assert.ok(!tarjeta.includes('\x1bp\x00'));
  assert.throws(() => renderTrabajo({ kind: 'otro', payload: {} }), /desconocido/);
});

test('imprime por red en el puerto 9100', async () => {
  const recibido = [];
  const server = net.createServer((s) => s.on('data', (d) => recibido.push(d)));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  await enviar({ tipo: 'red', host: '127.0.0.1', puerto: port }, Buffer.from('hola'));
  await new Promise((r) => setTimeout(r, 50));
  server.close();
  assert.equal(Buffer.concat(recibido).toString(), 'hola');
  assert.deepEqual(parseRed('192.168.1.50'), { tipo: 'red', host: '192.168.1.50', puerto: 9100 });
  assert.deepEqual(parseRed('10.0.0.9:9101'), { tipo: 'red', host: '10.0.0.9', puerto: 9101 });
  assert.throws(() => parseRed('no es una ip!'), /inválida/);
  await assert.rejects(enviar({ tipo: 'red', host: '127.0.0.1', puerto: port }, Buffer.from('x'), { timeoutMs: 500 }), /No se pudo imprimir/);
});

test('el agente imprime cada trabajo en la impresora de su estación y reporta', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'kikes-'));
  const cocina = path.join(dir, 'cocina.bin');
  const config = {
    token: 't'.repeat(64), restaurante: 'La Trattoria', equipo: 'PC',
    estaciones: [
      { id: 'st-cocina', nombre: 'Cocina', impresora: { tipo: 'archivo', ruta: cocina }, columnas: 48, codigos: 'cp858' },
      { id: 'st-barra', nombre: 'Barra', impresora: null }
    ]
  };
  const reportes = [];
  const fila = [
    [
      { id: 1, kind: 'comanda', station_id: 'st-cocina', payload: { station: 'Cocina', tableLabel: '4', orderId: 7, items: [{ quantity: 1, name: 'Risotto' }] } },
      { id: 2, kind: 'comanda', station_id: 'st-barra', payload: { station: 'Barra', tableLabel: '4', orderId: 7, items: [] } }
    ],
    []
  ];
  const api = {
    tomar: async () => fila.shift() || [],
    reportar: async (_t, id, ok, error) => reportes.push({ id, ok, error })
  };
  const agente = crearAgente({ api, config, log: () => {} });
  assert.equal(await agente.ciclo(), 2);
  assert.equal(await agente.ciclo(), 0);
  assert.ok((await readFile(cocina, 'latin1')).includes('MESA 4'));
  assert.deepEqual(reportes[0], { id: 1, ok: true, error: undefined });
  assert.equal(reportes[1].ok, false);
  assert.match(reportes[1].error, /Sin impresora configurada en este equipo para la estación Barra/);
});

test('las estaciones del servidor conservan la impresora elegida en el equipo', () => {
  const locales = [{ id: 'a', nombre: 'Cocina', impresora: { tipo: 'red', host: '1.2.3.4' }, columnas: 32 }];
  const unidas = unirEstaciones(locales, [{ id: 'a', name: 'Cocina caliente' }, { id: 'b', name: 'Caja', printsReceipts: true }]);
  assert.equal(unidas[0].nombre, 'Cocina caliente');
  assert.equal(unidas[0].impresora.host, '1.2.3.4');
  assert.equal(unidas[0].columnas, 32);
  assert.deepEqual([unidas[1].tiquetes, unidas[1].impresora], [true, null]);
  assert.equal(buscarEstacion({ estaciones: unidas }, 'caja').id, 'b');
});

test('la API llama las funciones del servidor con la llave pública y entiende el rechazo', async () => {
  const llamadas = [];
  const fetchImpl = async (url, init) => {
    llamadas.push({ url, init });
    if (url.endsWith('agent_pull_jobs')) {
      return new Response(JSON.stringify({ code: '42501', message: 'Equipo de impresión no vinculado o revocado' }), { status: 401 });
    }
    return new Response(JSON.stringify({ slug: 'la-trattoria' }), { status: 200 });
  };
  const api = crearApi({ servidor: 'https://x.supabase.co/', llave: 'anon', fetchImpl });
  assert.equal((await api.vincular('la-trattoria', 'K7Q2-9XMB', '0.1.0')).slug, 'la-trattoria');
  assert.equal(llamadas[0].url, 'https://x.supabase.co/rest/v1/rpc/agent_pair');
  assert.equal(llamadas[0].init.headers.apikey, 'anon');
  assert.deepEqual(JSON.parse(llamadas[0].init.body), { p_slug: 'la-trattoria', p_code: 'K7Q2-9XMB', p_version: '0.1.0' });
  await assert.rejects(api.tomar('t', 5, '0.1.0'), (err) => err.revocado === true);
});
