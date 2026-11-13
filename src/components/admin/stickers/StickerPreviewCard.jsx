import { Radio } from 'lucide-react';
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
      style={{ minHeight: '225px', maxHeight: '245px' }}
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
        <h4 className="font-display font-black text-base text-tinta tracking-tight leading-tight">
          MESA {tableNum}
        </h4>
      </div>

      <div className="p-1 bg-white rounded-lg border-2 border-tinta shadow-sm my-1">
        <QrCodeImage
          value={targetUrl}
          size={120}
          label={`QR Mesa ${tableNum}`}
          className="w-24 h-24 object-contain"
        />
      </div>

      <div className="space-y-0.5 w-full">
        <div className="bg-tinta text-plato py-1 px-2 rounded-md flex items-center justify-center gap-1 shadow-sm">
          <Radio className="w-2.5 h-2.5 text-maracuya shrink-0" />
          <span className="text-[8px] font-bold tracking-wider uppercase">
            Toca con tu celular (NFC)
          </span>
        </div>
        <span className="text-[7px] font-bold text-suave block uppercase tracking-wider">
          O escanea para pedir
        </span>
      </div>
    </div>
  );
}
