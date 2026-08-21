import React from 'react';
import { Printer, X } from 'lucide-react';
import { formatCOP } from '../../lib/dian';

export default function TicketModal({ ticket, company, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto hide-scrollbar">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-300">Vista Previa de Impresión</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div id="printable-receipt" className="bg-white text-slate-900 p-4 rounded-xl text-xs space-y-3 font-mono shadow-inner">
          <div className="text-center space-y-0.5">
            <h3 className="font-bold text-sm uppercase">{company.name}</h3>
            <p>NIT: {company.nit}</p>
            <p>{company.address}</p>
            <p>Tel: {company.phone}</p>
            <p className="font-bold pt-1.5 border-t border-slate-200 mt-1">{ticket?.type}</p>
            <p className="text-[10px]">Nº {ticket?.number}</p>
            <p className="text-[9px]">Res. DIAN: {company.dianResolution}</p>
          </div>

          <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1 text-[11px]">
            <p>Fecha: {ticket?.date}</p>
            <p>Cliente: {ticket?.customer?.name}</p>
            <p>NIT/CC: {ticket?.customer?.nit}</p>
            <p>Pago: {ticket?.paymentMethod}</p>
          </div>

          <div className="space-y-1 text-[11px]">
            {ticket?.items?.map((it, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{it.quantity}x {it.name}</span>
                <span>{formatCOP(it.price * it.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
            <div className="flex justify-between"><span>Subtotal:</span><span>{formatCOP(ticket?.subtotal)}</span></div>
            <div className="flex justify-between"><span>{company.taxType} ({company.taxRate}%):</span><span>{formatCOP(ticket?.tax)}</span></div>
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200"><span>TOTAL:</span><span>{formatCOP(ticket?.total)}</span></div>
          </div>

          {ticket?.isElectronic && (
            <div className="text-[9px] break-all border-t border-slate-200 pt-2">
              <p className="font-bold">CUFE DIAN:</p>
              <p className="font-mono text-[8px] bg-slate-100 p-1 rounded mt-0.5">{ticket?.cufe}</p>
              <div className="w-20 h-20 bg-slate-900 mx-auto mt-2 rounded flex items-center justify-center text-white text-[8px] font-sans">
                QR DIAN
              </div>
            </div>
          )}

          <div className="text-center text-[10px] text-slate-500 pt-2">{company.footerText}</div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition-all"
          >
            <Printer className="w-4 h-4" /> Imprimir Ticket
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
