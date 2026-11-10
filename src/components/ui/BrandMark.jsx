import { PROJECT_NAME } from '../../config/branding';
import Timbre from './Timbre';

/** Marca de Kike's en horizontal: el timbre y el nombre. Sigue el color del texto. */
export default function BrandMark({ size = 'md' }) {
  const sm = size === 'sm';
  return (
    <span className={`inline-flex items-center ${sm ? 'gap-1.5' : 'gap-2'}`}>
      <Timbre className={sm ? 'w-7 h-7' : 'w-9 h-9'} />
      <span className={`font-display font-extrabold tracking-tight ${sm ? 'text-lg' : 'text-2xl'}`}>{PROJECT_NAME}</span>
    </span>
  );
}
