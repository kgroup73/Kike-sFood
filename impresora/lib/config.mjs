/**
 * Configuración local del agente: con qué restaurante está vinculado (token) y qué
 * impresora usa cada estación. Vive en un JSON que solo lee este equipo:
 *   Windows: C:\ProgramData\KikesImpresora\config.json
 *   Otros:   ~/.kikes-impresora/config.json
 * KIKES_IMPRESORA_CONFIG cambia la ruta (pruebas, varios agentes en un equipo).
 */
import { readFile, writeFile, mkdir, chmod } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

export function rutaConfig() {
  if (process.env.KIKES_IMPRESORA_CONFIG) return process.env.KIKES_IMPRESORA_CONFIG;
  if (process.platform === 'win32') {
    return path.join(process.env.ProgramData || 'C:\\ProgramData', 'KikesImpresora', 'config.json');
  }
  return path.join(homedir(), '.kikes-impresora', 'config.json');
}

export async function leerConfig(ruta = rutaConfig()) {
  try {
    return JSON.parse(await readFile(ruta, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw new Error(`No se pudo leer la configuración (${ruta}): ${err.message}`);
  }
}

export async function guardarConfig(config, ruta = rutaConfig()) {
  await mkdir(path.dirname(ruta), { recursive: true });
  await writeFile(ruta, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  await chmod(ruta, 0o600).catch(() => {}); // en Windows los permisos los da la carpeta
  return ruta;
}

/** Busca una estación por id o por nombre (sin distinguir mayúsculas). */
export function buscarEstacion(config, idONombre) {
  const q = String(idONombre || '').trim().toLowerCase();
  return (config?.estaciones || []).find((e) => e.id === idONombre || e.nombre.toLowerCase() === q) || null;
}

/** Une las estaciones que manda el servidor con las impresoras ya configuradas aquí. */
export function unirEstaciones(locales = [], remotas = []) {
  return remotas.map((r) => {
    const previa = locales.find((l) => l.id === r.id);
    return {
      id: r.id,
      nombre: r.name,
      tiquetes: !!r.printsReceipts,
      impresora: previa?.impresora ?? null,
      columnas: previa?.columnas ?? 48,
      codigos: previa?.codigos ?? 'cp858',
      cajon: previa?.cajon ?? false
    };
  });
}
