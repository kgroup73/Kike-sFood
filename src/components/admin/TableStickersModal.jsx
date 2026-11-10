import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, QrCode, Zap, FileDown, Loader2, Filter } from 'lucide-react';
import QRCode from 'qrcode';
import Timbre from '../ui/Timbre';
import QrCodeImage from '../ui/QrCode';
import { tableUrl } from './tableLinks';

// El nombre del restaurante y las etiquetas las escribe el admin: se escapan antes de
// insertarlas en el documento de impresión (que comparte origen con la app).
const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

// Plantilla HTML optimizada para impresión: tamaño compacto realista (8.8 x 8.4 cm, 6 por hoja A4)
function buildStickersHtml(tenant, tablesWithQr) {
  const tenantName = escapeHtml(tenant.name);
  const isSingle = tablesWithQr.length === 1;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Stickers Mesas - ${tenantName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background: #ffffff;
      color: #000000;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      background: #0f172a;
      color: #ffffff;
      border-radius: 10px;
      margin: 8px;
    }
    .btn-print {
      background: #f59e0b;
      color: #000000;
      font-weight: 800;
      border: none;
      padding: 7px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
    }
    @media print {
      .header-bar { display: none !important; }
      body { margin: 0 !important; padding: 0 !important; }
    }
    .container {
      ${
        isSingle
          ? `display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 250mm; padding: 10mm;`
          : `display: grid; grid-template-columns: repeat(2, 88mm); justify-content: center; gap: 7mm 10mm; padding: 2mm 0;`
      }
    }
    .sticker-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .sticker {
      width: 88mm;
      height: 85mm;
      border: 2px solid #000000;
      border-radius: 12px;
      padding: 6mm 8mm;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      position: relative;
      box-sizing: border-box;
    }
    .brand-name {
      font-size: 8.5px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #000000;
      margin-bottom: 1px;
    }
    .table-num {
      font-size: 19px;
      font-weight: 900;
      color: #000000;
      letter-spacing: -0.3px;
      line-height: 1.1;
      margin-bottom: 2px;
    }
    .qr-box {
      background: #ffffff;
      border: 2px solid #000000;
      border-radius: 10px;
      padding: 2mm;
      margin: 1.5mm auto;
      display: inline-block;
      line-height: 0;
    }
    .qr-img {
      width: 44mm;
      height: 44mm;
      display: block;
    }
    .nfc-pill {
      width: 100%;
      background: #000000;
      color: #ffffff;
      padding: 4.5px 8px;
      border-radius: 6px;
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      border: 1px solid #000000;
      margin-top: 2px;
      box-sizing: border-box;
    }
    .scan-note {
      font-size: 7.5px;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-top: 2px;
    }
    .powered {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
      margin-top: 3px;
      font-size: 7px;
      font-weight: 800;
      color: #000000;
    }
    .single-guide {
      margin-top: 8px;
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
    }
    .corner { position: absolute; width: 7px; height: 7px; border-color: #000000; border-style: solid; }
    .corner-tl { top: 4px; left: 4px; border-width: 1.5px 0 0 1.5px; }
    .corner-tr { top: 4px; right: 4px; border-width: 1.5px 1.5px 0 0; }
    .corner-bl { bottom: 4px; left: 4px; border-width: 0 0 1.5px 1.5px; }
    .corner-br { bottom: 4px; right: 4px; border-width: 0 1.5px 1.5px 0; }
  </style>
</head>
<body>
  <div class="header-bar">
    <div>
      <h2 style="font-size: 14px; font-weight: 800;">Stickers de Mesas — ${tenantName}</h2>
      <p style="font-size: 11px; opacity: 0.85;">
        ${
          isSingle
            ? `Sticker individual de Mesa #${escapeHtml(tablesWithQr[0].label)} (formato compacto 8.8 × 8.4 cm)`
            : `${tablesWithQr.length} stickers (formato compacto 8.8 × 8.4 cm, 6 por hoja A4)`
        }
      </p>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar en PDF</button>
  </div>
  <div class="container">
    ${tablesWithQr
      .map(
        (t) => `
      <div class="sticker-wrapper">
        <div class="sticker">
          <div class="corner corner-tl"></div>
          <div class="corner corner-tr"></div>
          <div class="corner corner-bl"></div>
          <div class="corner corner-br"></div>
          <div>
            <div class="brand-name">${tenantName}</div>
            <div class="table-num">MESA ${escapeHtml(t.label)}</div>
          </div>
          <div class="qr-box">
            <img class="qr-img" src="${t.qrDataUrl}" alt="QR Mesa ${escapeHtml(t.label)}" />
          </div>
          <div style="width: 100%;">
            <div class="nfc-pill">📲 Toca con tu celular (NFC)</div>
            <div class="scan-note">O escanea con la cámara</div>
            <div class="powered"><svg viewBox="6 14 52 41" width="11" height="9" aria-hidden="true" fill="#000"><circle cx="32" cy="19" r="4.5"/><rect x="30" y="21" width="4" height="5"/><path d="M11 45a21 21 0 0 1 42 0z"/><rect x="6" y="47" width="52" height="8" rx="4"/><path d="M26 31v11M37.5 31L29 36.5l8.5 5.5" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Kike's</div>
          </div>
        </div>
        ${isSingle ? `<div class="single-guide header-bar" style="background:none; color:#64748b; margin:6px 0 0 0; font-size:10px;">✂️ Tamaño de corte: 8.8 cm × 8.4 cm</div>` : ''}
      </div>
    `
      )
      .join('')}
  </div>
</body>
</html>`;
}

export default function TableStickersModal({ onClose, tenant, tables = [], initialTableId = 'all' }) {
  const [printing, setPrinting] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState(initialTableId || 'all');

  // Filtrado reactivo de mesas (todas o una específica)
  const targetTables = useMemo(() => {
    if (selectedTableId === 'all') return tables;
    const found = tables.find((t) => t.id === selectedTableId || String(t.label) === String(selectedTableId));
    return found ? [found] : tables;
  }, [tables, selectedTableId]);

  // Genera data URLs en base64 para que la impresión sea instantánea
  const prepareTablesWithQr = async (tablesList) => {
    return Promise.all(
      tablesList.map(async (t) => {
        const url = tableUrl(tenant.slug, t.token);
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 500,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#000000', light: '#ffffff' }
        });
        return { ...t, url, qrDataUrl };
      })
    );
  };

  // Impresión aislada mediante iframe
  const handlePrint = async () => {
    setPrinting(true);
    try {
      const tablesWithQr = await prepareTablesWithQr(targetTables);
      const html = buildStickersHtml(tenant, tablesWithQr);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 4000);
      }, 350);
    } catch (err) {
      console.error(err);
      document.body.classList.add('printing-stickers-active');
      window.print();
      setTimeout(() => document.body.classList.remove('printing-stickers-active'), 1000);
    } finally {
      setPrinting(false);
    }
  };

  // Exportar a nueva pestaña limpia
  const handleExportNewTab = async () => {
    setPrinting(true);
    try {
      const tablesWithQr = await prepareTablesWithQr(targetTables);
      const html = buildStickersHtml(tenant, tablesWithQr);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.target = '_blank';
        a.click();
      }
    } finally {
      setPrinting(false);
    }
  };

  const modalNode = (
    <div
      id="print-stickers-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto print-modal-overlay"
    >
      <div className="bg-slate-900 border border-slate-800 text-white w-full max-w-4xl rounded-3xl p-5 sm:p-7 shadow-2xl relative space-y-5 my-auto max-h-[92vh] flex flex-col print-modal-content">
        {/* Header con selector de mesa individual o lote */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-3 print-hidden">
          <div className="space-y-1">
            <h3 className="font-bold text-lg sm:text-xl text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-400" />
              Stickers para Mesas (NFC + QR)
            </h3>
            <p className="text-xs text-slate-400">
              Imprime el lote completo o selecciona una mesa en particular para reponer su sticker.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportNewTab}
              disabled={printing || !targetTables.length}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all shadow disabled:opacity-50"
              title="Abre la hoja limpia en una pestaña nueva"
            >
              <FileDown className="w-4 h-4" /> Exportar / PDF
            </button>

            <button
              onClick={handlePrint}
              disabled={printing || !targetTables.length}
              className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 text-xs font-black rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
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
              className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de selección de mesa específica */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs print-hidden">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-300">Seleccionar qué imprimir:</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="w-full sm:w-64 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
            >
              <option value="all">Todas las mesas ({tables.length} stickers)</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Mesa #{t.label} (Sticker individual)
                </option>
              ))}
            </select>

            {selectedTableId !== 'all' && (
              <button
                onClick={() => setSelectedTableId('all')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold shrink-0"
              >
                Ver todas
              </button>
            )}
          </div>
        </div>

        {/* Rejilla de vista previa en pantalla: formato compacto y realista */}
        <div className="print-area print-stickers overflow-y-auto flex-1 pr-1 print:overflow-visible print:p-0">
          <div
            className={
              targetTables.length === 1
                ? 'flex justify-center py-4'
                : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 print:grid-cols-2 print:gap-3'
            }
          >
            {targetTables.map((table) => {
              const tableNum = table.label;
              const targetUrl = tableUrl(tenant.slug, table.token);

              return (
                <div
                  key={table.id}
                  className={`bg-white text-slate-900 rounded-xl p-3 border-2 border-slate-950 shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden sticker-card w-full ${
                    targetTables.length === 1 ? 'max-w-[220px]' : ''
                  }`}
                  style={{ minHeight: '215px', maxHeight: '235px' }}
                >
                  <div className="absolute top-1.5 left-1.5 w-2 h-2 border-t-2 border-l-2 border-slate-900" />
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t-2 border-r-2 border-slate-900" />
                  <div className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b-2 border-l-2 border-slate-900" />
                  <div className="absolute bottom-1.5 right-1.5 w-2 h-2 border-b-2 border-r-2 border-slate-900" />

                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black tracking-wider text-slate-800 uppercase block">
                      {tenant.name}
                    </span>
                    <h4 className="font-black text-base text-slate-950 tracking-tight leading-tight">
                      MESA {tableNum}
                    </h4>
                  </div>

                  <div className="p-1 bg-white rounded-lg border-2 border-slate-900 shadow-sm my-1">
                    <QrCodeImage
                      value={targetUrl}
                      size={130}
                      label={`QR Mesa ${tableNum}`}
                      className="w-28 h-28 object-contain"
                    />
                  </div>

                  <div className="space-y-0.5 w-full">
                    <div className="bg-slate-950 text-white py-1 px-2 rounded-md flex items-center justify-center gap-1 shadow-sm border border-slate-900">
                      <Zap className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                      <span className="text-[8px] font-black tracking-wider uppercase">
                        Toca con tu celular (NFC)
                      </span>
                    </div>
                    <span className="text-[7px] font-bold text-slate-600 block uppercase tracking-wider">
                      O escanea con la cámara
                    </span>
                    <span className="flex items-center justify-center gap-1 text-[7px] font-extrabold text-slate-950">
                      <Timbre className="w-3 h-3" mono />
                      Kike's
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info (No imprimible) */}
        <div className="text-center pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 print-hidden">
          <span>
            {targetTables.length === 1 ? (
              <>
                Imprimiendo <strong>1 sticker individual</strong> (formato compacto 8.8 × 8.4 cm).
              </>
            ) : (
              <>
                Imprimiendo <strong>{targetTables.length} stickers</strong> (formato estándar 8.8 × 8.4 cm — 6 por hoja A4).
              </>
            )}
          </span>
          <span className="font-mono text-amber-400 font-bold">
            {targetTables.length} {targetTables.length === 1 ? 'sticker' : 'stickers'}
          </span>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}
