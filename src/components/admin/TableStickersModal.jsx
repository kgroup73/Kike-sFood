import { X, Printer, Nfc } from 'lucide-react';
import QrCodeImage from '../ui/QrCode';
import { tableUrl } from './tableLinks';

/** Hoja de stickers para imprimir: uno por mesa, con QR y aviso de NFC. Pensada para blanco y negro. */
export default function TableStickersModal({ onClose, tenant, tables }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-tinta/40 animate-fadeIn">
      <div role="dialog" aria-modal="true" aria-label="Stickers de las mesas" className="bg-plato w-full max-w-5xl rounded-t-[28px] sm:rounded-[28px] max-h-[94vh] flex flex-col overflow-hidden animate-sheet">
        <div className="flex items-start justify-between gap-4 px-5 sm:px-7 py-5 border-b border-linea print-hidden">
          <div className="space-y-1">
            <h2 className="block-title">Stickers de las mesas</h2>
            <p className="text-suave">Imprímelos en papel adhesivo y pégalos sobre cada mesa. {tables.length} listos.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => window.print()} className="btn btn-primary">
              <Printer className="w-4 h-4" aria-hidden="true" /> Imprimir
            </button>
            <button onClick={onClose} aria-label="Cerrar" className="icon-btn">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="print-area overflow-y-auto flex-1 bg-mantel p-5 sm:p-7 print:overflow-visible print:p-0 print:bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 print:grid-cols-2 print:gap-6">
            {tables.map((table) => (
              <div
                key={table.id}
                className="bg-white text-black rounded-3xl border-2 border-black p-6 flex flex-col items-center text-center gap-4 print:break-inside-avoid"
              >
                <p className="font-display font-bold text-base leading-tight">{tenant.name}</p>
                <p className="font-display font-extrabold leading-none tracking-tight">
                  <span className="block text-lg">Mesa</span>
                  <span className="block text-7xl">{table.label}</span>
                </p>
                <QrCodeImage value={tableUrl(tenant.slug, table.token)} size={144} label={`QR de la mesa ${table.label}`} className="w-36 h-36 object-contain" />
                <div className="w-full border-t-2 border-dashed border-black pt-3 space-y-1">
                  <p className="font-bold flex items-center justify-center gap-1.5">
                    <Nfc className="w-5 h-5" aria-hidden="true" /> Acerca tu celular aquí
                  </p>
                  <p className="text-sm">o escanea el código para ver la carta y pedir</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
