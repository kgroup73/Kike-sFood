import { Receipt, Calculator, ChefHat } from 'lucide-react';
import { formatCOP } from '../../lib/money';
import { PAYMENT_METHODS, INVOICE_KINDS } from '../../lib/billing';

const summarize = (items) => items.map((it) => `${it.quantity} ${it.name}`).join(', ');

export default function PosView({ tablesToPay, invoices, closes, onCharge, onViewTicket, onOpenClose }) {
  const shiftTotal = invoices.reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="page-title">Caja</h1>
          <p className="text-suave">
            {tablesToPay.length
              ? `${tablesToPay.length} ${tablesToPay.length === 1 ? 'mesa espera' : 'mesas esperan'} la cuenta`
              : 'Ninguna mesa espera la cuenta'}
          </p>
        </div>
        <button onClick={onOpenClose} className="btn btn-quiet self-start sm:self-auto">
          <Calculator className="w-4 h-4" aria-hidden="true" /> Cerrar caja (Z)
        </button>
      </div>

      <section className="space-y-4" aria-labelledby="mesas-por-cobrar">
        <h2 id="mesas-por-cobrar" className="block-title">Mesas por cobrar ({tablesToPay.length})</h2>
        {tablesToPay.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
            {tablesToPay.map((group) => (
              <article key={group.key} className="surface overflow-hidden flex flex-col">
                <header className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display font-extrabold text-3xl tracking-tight leading-none">Mesa {group.tableLabel}</h3>
                    <p className="mt-2">
                      <span className="chip chip-cobrar">{group.orders.length} {group.orders.length === 1 ? 'comanda' : 'comandas'}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-suave">Consumo</p>
                    <p className="precio font-bold text-2xl">{formatCOP(group.subtotal)}</p>
                  </div>
                </header>

                <ul className="border-t border-linea divide-y divide-linea">
                  {group.orders.map((order) => (
                    <li key={order.id} className="px-5 py-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-bold">Comanda {order.id}</p>
                        <p className="text-sm text-suave leading-snug">{summarize(order.items)}</p>
                      </div>
                      <span className="precio text-suave shrink-0">{formatCOP(order.subtotal)}</span>
                    </li>
                  ))}
                </ul>

                {group.inKitchen > 0 && (
                  <p className="mx-5 mt-1 mb-0 px-3 py-2 rounded-xl bg-maracuya/30 text-sm flex items-center gap-2">
                    <ChefHat className="w-4 h-4 shrink-0" aria-hidden="true" />
                    {group.inKitchen === 1 ? '1 comanda sigue en cocina' : `${group.inKitchen} comandas siguen en cocina`} y se cobra aparte.
                  </p>
                )}

                <div className="p-5 pt-4">
                  <button onClick={() => onCharge(group)} className="btn btn-primary w-full h-12">
                    <Receipt className="w-4 h-4" aria-hidden="true" /> Facturar mesa {group.tableLabel}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="py-10 px-6 text-center text-suave border-2 border-dashed border-linea rounded-2xl">
            Sin mesas pendientes por cobrar. Cuando la cocina pase una comanda a caja, la mesa aparece aquí.
          </p>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="comprobantes-turno">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="comprobantes-turno" className="block-title">Comprobantes del turno ({invoices.length})</h2>
          {invoices.length > 0 && <p className="precio font-bold text-lg">{formatCOP(shiftTotal)}</p>}
        </div>
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-sm text-suave border-b border-linea">
                <tr>
                  <th className="font-bold px-5 py-3">Número</th>
                  <th className="font-bold px-5 py-3">Tipo</th>
                  <th className="font-bold px-5 py-3">Mesa</th>
                  <th className="font-bold px-5 py-3">Cliente</th>
                  <th className="font-bold px-5 py-3">Pago</th>
                  <th className="font-bold px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3"><span className="sr-only">Acción</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linea">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-mantel/60">
                    <td className="px-5 py-3 precio font-bold whitespace-nowrap">{inv.number}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {INVOICE_KINDS[inv.kind]}
                      {inv.dianStatus === 'simulado' && <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded bg-maracuya">Simulada</span>}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">{inv.tableLabel || '—'}</td>
                    <td className="px-5 py-3 whitespace-nowrap">{inv.customer?.name}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-suave">{PAYMENT_METHODS[inv.paymentMethod] || inv.paymentMethod}</td>
                    <td className="px-5 py-3 text-right precio font-bold whitespace-nowrap">{formatCOP(inv.total)}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button onClick={() => onViewTicket(inv)} className="btn btn-sm btn-quiet">
                        Ver tiquete
                      </button>
                    </td>
                  </tr>
                ))}
                {!invoices.length && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-suave">
                      No hay comprobantes desde el último cierre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {closes.length > 0 && (
        <section className="space-y-4" aria-labelledby="cierres-anteriores">
          <h2 id="cierres-anteriores" className="block-title">Cierres anteriores</h2>
          <ul className="surface divide-y divide-linea overflow-hidden">
            {closes.map((z) => (
              <li key={z.id} className="px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 items-baseline">
                <span className="precio font-bold">{z.code}</span>
                <span className="text-sm text-suave">{new Date(z.periodEnd).toLocaleString('es-CO')}</span>
                <span className="text-sm text-suave">
                  {z.invoiceCount} {z.invoiceCount === 1 ? 'comprobante' : 'comprobantes'}, {z.closedByName}
                </span>
                <span className="sm:text-right">
                  <span className="precio font-bold">{formatCOP(z.totalSales)}</span>
                  <span className={`block text-sm ${z.difference === 0 ? 'text-hoja' : 'text-aji'}`}>
                    {z.difference === 0 ? 'Caja cuadrada' : `Diferencia ${formatCOP(z.difference)}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
