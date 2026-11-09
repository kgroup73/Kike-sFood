import { X, Printer, QrCode, Zap } from 'lucide-react';
import QrCodeImage from '../ui/QrCode';
import { tableUrl } from './tableLinks';

export default function TableStickersModal({ onClose, tenant, tables }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-brand-panel border border-brand-line text-brand-ivory w-full max-w-4xl rounded-3xl p-5 sm:p-7 shadow-2xl relative space-y-5 my-auto max-h-[92vh] flex flex-col">
        
        {/* Header (No imprimible) */}
        <div className="flex items-start justify-between border-b border-brand-line pb-4 print-hidden">
          <div className="space-y-1">
            <h3 className="font-serif font-black text-lg sm:text-xl text-brand-ivory flex items-center gap-2">
              <QrCode className="w-5 h-5 text-brand-gold-light" />
              Stickers Híbridos para Mesas (NFC + QR)
            </h3>
            <p className="text-xs text-brand-khaki">
              Listos para imprimir en papel adhesivo o acrílicos de mesa. Cada sticker incluye el código QR y la guía de toque NFC.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-brand-gold to-brand-gold-light hover:from-brand-gold-light hover:to-brand-gold active:scale-95 text-brand-ivory text-xs font-black rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Stickers</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="p-2 rounded-full bg-brand-raised text-brand-khaki hover:text-brand-ivory transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Grid of Table Stickers */}
        <div className="print-area overflow-y-auto flex-1 pr-1 print:overflow-visible print:p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-2 print:gap-6">
            {tables.map((table) => {
              const tableNum = table.label;
              const targetUrl = tableUrl(tenant.slug, table.token);

              return (
                <div
                  key={table.id}
                  className="bg-brand-ivory text-brand-surface rounded-3xl p-5 border-2 border-brand-gold-light shadow-xl flex flex-col items-center justify-between text-center relative overflow-hidden print:border-2 print:border-black print:break-inside-avoid print:shadow-none"
                  style={{ minHeight: '340px' }}
                >
                  {/* Decorative Corner Accents */}
                  <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-brand-gold-light" />
                  <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-brand-gold-light" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-brand-gold-light" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-brand-gold-light" />

                  {/* Top Branding */}
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black tracking-widest text-brand-gold uppercase block">
                      {tenant.name}
                    </span>
                    <h4 className="font-serif font-black text-xl text-brand-surface tracking-tight">
                      MESA {tableNum}
                    </h4>
                  </div>

                  {/* QR Code Graphic */}
                  <div className="p-2 bg-white rounded-2xl border border-brand-cream shadow-sm my-2">
                    <QrCodeImage value={targetUrl} size={144} label={`QR Mesa ${tableNum}`} className="w-36 h-36 object-contain" />
                  </div>

                  {/* Bottom NFC Instruction */}
                  <div className="space-y-1.5 w-full">
                    <div className="bg-brand-night text-brand-ivory py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm">
                      <Zap className="w-3.5 h-3.5 text-brand-gold-light animate-pulse" />
                      <span className="text-[10px] font-black tracking-wider uppercase">
                        Toca aquí con tu celular (NFC)
                      </span>
                    </div>
                    <span className="text-[8px] font-bold text-brand-khaki block uppercase tracking-wider">
                      O abre la cámara y escanea el QR
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info (No imprimible) */}
        <div className="text-center pt-2 border-t border-brand-line text-[11px] text-brand-khaki flex flex-col sm:flex-row items-center justify-between gap-2 print-hidden">
          <span>
            💡 <strong>Consejo Pro:</strong> Puedes imprimir esta hoja en papel adhesivo fotográfico y recortar los stickers para pegarlos sobre las mesas.
          </span>
          <span className="font-mono text-brand-gold-light font-bold">
            {tables.length} stickers listos
          </span>
        </div>

      </div>
    </div>
  );
}
