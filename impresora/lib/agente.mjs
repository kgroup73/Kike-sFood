/**
 * El ciclo del agente: pide trabajos de sus estaciones, los imprime y reporta.
 * Pregunta cada 2 segundos mientras no haya nada; si hubo trabajos, vuelve de inmediato.
 * Sin conexión espera cada vez más (hasta 30 s) y sigue intentando: lo pendiente sale
 * apenas vuelve la red, porque la fila vive en el servidor.
 */
import { renderTrabajo } from './plantillas.mjs';
import { enviar as enviarReal, describir } from './salida.mjs';

export const VERSION = '0.1.0';

export function crearAgente({ api, config, enviar = enviarReal, log = console.log, esperaMs = 2000, maxEsperaMs = 30000 }) {
  let detenido = false;
  let espera = esperaMs;
  let temporizador = null;
  let despertar = null;

  /** Un trabajo: plantilla → bytes → impresora de su estación → reporte. */
  async function imprimir(job) {
    const estacion = (config.estaciones || []).find((e) => e.id === job.station_id);
    const nombre = estacion?.nombre || job.payload?.station || 'desconocida';
    try {
      if (!estacion?.impresora) throw new Error(`Sin impresora configurada en este equipo para la estación ${nombre}`);
      const bytes = renderTrabajo(job, estacion);
      await enviar(estacion.impresora, bytes);
      await api.reportar(config.token, job.id, true);
      log(`Impreso: ${job.kind} ${job.payload?.orderId ?? job.payload?.number ?? job.id} en ${nombre} (${describir(estacion.impresora)})`);
      return true;
    } catch (err) {
      log(`Error al imprimir ${job.kind} ${job.id} en ${nombre}: ${err.message}`);
      await api.reportar(config.token, job.id, false, err.message).catch((e) => log(`No se pudo reportar el error: ${e.message}`));
      return false;
    }
  }

  /** Una vuelta: devuelve cuántos trabajos tomó. */
  async function ciclo() {
    const trabajos = await api.tomar(config.token, 5, VERSION);
    for (const job of trabajos || []) await imprimir(job);
    return (trabajos || []).length;
  }

  function dormir(ms) {
    return new Promise((resolve) => {
      despertar = resolve;
      temporizador = setTimeout(resolve, ms);
    });
  }

  async function iniciar() {
    log(`Agente ${VERSION} de ${config.restaurante} (${config.equipo}). Estaciones: ${(config.estaciones || []).map((e) => `${e.nombre} → ${describir(e.impresora)}`).join(', ')}`);
    while (!detenido) {
      try {
        const n = await ciclo();
        espera = esperaMs;
        if (n > 0) continue;
      } catch (err) {
        if (err.revocado) {
          log(`${err.message}. Vincula de nuevo este equipo desde Administración → Cocina e impresión.`);
          espera = 60000;
        } else {
          espera = Math.min(maxEsperaMs, Math.max(esperaMs, espera * 2));
          log(`${err.message}. Reintento en ${Math.round(espera / 1000)} s.`);
        }
      }
      if (!detenido) await dormir(espera);
    }
  }

  function detener() {
    detenido = true;
    clearTimeout(temporizador);
    despertar?.();
  }

  return { ciclo, imprimir, iniciar, detener };
}
