import React from 'react';
import { X, Printer, QrCode, Zap, Smartphone, Sparkles } from 'lucide-react';

export default function TableStickersModal({
  isOpen,
  onClose,
  company,
  tableCount = 12
}) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getTableUrl = (tableNum) => {
    const origin = window.location.origin;
    const slug = company.slug || 'trattoria';
    return `${origin}/?r=${slug}&mesa=${tableNum}&nfc=true`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-[#1e1b13] border border-[#383324] text-[#fdfcf7] w-full max-w-4xl rounded-3xl p-5 sm:p-7 shadow-2xl relative space-y-5 my-auto max-h-[92vh] flex flex-col">
        
        {/* Header (No imprimible) */}
        <div className="flex items-start justify-between border-b border-[#383324] pb-4 print:hidden">
          <div className="space-y-1">
            <h3 className="font-serif font-black text-lg sm:text-xl text-[#fdfcf7] flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#b8960e]" />
              Stickers Híbridos para Mesas (NFC + QR)
            </h3>
            <p className="text-xs text-[#857f5d]">
              Listos para imprimir en papel adhesivo o acrílicos de mesa. Cada sticker incluye el código QR y la guía de toque NFC.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-[#9b7e09] to-[#b8960e] hover:from-[#b8960e] hover:to-[#9b7e09] active:scale-95 text-[#fdfcf7] text-xs font-black rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Stickers</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#2c271d] text-[#857f5d] hover:text-[#fdfcf7] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Grid of Table Stickers */}
        <div className="overflow-y-auto flex-1 pr-1 print:overflow-visible print:p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-2 print:gap-6">
            {Array.from({ length: tableCount }, (_, i) => {
              const tableNum = String(i + 1);
              const targetUrl = getTableUrl(tableNum);
              const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(targetUrl)}&margin=1`;

              return (
                <div
                  key={tableNum}
                  className="bg-[#fdfcf7] text-[#1a1711] rounded-3xl p-5 border-2 border-[#b8960e] shadow-xl flex flex-col items-center justify-between text-center relative overflow-hidden print:border-2 print:border-black print:break-inside-avoid print:shadow-none"
                  style={{ minHeight: '340px' }}
                >
                  {/* Decorative Corner Accents */}
                  <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#b8960e]" />
                  <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#b8960e]" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#b8960e]" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#b8960e]" />

                  {/* Top Branding */}
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black tracking-widest text-[#9b7e09] uppercase block">
                      {company.name}
                    </span>
                    <h4 className="font-serif font-black text-xl text-[#1a1711] tracking-tight">
                      MESA {tableNum}
                    </h4>
                  </div>

                  {/* QR Code Graphic */}
                  <div className="p-2 bg-white rounded-2xl border border-[#e9e2ca] shadow-sm my-2">
                    <img
                      src={qrImageUrl}
                      alt={`QR Mesa ${tableNum}`}
                      className="w-36 h-36 object-contain"
                      loading="lazy"
                    />
                  </div>

                  {/* Bottom NFC Instruction */}
                  <div className="space-y-1.5 w-full">
                    <div className="bg-[#14120c] text-[#fdfcf7] py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm">
                      <Zap className="w-3.5 h-3.5 text-[#b8960e] animate-pulse" />
                      <span className="text-[10px] font-black tracking-wider uppercase">
                        Toca aquí con tu celular (NFC)
                      </span>
                    </div>
                    <span className="text-[8px] font-bold text-[#857f5d] block uppercase tracking-wider">
                      O abre la cámara y escanea el QR
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info (No imprimible) */}
        <div className="text-center pt-2 border-t border-[#383324] text-[11px] text-[#857f5d] flex flex-col sm:flex-row items-center justify-between gap-2 print:hidden">
          <span>
            💡 <strong>Consejo Pro:</strong> Puedes imprimir esta hoja en papel adhesivo fotográfico y recortar los stickers para pegarlos sobre las mesas.
          </span>
          <span className="font-mono text-[#b8960e] font-bold">
            {tableCount} stickers listos
          </span>
        </div>

      </div>
    </div>
  );
}
