import QrCode from '../ui/QrCode';
import Timbre from '../ui/Timbre';

/** El sticker que va pegado en cada mesa, con un QR real a la carta de la mesa 4 de la demo. */
export default function TableSticker({ url }) {
  return (
    <div className="relative w-[260px] h-[300px] mx-auto">
      <div className="absolute inset-0 rounded-3xl bg-plato border border-linea rotate-6 translate-x-4 translate-y-3" aria-hidden="true" />
      <div className="absolute inset-0 rounded-3xl bg-plato border-2 border-tinta -rotate-3 p-5 flex flex-col items-center justify-between text-center shadow-[0_24px_60px_-30px_rgb(30_43_36/0.4)]">
        <span className="inline-flex items-center gap-1.5 font-display font-extrabold text-lg tracking-tight">
          <Timbre className="w-6 h-6" /> Kike's
        </span>
        <span className="font-display font-extrabold text-4xl tracking-tight leading-none">Mesa 4</span>
        <QrCode value={url} size={120} label="Código QR de la carta de la Mesa 4" className="rounded-lg" />
        <span className="text-sm text-suave leading-snug">Escanea para ver la carta y pedir</span>
      </div>
    </div>
  );
}
