import React, { useState } from 'react';
import { Lock, Receipt, X } from 'lucide-react';
import { formatCOP, generateCUFE } from '../../lib/dian';

export default function BillingModal({
  order,
  company,
  customers,
  canDian = true,
  onClose,
  openNewCustomer,
  generateInvoice
}) {
  const [invoiceType, setInvoiceType] = useState(canDian ? 'electronic' : 'pos');
  const [selectedCustId, setSelectedCustId] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');

  const subtotal = order ? order.items.reduce((s, i) => s + (i.price * i.quantity), 0) : 0;
  const tax = subtotal * (company.taxRate / 100);
  const total = subtotal + tax;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" /> Facturar Comanda #{order?.id}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Tipo de Comprobante</label>
            <select
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="pos">Tiquete POS</option>
              <option value="electronic" disabled={!canDian}>
                Factura Electrónica de Venta (DIAN) {!canDian ? '— Plan Premium' : ''}
              </option>
            </select>
            {!canDian && (
              <p className="text-[10px] text-amber-400/80 mt-1 flex items-center gap-1">
                <Lock className="w-3 h-3" /> La facturación electrónica DIAN requiere el plan Premium.
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-400">Cliente / Adquirente</label>
              <button onClick={openNewCustomer} className="text-orange-500 hover:underline text-[11px] font-semibold">
                + Nuevo Cliente
              </button>
            </div>
            <select
              value={selectedCustId}
              onChange={(e) => setSelectedCustId(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.nit})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Método de Pago</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta Crédito/Débito">Tarjeta Crédito/Débito</option>
              <option value="Transferencia / Nequi">Transferencia / Nequi</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-400"><span>Subtotal:</span><span>{formatCOP(subtotal)}</span></div>
          <div className="flex justify-between text-slate-400"><span>{company.taxType} ({company.taxRate}%):</span><span>{formatCOP(tax)}</span></div>
          <div className="flex justify-between font-bold text-white text-sm pt-1.5 border-t border-slate-800">
            <span>TOTAL A COBRAR:</span>
            <span className="text-emerald-400">{formatCOP(total)}</span>
          </div>
        </div>

        <button
          onClick={() => {
            const customer = customers.find(c => c.id === selectedCustId) || customers[0];
            const isElec = invoiceType === 'electronic';
            const cufe = isElec ? generateCUFE('FE', new Date().toISOString(), total, customer.nit) : null;
            generateInvoice({
              type: isElec ? 'Factura Electrónica' : 'Tique POS',
              isElectronic: isElec,
              cufe,
              dianStatus: isElec ? 'Aprobado DIAN 🟢' : 'N/A',
              customer,
              paymentMethod,
              items: order.items,
              subtotal,
              tax,
              total
            });
          }}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
        >
          {canDian ? 'Emitir Comprobante y Enviar a DIAN' : 'Emitir Comprobante'}
        </button>
      </div>
    </div>
  );
}
