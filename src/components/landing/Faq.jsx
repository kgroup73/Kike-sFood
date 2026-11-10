import { Plus } from 'lucide-react';

/** Preguntas frecuentes con <details>: accesible sin JavaScript y el icono gira al abrir. */
export default function Faq({ items }) {
  return (
    <div className="divide-y divide-linea border-y border-linea">
      {items.map(({ q, a }) => (
        <details key={q} className="group py-1">
          <summary className="list-none cursor-pointer flex items-center justify-between gap-6 py-4 font-bold text-lg marker:content-none [&::-webkit-details-marker]:hidden">
            <span>{q}</span>
            <Plus className="w-5 h-5 shrink-0 text-hoja transition-transform group-open:rotate-45" aria-hidden="true" />
          </summary>
          <p className="pb-5 pr-11 text-suave leading-relaxed max-w-2xl animate-fadeIn">{a}</p>
        </details>
      ))}
    </div>
  );
}
