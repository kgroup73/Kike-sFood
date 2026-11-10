/**
 * Imprime un documento HTML sin abrir ventanas: lo carga en un iframe oculto y llama
 * a print(). En Chrome abierto con --kiosk-printing sale directo a la impresora
 * predeterminada, sin vista previa. Sin esa opción, el navegador muestra su diálogo.
 * Las impresiones van en fila para que no se pisen.
 */
let queue = Promise.resolve();

function printOnce(html) {
  return new Promise((resolve) => {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      // Se deja un margen para que el navegador termine de mandar el trabajo.
      setTimeout(() => frame.remove(), 1000);
      resolve();
    };
    frame.onload = () => {
      const win = frame.contentWindow;
      if (!win) return finish();
      win.addEventListener('afterprint', finish);
      try {
        win.focus();
        win.print(); // con diálogo, bloquea hasta que se cierra
      } catch {
        // sin impresión disponible
      }
      setTimeout(finish, 3000);
    };
    frame.srcdoc = html;
    document.body.appendChild(frame);
  });
}

export function printHtml(html) {
  queue = queue.then(() => printOnce(html));
  return queue;
}

// Este equipo imprime las comandas. Es una preferencia del dispositivo, no del restaurante:
// solo el computador conectado a la impresora la activa.
const key = (tenantId) => `kikes_impresora_${tenantId}`;
const listeners = new Set();

export function isPrinterDevice(tenantId) {
  try {
    return localStorage.getItem(key(tenantId)) === '1';
  } catch {
    return false;
  }
}

export function setPrinterDevice(tenantId, on) {
  try {
    if (on) localStorage.setItem(key(tenantId), '1');
    else localStorage.removeItem(key(tenantId));
  } catch {
    // sin almacenamiento: queda apagado
  }
  listeners.forEach((l) => l());
}

export function subscribePrinterDevice(cb) {
  listeners.add(cb);
  const onStorage = (e) => e.key?.startsWith('kikes_impresora_') && cb();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}
