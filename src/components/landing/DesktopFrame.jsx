/**
 * Ventana de navegador para las maquetas de escritorio del landing. Decorativa:
 * el contenedor que la usa lleva el texto alternativo. En pantallas angostas la
 * maqueta se reduce con `zoom` para que siga viéndose como escritorio.
 */
export default function DesktopFrame({ url = 'kikes.app/staff/la-trattoria', className = '', children }) {
  return (
    <div className={`rounded-2xl bg-tinta p-2 shadow-[0_40px_100px_-40px_rgb(0_0_0/0.5)] ${className}`}>
      <div className="h-8 px-2 flex items-center gap-3">
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="w-2.5 h-2.5 rounded-full bg-mantel/25" />
          <i className="w-2.5 h-2.5 rounded-full bg-mantel/25" />
          <i className="w-2.5 h-2.5 rounded-full bg-mantel/25" />
        </span>
        <span className="mx-auto max-w-[70%] truncate h-5 px-3 rounded-md bg-mantel/10 text-[11px] leading-5 text-mantel/60">{url}</span>
      </div>
      <div className="rounded-xl bg-mantel text-tinta overflow-hidden [zoom:0.72] sm:[zoom:0.85] lg:[zoom:1]">{children}</div>
    </div>
  );
}
