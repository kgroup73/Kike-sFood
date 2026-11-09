import { PROJECT_NAME } from '../../config/branding';

/** Marca de Kike's: solo tipografía. */
export default function BrandMark({ size = 'md' }) {
  const text = size === 'sm' ? 'text-lg' : 'text-2xl';
  return (
    <span className={`font-display font-extrabold tracking-tight ${text} inline-flex items-baseline gap-0.5`}>
      {PROJECT_NAME}
      <span className="w-1.5 h-1.5 rounded-full bg-hoja translate-y-[-0.1em]" aria-hidden="true" />
    </span>
  );
}
