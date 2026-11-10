/**
 * Manda los bytes a la impresora. Tres tipos:
 *  - red:      impresora con cable de red o Wi-Fi, puerto 9100 (el estándar de las térmicas).
 *              No necesita controlador: basta con su IP.
 *  - windows:  impresora instalada en Windows (USB). Se le manda el trabajo "en crudo" con
 *              el spooler, sin vista previa (lib/raw-print.ps1).
 *  - archivo:  agrega los bytes a un archivo. Para probar sin impresora.
 */
import net from 'node:net';
import { appendFile, writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAW_PRINT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'raw-print.ps1');

/** Interpreta lo que escribe la persona: "192.168.1.50", "192.168.1.50:9100". */
export function parseRed(texto) {
  const m = /^\s*([a-zA-Z0-9.-]+)(?::(\d{1,5}))?\s*$/.exec(texto || '');
  if (!m) throw new Error(`Dirección de impresora inválida: "${texto}". Usa la IP, por ejemplo 192.168.1.50`);
  return { tipo: 'red', host: m[1], puerto: m[2] ? Number(m[2]) : 9100 };
}

function porRed({ host, puerto = 9100 }, bytes, { timeoutMs = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port: puerto });
    let listo = false;
    const fallar = (err) => {
      if (listo) return;
      listo = true;
      socket.destroy();
      reject(new Error(`No se pudo imprimir en ${host}:${puerto}: ${err.message}`));
    };
    socket.setTimeout(timeoutMs, () => fallar(new Error('la impresora no responde')));
    socket.on('error', fallar);
    socket.on('connect', () => socket.end(bytes));
    socket.on('close', (hadError) => {
      if (listo || hadError) return;
      listo = true;
      resolve();
    });
  });
}

async function porWindows({ nombre }, bytes) {
  if (process.platform !== 'win32') throw new Error('El tipo "windows" solo funciona en Windows');
  const archivo = path.join(tmpdir(), `kikes-${process.pid}-${Date.now()}.bin`);
  await writeFile(archivo, bytes);
  try {
    await new Promise((resolve, reject) => {
      const ps = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', RAW_PRINT, '-Impresora', nombre, '-Archivo', archivo], {
        windowsHide: true
      });
      let err = '';
      ps.stderr.on('data', (d) => (err += d));
      ps.on('error', reject);
      ps.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`No se pudo imprimir en "${nombre}": ${err.trim() || `código ${code}`}`))));
    });
  } finally {
    await unlink(archivo).catch(() => {});
  }
}

export async function enviar(impresora, bytes, opciones) {
  if (!impresora) throw new Error('Sin impresora configurada');
  if (impresora.tipo === 'red') return porRed(impresora, bytes, opciones);
  if (impresora.tipo === 'windows') return porWindows(impresora, bytes);
  if (impresora.tipo === 'archivo') return appendFile(impresora.ruta, bytes);
  throw new Error(`Tipo de impresora desconocido: ${impresora.tipo}`);
}

export function describir(impresora) {
  if (!impresora) return 'sin impresora';
  if (impresora.tipo === 'red') return `red ${impresora.host}:${impresora.puerto || 9100}`;
  if (impresora.tipo === 'windows') return `Windows "${impresora.nombre}"`;
  if (impresora.tipo === 'archivo') return `archivo ${impresora.ruta}`;
  return impresora.tipo;
}
