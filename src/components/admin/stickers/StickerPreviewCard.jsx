import { Nfc } from 'lucide-react';
import Timbre from '../../ui/Timbre';
import QrCodeImage from '../../ui/QrCode';
import { tableUrl } from '../tableLinks';

/**
 * Tarjeta de previsualización individual de un sticker para la mesa.
 * Mantiene exactas las esquinas de corte, dimensiones, microtipografía y contrastes.
 */
export default function StickerPreviewCard({ table, tenant, isSingle, printMode }) {
  const tableNum = table.label;
  const targetUrl = tableUrl(tenant?.slug, table.token);

  return (
    <div
      className={`bg-white text-tinta rounded-2xl p-3 border-2 border-tinta shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden sticker-card w-full ${
        isSingle ? 'max-w-[220px]' : ''
      }`}
      style={{ minHeight: '235px', maxHeight: '255px' }}
    >
      <div className="absolute top-1.5 left-1.5 w-2 h-2 border-t-2 border-l-2 border-tinta" />
      <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t-2 border-r-2 border-tinta" />
      <div className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b-2 border-l-2 border-tinta" />
      <div className="absolute bottom-1.5 right-1.5 w-2 h-2 border-b-2 border-r-2 border-tinta" />

      <div className="space-y-0.5 flex flex-col items-center">
        <Timbre className="w-5 h-5" mono={printMode === 'mono'} />
        <span className="text-[8px] font-bold tracking-wider text-suave uppercase block">
          {tenant?.name}
        </span>
        <h4 className="font-display font-black text-lg text-tinta tracking-tight leading-tight">
          MESA {tableNum}
        </h4>
      </div>

      {/* Emblema NFC circular central */}
      <div className="w-7 h-7 rounded-full bg-mantel border border-linea/80 flex items-center justify-center text-tinta shadow-sm my-0.5">
        <Nfc className="w-4 h-4 text-tinta shrink-0" aria-hidden="true" />
      </div>

      <div className="p-1 bg-white rounded-lg border-2 border-tinta shadow-sm my-0.5">
        <QrCodeImage
          value={targetUrl}
          size={110}
          label={`QR Mesa ${tableNum}`}
          className="w-20 h-20 object-contain"
        />
      </div>

      <div className="w-full">
        <span className="text-[8px] font-bold text-suave block uppercase tracking-wider">
          Acerca tu móvil o escanea el QR
        </span>
      </div>
    </div>
  );
}
