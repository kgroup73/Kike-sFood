/**
 * Comandos ESC/POS para impresoras térmicas (Epson y compatibles: Bixolon, Star en
 * modo ESC/POS, Xprinter…). Sin dependencias: arma los bytes a mano.
 *
 * Tildes y eñes: se imprime con la página de códigos PC858 (latín, con €), que casi
 * todas las térmicas traen. Si una impresora muestra símbolos raros, se configura
 * `codigos: "ascii"` y el texto sale sin tildes.
 */

const ESC = 0x1b;
const GS = 0x1d;

// Caracteres del español (y algunos de uso común) en PC850/858.
const CP858 = new Map(
  Object.entries({
    'á': 0xa0, 'é': 0x82, 'í': 0xa1, 'ó': 0xa2, 'ú': 0xa3, 'ñ': 0xa4, 'Ñ': 0xa5, 'ü': 0x81, 'Ü': 0x9a,
    'Á': 0xb5, 'É': 0x90, 'Í': 0xd6, 'Ó': 0xe0, 'Ú': 0xe9, '¿': 0xa8, '¡': 0xad, 'º': 0xa7, 'ª': 0xa6,
    '°': 0xf8, '×': 0x9e, '·': 0xfa, '€': 0xd5, '½': 0xab, 'ç': 0x87, 'Ç': 0x80
  })
);
// Lo que no existe en la página de códigos se reemplaza por algo legible.
const SUSTITUTOS = new Map(
  Object.entries({ '—': '-', '–': '-', '“': '"', '”': '"', '‘': "'", '’': "'", '…': '...', '•': '*', '→': '->' })
);

/** Texto → bytes de la impresora. `codigos`: 'cp858' (por defecto) o 'ascii' (sin tildes). */
export function encode(text, codigos = 'cp858') {
  const out = [];
  for (const ch of String(text ?? '')) {
    const code = ch.codePointAt(0);
    if (code === 0x0a || (code >= 0x20 && code < 0x7f)) {
      out.push(code);
    } else if (codigos !== 'ascii' && CP858.has(ch)) {
      out.push(CP858.get(ch));
    } else if (SUSTITUTOS.has(ch)) {
      for (const c of SUSTITUTOS.get(ch)) out.push(c.charCodeAt(0));
    } else {
      // Sin tilde (á → a); si aun así no es ASCII, un signo de interrogación.
      const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
      for (const c of base) {
        const b = c.codePointAt(0);
        out.push(b >= 0x20 && b < 0x7f ? b : 0x3f);
      }
    }
  }
  return out;
}

/** Corta un texto en renglones de `width` caracteres, sin partir palabras si se puede. */
export function wrap(text, width) {
  const lines = [];
  for (const paragraph of String(text ?? '').split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (!line) line = word;
      else if (line.length + 1 + word.length <= width) line += ` ${word}`;
      else {
        lines.push(line);
        line = word;
      }
      while (line.length > width) {
        lines.push(line.slice(0, width));
        line = line.slice(width);
      }
    }
    lines.push(line);
  }
  return lines;
}

/**
 * Constructor de un tiquete. `columnas`: 48 para papel de 80 mm (fuente A), 32 para 58 mm.
 * Los métodos se encadenan: new Ticket().center().bold().line('Hola').cut().bytes()
 */
export class Ticket {
  constructor({ columnas = 48, codigos = 'cp858' } = {}) {
    this.columnas = columnas;
    this.codigos = codigos;
    this.ancho = 1;
    this.buf = [ESC, 0x40]; // inicializar la impresora
    if (codigos !== 'ascii') this.buf.push(ESC, 0x74, 19); // página de códigos PC858
  }

  raw(...bytes) {
    this.buf.push(...bytes);
    return this;
  }

  left() {
    return this.raw(ESC, 0x61, 0);
  }

  center() {
    return this.raw(ESC, 0x61, 1);
  }

  right() {
    return this.raw(ESC, 0x61, 2);
  }

  bold(on = true) {
    return this.raw(ESC, 0x45, on ? 1 : 0);
  }

  /** Tamaño del carácter: ancho y alto de 1 a 8 veces. */
  size(w = 1, h = 1) {
    this.ancho = w;
    return this.raw(GS, 0x21, ((w - 1) << 4) | (h - 1));
  }

  /** Columnas disponibles con el tamaño actual. */
  get cols() {
    return Math.floor(this.columnas / this.ancho);
  }

  line(text = '') {
    for (const l of wrap(text, this.cols)) this.buf.push(...encode(l, this.codigos), 0x0a);
    return this;
  }

  /** Texto a la izquierda y valor a la derecha en el mismo renglón (precios). */
  lr(left, right) {
    const r = String(right ?? '');
    const room = Math.max(1, this.cols - r.length - 1);
    const lines = wrap(left, room);
    lines.forEach((l, i) => {
      const tail = i === lines.length - 1 ? r : '';
      this.buf.push(...encode(l.padEnd(this.cols - tail.length, ' ') + tail, this.codigos), 0x0a);
    });
    return this;
  }

  sep(ch = '-') {
    return this.line(ch.repeat(this.cols));
  }

  feed(n = 1) {
    return this.raw(ESC, 0x64, n);
  }

  /** Avanza el papel y corta (corte parcial: la hoja queda colgando para arrancarla). */
  cut() {
    return this.raw(GS, 0x56, 66, 3);
  }

  /** Abre el cajón monedero conectado a la impresora. */
  drawer() {
    return this.raw(ESC, 0x70, 0, 25, 250);
  }

  bytes() {
    return Buffer.from(this.buf);
  }
}
