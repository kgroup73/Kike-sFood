import { useRef } from 'react';
import { useScrollProgress } from './useScrollProgress';

/**
 * La maqueta de escritorio llega inclinada hacia atrás y se endereza a medida que sube por
 * la pantalla, como una laptop que se abre. Lo que va dentro con `.drop-in` cae en su sitio
 * cuando la inclinación termina (ver src/index.css).
 */
export default function TiltIn({ className = '', children, ...rest }) {
  const ref = useRef(null);
  useScrollProgress(ref, { start: 1, end: 0.3 });
  return (
    <div ref={ref} className={`tilt-in [--p:0] ${className}`} {...rest}>
      {children}
    </div>
  );
}
