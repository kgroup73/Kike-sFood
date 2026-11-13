import { useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { tableUrl } from '../tableLinks';
import { buildStickersHtml } from './stickerHtmlTemplate';

/**
 * Custom Hook de Orquestación para Impresión de Stickers (SoC - Capa 3).
 * Aísla la generación asíncrona de DataURLs QR en base64,
 * la creación de iframes de impresión y la exportación de blobs HTML.
 */
export function useTableStickers({ tenant, tables = [], initialTableId = 'all' }) {
  const [printing, setPrinting] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState(initialTableId || 'all');
  const [printMode, setPrintMode] = useState('color'); // 'color' | 'mono'

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
        const url = tableUrl(tenant?.slug, t.token);
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 500,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#1E2B24', light: '#ffffff' }
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
      const html = buildStickersHtml(tenant, tablesWithQr, printMode);

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
      const html = buildStickersHtml(tenant, tablesWithQr, printMode);
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

  return {
    printing,
    selectedTableId,
    setSelectedTableId,
    printMode,
    setPrintMode,
    targetTables,
    handlePrint,
    handleExportNewTab
  };
}
