import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** Código QR generado en el navegador: el enlace (con el token de la mesa) no sale a terceros. */
export default function QrCode({ value, size = 144, className = '', label }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: size * 2, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => !cancelled && setSrc(url))
      .catch(() => !cancelled && setSrc(null));
    return () => {
      cancelled = true;
    };
  }, [value, size]);
  if (!src) return <div style={{ width: size, height: size }} className={`bg-linea animate-pulse rounded ${className}`} />;
  return <img src={src} width={size} height={size} alt={label || 'Código QR'} className={className} />;
}
