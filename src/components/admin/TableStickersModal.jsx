import { createPortal } from 'react-dom';
import { X, Printer, QrCode, FileDown, Loader2 } from 'lucide-react';
import { useTableStickers } from './stickers/useTableStickers';
import StickersToolbar from './stickers/StickersToolbar';
import StickerPreviewCard from './stickers/StickerPreviewCard';

/**
 * Shell Presentacional del Modal de Stickers para Mesas (SoC - Capa 4).
 * Desacoplado: orquestado mediante `useTableStickers` y sub-componentes modulares.
 */
export default function TableStickersModal({ onClose, tenant, tables = [], initialTableId = 'all' }) {
  const {
    printing,
    selectedTableId,
    setSelectedTableId,
    printMode,
    setPrintMode,
    targetTables,
    handlePrint,
    handleExportNewTab
  } = useTableStickers({ tenant, tables, initialTableId });

  const modalNode = (
    <div
      id="print-stickers-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-tinta/80 backdrop-blur-sm animate-fadeIn overflow-y-auto print-modal-overlay"
    >
      <div className="bg-plato border border-linea text-tinta w-full max-w-4xl rounded-3xl p-5 sm:p-7 shadow-2xl relative space-y-5 my-auto max-h-[92vh] flex flex-col print-modal-content animate-scaleIn">
        {/* Header con acciones */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-linea pb-4 gap-3 print-hidden">
          <div className="space-y-1">
            <h3 className="font-display font-extrabold text-lg sm:text-xl text-tinta flex items-center gap-2">
              <QrCode className="w-5 h-5 text-hoja" />
              Stickers para Mesas (NFC + QR)
            </h3>
            <p className="text-xs text-suave">
              Imprime el lote completo o selecciona una mesa en particular según el manual de marca Kike's.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportNewTab}
              disabled={printing || !targetTables.length}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-mantel hover:bg-linea/60 active:scale-95 text-tinta text-xs font-bold rounded-xl border border-linea flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
              title="Abre la hoja limpia en una pestaña nueva"
            >
              <FileDown className="w-4 h-4 text-suave" /> Exportar / PDF
            </button>

            <button
              onClick={handlePrint}
              disabled={printing || !targetTables.length}
              className="flex-1 sm:flex-initial px-4 py-2 bg-hoja hover:opacity-90 active:scale-95 text-sobre-hoja text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              {printing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Preparando...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" /> Imprimir ({targetTables.length})
                </>
              )}
            </button>

            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="p-2 rounded-full bg-mantel text-suave hover:text-tinta border border-linea transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de opciones */}
        <StickersToolbar
          selectedTableId={selectedTableId}
          setSelectedTableId={setSelectedTableId}
          tables={tables}
          printMode={printMode}
          setPrintMode={setPrintMode}
        />

        {/* Rejilla de vista previa en pantalla */}
        <div className="print-area print-stickers overflow-y-auto flex-1 pr-1 print:overflow-visible print:p-0">
          <div
            className={
              targetTables.length === 1
                ? 'flex justify-center py-4'
                : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 print:grid-cols-2 print:gap-3'
            }
          >
            {targetTables.map((table) => (
              <StickerPreviewCard
                key={table.id}
                table={table}
                tenant={tenant}
                isSingle={targetTables.length === 1}
                printMode={printMode}
              />
            ))}
          </div>
        </div>

        {/* Footer info (No imprimible) */}
        <div className="text-center pt-2 border-t border-linea text-[11px] text-suave flex flex-col sm:flex-row items-center justify-between gap-2 print-hidden">
          <span>
            {targetTables.length === 1 ? (
              <>
                Imprimiendo <strong>1 sticker individual</strong> ({printMode === 'mono' ? 'Una tinta' : 'Color oficial'} · 8.8 × 8.5 cm).
              </>
            ) : (
              <>
                Imprimiendo <strong>{targetTables.length} stickers</strong> ({printMode === 'mono' ? 'Una tinta' : 'Color oficial'} · 8.8 × 8.5 cm · 6 por hoja A4).
              </>
            )}
          </span>
          <span className="font-mono text-hoja font-bold">
            {targetTables.length} {targetTables.length === 1 ? 'sticker' : 'stickers'}
          </span>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}
