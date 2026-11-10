import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';

/** Foto de un plato. Si no hay foto o el enlace falla, muestra un fondo neutro con cubiertos. */
export default function DishImage({ src, alt = '', className = '', imgClassName = '' }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const broken = !src || failedSrc === src;

  return (
    <div className={`bg-linea overflow-hidden ${className}`}>
      {broken ? (
        <div className="w-full h-full flex items-center justify-center text-suave" role={alt ? 'img' : undefined} aria-label={alt || undefined}>
          <UtensilsCrossed className="w-1/4 h-1/4 max-w-10 max-h-10" aria-hidden="true" />
        </div>
      ) : (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} className={`w-full h-full object-cover ${imgClassName}`} />
      )}
    </div>
  );
}
