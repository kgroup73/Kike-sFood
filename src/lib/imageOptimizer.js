/**
 * Optimizador de imágenes para platillos de Kike's Food.
 * 
 * - Redimensiona a resolución óptima (máx 1080px manteniendo relación de aspecto).
 * - Convierte a formato WebP moderno con compresión equilibrada.
 * - Ajusta calidad iterativamente para ubicarse en el rango de ~120 KB - 300 KB.
 * - En entornos sin Canvas (ej. Vitest/Node), realiza fallback seguro al archivo original.
 */

const DEFAULT_OPTIONS = {
  maxDimension: 1080,
  targetMinBytes: 90 * 1024,   // ~90 KB
  targetMaxBytes: 300 * 1024,  // ~300 KB
  initialQuality: 0.82,
  minQuality: 0.55,
  format: 'image/webp'
};

/**
 * Carga un File o Blob en un elemento HTMLImageElement
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo decodificar el archivo de imagen'));
    };
    img.src = url;
  });
}

/**
 * Convierte un canvas a Blob de forma asíncrona
 */
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    } else {
      // Fallback para entornos donde toBlob no esté implementado
      try {
        const dataUrl = canvas.toDataURL(type, quality);
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        resolve(new Blob([ab], { type: mimeString }));
      } catch {
        resolve(null);
      }
    }
  });
}

/**
 * Calcula dimensiones proporcionales
 */
export function calculateDimensions(origWidth, origHeight, maxDim = 1080) {
  if (origWidth <= maxDim && origHeight <= maxDim) {
    return { width: origWidth, height: origHeight };
  }

  if (origWidth > origHeight) {
    return {
      width: maxDim,
      height: Math.max(1, Math.round((origHeight * maxDim) / origWidth))
    };
  } else {
    return {
      width: Math.max(1, Math.round((origWidth * maxDim) / origHeight)),
      height: maxDim
    };
  }
}

/**
 * Optimiza un archivo de imagen para platillos antes de subir a Supabase Storage.
 *
 * @param {File|Blob} file Archivo de imagen seleccionado por el usuario.
 * @param {Object} customOptions Opciones de compresión y tamaño.
 * @returns {Promise<{ file: File, blob: Blob, previewUrl: string, width: number, height: number, originalSizeBytes: number, optimizedSizeBytes: number, savingsPercent: number }>}
 */
export async function optimizeProductImage(file, customOptions = {}) {
  const options = { ...DEFAULT_OPTIONS, ...customOptions };
  const originalSizeBytes = file.size;

  // Fallback seguro si no estamos en un entorno con DOM/Canvas (ej. SSR / Vitest sin canvas)
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return {
      file,
      blob: file,
      previewUrl: '',
      width: 0,
      height: 0,
      originalSizeBytes,
      optimizedSizeBytes: originalSizeBytes,
      savingsPercent: 0
    };
  }

  // 1. Cargar imagen original
  let img;
  try {
    img = await loadImage(file);
  } catch (err) {
    // Si falla la carga (ej. formato exótico), devolver el archivo original
    return {
      file,
      blob: file,
      previewUrl: URL.createObjectURL(file),
      width: 0,
      height: 0,
      originalSizeBytes,
      optimizedSizeBytes: originalSizeBytes,
      savingsPercent: 0
    };
  }

  const { width: targetWidth, height: targetHeight } = calculateDimensions(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    options.maxDimension
  );

  // 2. Dibujar en Canvas con suavizado de alta calidad
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      file,
      blob: file,
      previewUrl: URL.createObjectURL(file),
      width: targetWidth,
      height: targetHeight,
      originalSizeBytes,
      optimizedSizeBytes: originalSizeBytes,
      savingsPercent: 0
    };
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // 3. Compresión a WebP (o JPEG si WebP no es compatible)
  let quality = options.initialQuality;
  let blob = await canvasToBlob(canvas, options.format, quality);

  // Fallback a JPEG si el navegador no produce WebP
  let mimeType = options.format;
  if (!blob || blob.type !== options.format) {
    mimeType = 'image/jpeg';
    blob = await canvasToBlob(canvas, mimeType, quality);
  }

  // Si el archivo sigue siendo muy pesado (> targetMaxBytes), bajar calidad progresivamente
  if (blob && blob.size > options.targetMaxBytes) {
    const qualities = [0.75, 0.68, 0.60];
    for (const q of qualities) {
      if (blob.size <= options.targetMaxBytes) break;
      const smallerBlob = await canvasToBlob(canvas, mimeType, q);
      if (smallerBlob) {
        blob = smallerBlob;
        quality = q;
      }
    }
  }

  if (!blob) {
    blob = file;
  }

  const optimizedSizeBytes = blob.size;
  const savingsPercent = Math.max(0, Math.round((1 - optimizedSizeBytes / originalSizeBytes) * 100));

  // Generar nombre de archivo con extensión adecuada
  const baseName = (file.name || 'dish')
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-');
  const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
  const optimizedFileName = `${baseName}-${Date.now()}.${ext}`;

  const optimizedFile = new File([blob], optimizedFileName, { type: mimeType });
  const previewUrl = URL.createObjectURL(blob);

  return {
    file: optimizedFile,
    blob,
    previewUrl,
    width: targetWidth,
    height: targetHeight,
    originalSizeBytes,
    optimizedSizeBytes,
    savingsPercent
  };
}

/**
 * Formatea bytes a KB o MB legibles
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1000) {
    return `${Math.round(kb)} KB`;
  }
  return `${(kb / 1024).toFixed(1)} MB`;
}
