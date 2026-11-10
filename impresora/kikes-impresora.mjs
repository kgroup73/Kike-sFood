#!/usr/bin/env node
/**
 * Kike's Impresora: agente local que imprime comandas y tiquetes sin vista previa.
 *
 *   node kikes-impresora.mjs vincular --restaurante la-trattoria --codigo K7Q2-9XMB \
 *        --servidor https://xxxx.supabase.co --llave <llave pública>
 *   node kikes-impresora.mjs impresora --estacion Cocina --red 192.168.1.50
 *   node kikes-impresora.mjs probar
 *   node kikes-impresora.mjs iniciar
 *
 * En Windows lo instala instalar-windows.ps1, que además lo deja arrancando solo.
 */
import { appendFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { crearApi } from './lib/api.mjs';
import { crearAgente, VERSION } from './lib/agente.mjs';
import { leerConfig, guardarConfig, rutaConfig, buscarEstacion, unirEstaciones } from './lib/config.mjs';
import { enviar, parseRed, describir } from './lib/salida.mjs';
import { renderTrabajo } from './lib/plantillas.mjs';

const AYUDA = `Kike's Impresora ${VERSION}

Comandos:
  vincular   --restaurante <código> --codigo <XXXX-XXXX> --servidor <url> --llave <llave>
             Vincula este equipo. El código lo genera Administración → Cocina e impresión.
  impresora  [--estacion <nombre>] (--red <IP[:puerto]> | --windows <nombre> | --archivo <ruta>)
             [--columnas 48|32] [--ascii] [--cajon]
             Qué impresora usa cada estación. Sin --estacion, se aplica a todas.
  estado     [--json]   Muestra el restaurante, las estaciones y sus impresoras.
  probar     [--estacion <nombre>]   Imprime una hoja de prueba sin pasar por el servidor.
  iniciar    Queda imprimiendo lo que llegue (lo usa la tarea programada de Windows).

Configuración: ${rutaConfig()}`;

function args(argv) {
  const [comando, ...resto] = argv;
  const opts = {};
  for (let i = 0; i < resto.length; i++) {
    const a = resto[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = resto[i + 1];
    if (next === undefined || next.startsWith('--')) opts[key] = true;
    else {
      opts[key] = next;
      i++;
    }
  }
  return { comando, opts };
}

async function necesitarConfig() {
  const config = await leerConfig();
  if (!config?.token) throw new Error('Este equipo no está vinculado. Usa primero: vincular --restaurante … --codigo …');
  return config;
}

function registro(config) {
  const archivo = path.join(path.dirname(rutaConfig()), 'agente.log');
  return async (msg) => {
    const linea = `${new Date().toISOString()} ${msg}`;
    console.log(linea);
    try {
      // Un registro corto: al pasar de 1 MB empieza de nuevo.
      const tam = await stat(archivo).then((s) => s.size).catch(() => 0);
      if (tam > 1_000_000) await writeFile(archivo, '');
      await appendFile(archivo, `${linea}\n`);
    } catch {
      // sin permiso de escritura: queda solo en la consola
    }
    return config;
  };
}

async function vincular(o) {
  for (const k of ['restaurante', 'codigo', 'servidor', 'llave']) {
    if (!o[k] || o[k] === true) throw new Error(`Falta --${k}`);
  }
  const api = crearApi({ servidor: o.servidor, llave: o.llave });
  const r = await api.vincular(o.restaurante, o.codigo, VERSION);
  const previa = await leerConfig();
  const config = {
    servidor: o.servidor,
    llave: o.llave,
    slug: r.slug,
    restaurante: r.restaurant,
    equipo: r.deviceName,
    deviceId: r.deviceId,
    token: r.token,
    estaciones: unirEstaciones(previa?.slug === r.slug ? previa.estaciones : [], r.stations)
  };
  const ruta = await guardarConfig(config);
  console.log(`Vinculado con ${r.restaurant} como "${r.deviceName}".`);
  console.log(`Estaciones: ${config.estaciones.map((e) => e.nombre).join(', ')}`);
  console.log(`Configuración guardada en ${ruta}`);
  if (config.estaciones.some((e) => !e.impresora)) console.log('Ahora elige la impresora: impresora --estacion <nombre> --red <IP>');
}

async function impresora(o) {
  const config = await necesitarConfig();
  let destino;
  if (o.red) destino = parseRed(o.red);
  else if (o.windows) destino = { tipo: 'windows', nombre: String(o.windows) };
  else if (o.archivo) destino = { tipo: 'archivo', ruta: path.resolve(String(o.archivo)) };
  else throw new Error('Indica --red <IP>, --windows <nombre> o --archivo <ruta>');
  const objetivo = o.estacion ? [buscarEstacion(config, o.estacion)] : config.estaciones;
  if (!objetivo[0]) throw new Error(`No existe la estación "${o.estacion}". Estaciones: ${config.estaciones.map((e) => e.nombre).join(', ')}`);
  for (const e of objetivo) {
    e.impresora = destino;
    if (o.columnas) e.columnas = Number(o.columnas) === 32 ? 32 : 48;
    if (o.ascii) e.codigos = 'ascii';
    if (o.cajon) e.cajon = true;
    console.log(`${e.nombre} → ${describir(destino)}`);
  }
  await guardarConfig(config);
}

async function estado(o) {
  const config = await necesitarConfig();
  try {
    const info = await crearApi(config).info(config.token);
    config.estaciones = unirEstaciones(config.estaciones, info.stations);
    config.equipo = info.deviceName;
    config.restaurante = info.restaurant;
    await guardarConfig(config);
  } catch (err) {
    console.log(`(No se pudo consultar el servidor: ${err.message})`);
  }
  if (o.json) {
    console.log(JSON.stringify({ ...config, token: undefined, llave: undefined }, null, 2));
    return;
  }
  console.log(`${config.restaurante} (${config.slug}) · equipo "${config.equipo}"`);
  for (const e of config.estaciones) {
    console.log(`  ${e.nombre}${e.tiquetes ? ' (tiquetes de caja)' : ''} → ${describir(e.impresora)}`);
  }
}

async function probar(o) {
  const config = await necesitarConfig();
  const objetivo = o.estacion ? [buscarEstacion(config, o.estacion)] : config.estaciones;
  if (!objetivo[0]) throw new Error(`No existe la estación "${o.estacion}"`);
  let fallas = 0;
  for (const e of objetivo) {
    try {
      if (!e.impresora) throw new Error('sin impresora configurada');
      const bytes = renderTrabajo({ kind: 'prueba', payload: { restaurant: config.restaurante, station: e.nombre, createdAt: new Date().toISOString() } }, e);
      await enviar(e.impresora, bytes);
      console.log(`${e.nombre}: prueba enviada a ${describir(e.impresora)}`);
    } catch (err) {
      fallas++;
      console.log(`${e.nombre}: ${err.message}`);
    }
  }
  if (fallas) process.exitCode = 1;
}

async function iniciar() {
  const config = await necesitarConfig();
  const log = registro(config);
  const api = crearApi(config);
  try {
    const info = await api.info(config.token);
    config.estaciones = unirEstaciones(config.estaciones, info.stations);
    await guardarConfig(config);
  } catch (err) {
    await log(`Arranco con la configuración guardada (${err.message})`);
  }
  const agente = crearAgente({ api, config, log });
  const salir = () => {
    log('Agente detenido');
    agente.detener();
  };
  process.on('SIGINT', salir);
  process.on('SIGTERM', salir);
  await agente.iniciar();
}

const { comando, opts } = args(process.argv.slice(2));
const COMANDOS = { vincular, impresora, estado, probar, iniciar };
if (!COMANDOS[comando]) {
  console.log(AYUDA);
  process.exitCode = comando && !['ayuda', '--help', '-h'].includes(comando) ? 1 : 0;
} else {
  COMANDOS[comando](opts).catch((err) => {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
  });
}
