/**
 * Símbolo de Kike's: un timbre de mostrador (el que suena cuando el plato está listo).
 * Las partes de tinta usan `currentColor`, así que el símbolo sigue al texto del tema:
 * sobre fondo claro es tinta, sobre un bloque oscuro (text-mantel) se invierte solo.
 * La campana es maracuyá y la K siempre oscura sobre ella (token sobre-maracuya).
 *
 * - `withK={false}`: versión reducida, para menos de 24 px (favicon, pestañas).
 * - `mono`: una sola tinta, con la K calada. Para tiquetes térmicos y sellos.
 * - `title`: si se pasa, el símbolo se anuncia solo; sin él se oculta a lectores
 *   de pantalla (porque va junto al nombre, como en BrandMark).
 *
 * Los archivos para imprenta y redes están en public/marca/.
 */
export default function Timbre({ className = 'w-8 h-8', withK = true, mono = false, knockout = '#FFFFFF', title }) {
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': 'true' };
  return (
    <svg viewBox="6 14 52 41" className={className} fill="currentColor" {...a11y}>
      <circle cx="32" cy="19" r="4.5" />
      <rect x="30" y="21" width="4" height="5" />
      <path d="M11 45a21 21 0 0 1 42 0z" className={mono ? undefined : 'fill-maracuya'} />
      <rect x="6" y="47" width="52" height="8" rx="4" />
      {withK && (
        <path
          d="M26 31v11M37.5 31L29 36.5l8.5 5.5"
          fill="none"
          stroke={mono ? knockout : undefined}
          className={mono ? undefined : 'stroke-sobre-maracuya'}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
