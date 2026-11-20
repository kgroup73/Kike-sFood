import { Nfc } from 'lucide-react';
import QrCode from '../ui/QrCode';
import Timbre from '../ui/Timbre';

/** El sticker que va pegado en cada mesa, con chip NFC y QR a la carta de la mesa 4 de la demo. */
export default function TableSticker({ url }) {
  return (
    <div className="relative w-[260px] h-[330px] mx-auto">
      <div className="absolute inset-0 rounded-3xl bg-plato border border-linea rotate-6 translate-x-4 translate-y-3" aria-hidden="true" />
      <div className="absolute inset-0 rounded-3xl bg-plato border-2 border-tinta -rotate-3 p-5 flex flex-col items-center justify-between text-center shadow-[0_24px_60px_-30px_rgb(30_43_36/0.4)]">
        {/* Indicador contactless en esquina */}
        <span className="absolute top-3.5 right-4 text-suave/60" title="Contactless">
          <Nfc className="w-4 h-4" />
        </span>

        <span className="inline-flex items-center gap-1.5 font-display font-extrabold text-lg tracking-tight">
          <Timbre className="w-6 h-6" /> Kike's
        </span>
        <span className="font-display font-extrabold text-4xl tracking-tight leading-none">Mesa 4</span>

        {/* Logo NFC estratégico */}
        <div className="w-9 h-9 rounded-full bg-mantel border border-linea/80 flex items-center justify-center text-tinta shadow-sm">
          <Nfc className="w-5 h-5 text-tinta shrink-0" aria-hidden="true" />
        </div>

        <QrCode value={url} size={110} label="Código QR de la carta de la Mesa 4" className="rounded-lg" />
        <span className="text-[11px] text-suave leading-snug">Acerca tu móvil o escanea el QR</span>
      </div>
    </div>
  );
}
