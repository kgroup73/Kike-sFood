import { useState, useMemo } from 'react';
import { Lock, Receipt, Loader2, UtensilsCrossed, Layers, Gift, X, ShieldCheck } from 'lucide-react';
import Modal from '../ui/Modal';
import { formatCOP, splitTaxIncluded, effectiveTaxRate, computeTip, toPesos } from '../../lib/money';
import { PAYMENT_METHODS, INVOICE_KINDS, CONSUMIDOR_FINAL, sumOrders, getPendingItemsForOrders } from '../../lib/billing';
import { useStaffSession } from '../../hooks/useStaffSession';
import { api } from '../../services/api';

const COURTESY_REASONS = [
  { key: 'fidelizacion', label: 'Fidelización / Cliente VIP', short: 'VIP' },
  { key: 'compensacion_servicio', label: 'Compensación por demora o servicio', short: 'Demora' },
  { key: 'degustacion', label: 'Muestra o degustación comercial', short: 'Muestra' },
  { key: 'invitacion_casa', label: 'Invitación de la casa / Dueño', short: 'Casa' }
];

export default function BillingModal({ group, tenant, customers, canDian, onClose, onNewCustomer, onIssue }) {
  const [kind, setKind] = useState(canDian ? 'electronica' : 'pos');
  const [splitMode, setSplitMode] = useState('platillos'); // 'platillos' | 'comandas'
  const [excluded, setExcluded] = useState(() => new Set());
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [submitting, setSubmitting] = useState(false);

  // Cortesías aplicadas por platillo: { [itemId]: { reason, authorizedByName } }
  const [courtesies, setCourtesies] = useState({});
  const [courtesyTarget, setCourtesyTarget] = useState(null);
  const [courtesyReason, setCourtesyReason] = useState('fidelizacion');
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Obtener sesión de personal para autorización de cortesías
  let currentStaff = null;
  try {
    currentStaff = useStaffSession()?.staff;
  } catch {
    currentStaff = null;
  }
  const isAdminSession = currentStaff && ['owner', 'admin'].includes(currentStaff.role);

  // Platillos pendientes por cobrar en la mesa
  const pendingItems = useMemo(() => getPendingItemsForOrders(group.orders), [group.orders]);

  // Cantidad seleccionada a pagar por platillo (por defecto, todas las unidades pendientes)
  const [itemQuantities, setItemQuantities] = useState(() => {
    const initial = {};
    for (const it of getPendingItemsForOrders(group.orders)) {
      initial[it.id] = it.quantity;
    }
    return initial;
  });

  const setItemQty = (id, qty) => {
    setItemQuantities((prev) => ({
      ...prev,
      [id]: qty
    }));
  };

  const selectAllItems = () => {
    const all = {};
    for (const it of pendingItems) all[it.id] = it.quantity;
    setItemQuantities(all);
  };

  const clearAllItems = () => {
    const none = {};
    for (const it of pendingItems) none[it.id] = 0;
    setItemQuantities(none);
  };

  const openCourtesyModal = (it) => {
    setCourtesyTarget(it);
    setCourtesyReason('fidelizacion');
    setAdminPin('');
    setPinError('');
  };

  const removeCourtesy = (itemId) => {
    setCourtesies((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const confirmCourtesy = async () => {
    if (!courtesyTarget) return;

    if (isAdminSession) {
      setCourtesies((prev) => ({
        ...prev,
        [courtesyTarget.id]: {
          reason: courtesyReason,
          authorizedByName: currentStaff?.displayName || 'Dueño'
        }
      }));
      setCourtesyTarget(null);
      return;
    }

    // Si no es admin, validar PIN
    setVerifyingPin(true);
    setPinError('');
    try {
      const res = await api.verifyAdminPin(adminPin);
      if (res?.ok) {
        setCourtesies((prev) => ({
          ...prev,
          [courtesyTarget.id]: {
            reason: courtesyReason,
            authorizedByName: res.displayName || 'Administrador'
          }
        }));
        setCourtesyTarget(null);
      } else {
        setPinError(res?.error || 'PIN incorrecto o no pertenece a un administrador');
      }
    } catch {
      setPinError('Error al verificar autorización');
    } finally {
      setVerifyingPin(false);
    }
  };

  // Cálculo según modo de cobro
  const selectedItems = useMemo(() => {
    return pendingItems
      .filter((it) => (itemQuantities[it.id] ?? it.quantity) > 0)
      .map((it) => ({
        ...it,
        quantity: itemQuantities[it.id] ?? it.quantity
      }));
  }, [pendingItems, itemQuantities]);

  const selectedOrders = group.orders.filter((o) => !excluded.has(o.id));

  // Las cortesías descuentan el 100% del platillo al comensal ($0)
  const subtotal = splitMode === 'platillos'
    ? selectedItems.reduce((s, it) => s + (courtesies[it.id] ? 0 : it.unitPrice * it.quantity), 0)
    : sumOrders(selectedOrders).subtotal;

  const orderIds = splitMode === 'platillos'
    ? [...new Set(selectedItems.map((it) => it.orderId))]
    : selectedOrders.map((o) => o.id);

  const hasSelection = splitMode === 'platillos' ? selectedItems.length > 0 : selectedOrders.length > 0;

  // Propina voluntaria (Ley 1935): se pregunta al cliente al cobrar. Por defecto, la sugerida.
  const [tipMode, setTipMode] = useState('sugerida');
  const [customTip, setCustomTip] = useState('');
  const suggestedTip = computeTip(subtotal, tenant.tipRate);
  const tip = tipMode === 'sugerida' ? suggestedTip : tipMode === 'otra' ? toPesos(customTip) : 0;
  const tipInvalid = tipMode === 'otra' && (customTip === '' || tip < 0 || tip > subtotal);
  const total = subtotal + tip;
  const rate = effectiveTaxRate(tenant);
  const { base, tax } = splitTaxIncluded(subtotal, rate);

  const toggleOrder = (id) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = async () => {
    setSubmitting(true);
    try {
      await onIssue({
        orderIds,
        kind,
        customerId: customerId || null,
        paymentMethod,
        tip,
        items: splitMode === 'platillos' ? selectedItems.map((it) => ({
          ...it,
          isCourtesy: !!courtesies[it.id],
          courtesyReason: courtesies[it.id]?.reason || null,
          authorizedByName: courtesies[it.id]?.authorizedByName || null
        })) : null
      });
    } finally {
      setSubmitting(false);
    }
  };

  const segment = (on) =>
    `flex-1 h-11 rounded-full border flex items-center justify-center font-bold cursor-pointer transition-colors ${
      on ? 'bg-tinta border-tinta text-mantel' : 'bg-plato border-linea hover:border-tinta'
    }`;

  return (
    <Modal title={`Cobrar mesa ${group.tableLabel}`} icon={<Receipt />} onClose={onClose} size="xl">
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">
          <fieldset className="space-y-2">
            {/* Selector de modo: Por Platillos vs Por Comandas */}
            <div className="flex items-center justify-between gap-2">
              <legend className="label !mb-0">
                {splitMode === 'platillos' ? 'Platillos a cobrar' : 'Comandas incluidas'}
              </legend>
              <div className="inline-flex rounded-lg p-0.5 bg-plato border border-linea text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSplitMode('platillos')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                    splitMode === 'platillos' ? 'bg-tinta text-mantel shadow-sm' : 'text-suave hover:text-tinta'
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" aria-hidden="true" />
                  Por platillos
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('comandas')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                    splitMode === 'comandas' ? 'bg-tinta text-mantel shadow-sm' : 'text-suave hover:text-tinta'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                  Por comandas
                </button>
              </div>
            </div>

            {/* MODO PLATILLOS */}
            {splitMode === 'platillos' ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-suave px-1">
                  <span>{selectedItems.length} de {pendingItems.length} ítems marcados</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={selectAllItems} className="font-bold text-hoja hover:underline">
                      Todos
                    </button>
                    <span>·</span>
                    <button type="button" onClick={clearAllItems} className="hover:underline">
                      Ninguno
                    </button>
                  </div>
                </div>

                <div className="surface divide-y divide-linea overflow-hidden max-h-[280px] overflow-y-auto">
                  {pendingItems.map((it) => {
                    const selectedQty = itemQuantities[it.id] ?? it.quantity;
                    const isChecked = selectedQty > 0;
                    return (
                      <div key={it.id} className="flex items-center justify-between gap-3 px-4 min-h-[52px] hover:bg-mantel/60">
                        <label className="flex items-center gap-3 cursor-pointer flex-1 py-2">
                          <input
                            type="checkbox"
                            aria-label={`Platillo ${it.name}`}
                            checked={isChecked}
                            onChange={(e) => setItemQty(it.id, e.target.checked ? it.quantity : 0)}
                            className="w-5 h-5 accent-[rgb(var(--c-hoja))]"
                          />
                          <div className="flex-1">
                            <span className="font-bold">{it.name}</span>
                            {it.selectedOptions?.length > 0 && (
                              <span className="text-xs text-suave block">{it.selectedOptions.join(', ')}</span>
                            )}
                          </div>
                        </label>
                        <div className="flex items-center gap-2.5 shrink-0">
                          {isChecked && (
                            courtesies[it.id] ? (
                              <button
                                type="button"
                                onClick={() => removeCourtesy(it.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-hoja/10 text-hoja border border-hoja/30 hover:bg-aji/10 hover:text-aji hover:border-aji/30 transition-colors"
                                title="Haz clic para quitar la cortesía"
                              >
                                <Gift className="w-3 h-3" aria-hidden="true" />
                                Cortesía ({COURTESY_REASONS.find((r) => r.key === courtesies[it.id].reason)?.short || '100%'})
                                <X className="w-3 h-3 ml-0.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openCourtesyModal(it)}
                                className="text-[11px] font-bold px-2 py-0.5 rounded border border-linea hover:border-hoja hover:text-hoja transition-colors text-suave flex items-center gap-1"
                                title="Aplicar cortesía comercial a este platillo"
                              >
                                <Gift className="w-3 h-3" aria-hidden="true" />
                                Cortesía
                              </button>
                            )
                          )}
                          {it.quantity > 1 && isChecked ? (
                            <div className="flex items-center gap-1.5 border border-linea rounded-md px-1.5 py-0.5 bg-plato">
                              <button
                                type="button"
                                onClick={() => setItemQty(it.id, Math.max(1, selectedQty - 1))}
                                className="text-sm font-bold w-6 h-6 rounded flex items-center justify-center hover:bg-mantel"
                                aria-label="Restar unidad"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold px-1">{selectedQty}/{it.quantity}</span>
                              <button
                                type="button"
                                onClick={() => setItemQty(it.id, Math.min(it.quantity, selectedQty + 1))}
                                className="text-sm font-bold w-6 h-6 rounded flex items-center justify-center hover:bg-mantel"
                                aria-label="Sumar unidad"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded bg-mantel/80 text-suave font-medium">
                              {it.quantity}x
                            </span>
                          )}
                          <span className="precio min-w-[70px] text-right">
                            {courtesies[it.id] ? (
                              <span className="flex items-center justify-end gap-1.5">
                                <span className="line-through text-xs text-suave">
                                  {formatCOP(it.unitPrice * (isChecked ? selectedQty : it.quantity))}
                                </span>
                                <span className="text-hoja font-black">$0</span>
                              </span>
                            ) : (
                              formatCOP(it.unitPrice * (isChecked ? selectedQty : it.quantity))
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* MODO COMANDAS */
              <div className="surface divide-y divide-linea overflow-hidden">
                {group.orders.map((o) => (
                  <label key={o.id} className="flex items-center justify-between gap-3 px-4 min-h-[52px] cursor-pointer hover:bg-mantel/60">
                    <span className="flex items-center gap-3">
                      <input type="checkbox" aria-label={`Comanda ${o.id}`} checked={!excluded.has(o.id)} onChange={() => toggleOrder(o.id)} className="w-5 h-5 accent-[rgb(var(--c-hoja))]" />
                      <span className="font-bold">Comanda {o.id}</span>
                      <span className="text-sm text-suave">
                        {o.items.reduce((n, it) => n + it.quantity, 0)} {o.items.reduce((n, it) => n + it.quantity, 0) === 1 ? 'plato' : 'platos'}
                      </span>
                    </span>
                    <span className="precio">{formatCOP(o.subtotal)}</span>
                  </label>
                ))}
              </div>
            )}

            {group.inKitchen > 0 && (
              <p className="help">
                {group.inKitchen === 1 ? 'Hay 1 comanda' : `Hay ${group.inKitchen} comandas`} de esta mesa en cocina. Se cobra{group.inKitchen === 1 ? '' : 'n'} aparte cuando pase{group.inKitchen === 1 ? '' : 'n'} a caja.
              </p>
            )}
          </fieldset>

          <fieldset>
            <legend className="label">Propina voluntaria</legend>
            <div className="flex gap-2">
              {[
                ['sugerida', `Sugerida ${Number(tenant.tipRate) || 0}%`],
                ['ninguna', 'Sin propina'],
                ['otra', 'Otro valor']
              ].map(([value, label]) => (
                <label key={value} className={segment(tipMode === value)}>
                  <input type="radio" name="tip-mode" value={value} checked={tipMode === value} onChange={() => setTipMode(value)} className="sr-only" />
                  {label}
                </label>
              ))}
            </div>
            {tipMode === 'otra' && (
              <input
                type="number"
                min="0"
                max={subtotal}
                step="100"
                inputMode="numeric"
                value={customTip}
                onChange={(e) => setCustomTip(e.target.value)}
                aria-label="Valor de la propina"
                placeholder="Valor en pesos"
                className="field mt-2 precio"
              />
            )}
            {tipInvalid ? (
              <p className="help !text-aji font-bold">Escribe un valor entre $0 y {formatCOP(subtotal)}.</p>
            ) : (
              <p className="help">Pregúntale al cliente si desea incluirla. Puede aceptarla, quitarla o cambiar el valor.</p>
            )}
          </fieldset>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="label">Método de pago</span>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="field">
                {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Tipo de comprobante</span>
              <select value={kind} onChange={(e) => setKind(e.target.value)} className="field">
                <option value="pos">{INVOICE_KINDS.pos}</option>
                <option value="electronica" disabled={!canDian}>
                  {INVOICE_KINDS.electronica}{!canDian ? ' (no disponible)' : ''}
                </option>
              </select>
            </label>
          </div>
          {!canDian && (
            <p className="help -mt-3 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" /> La factura electrónica requiere plan Premium y una resolución vigente.
            </p>
          )}

          <div>
            <div className="flex justify-between items-baseline">
              <label htmlFor="billing-customer" className="label">
                Cliente
              </label>
              <button onClick={onNewCustomer} className="text-sm font-bold text-hoja hover:underline underline-offset-4">
                Registrar cliente
              </button>
            </div>
            <select id="billing-customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="field">
              <option value="">
                {CONSUMIDOR_FINAL.name} ({CONSUMIDOR_FINAL.docNumber})
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.docType} {c.docNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        <aside className="lg:border-l lg:border-linea lg:pl-8 space-y-5">
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt>Consumo</dt>
              <dd className="precio">{formatCOP(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-sm text-suave pl-3">
              <dt>Base gravable</dt>
              <dd className="precio">{formatCOP(base)}</dd>
            </div>
            <div className="flex justify-between text-sm text-suave pl-3">
              <dt>
                {tenant.taxType === 'NINGUNO' ? 'Impuesto' : tenant.taxType} ({rate}%)
              </dt>
              <dd className="precio">{formatCOP(tax)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Propina voluntaria</dt>
              <dd className="precio">{formatCOP(tip)}</dd>
            </div>
            <div className="flex justify-between items-baseline pt-3 mt-1 border-t-2 border-tinta" data-testid="billing-total">
              <dt className="font-bold">Total a cobrar</dt>
              <dd className="precio font-extrabold text-3xl">{formatCOP(total)}</dd>
            </div>
          </dl>

          <button onClick={submit} disabled={submitting || !hasSelection || tipInvalid} className="btn btn-primary w-full h-14 text-base">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {kind === 'electronica' ? 'Emitir factura electrónica (simulada)' : 'Emitir tiquete POS'}
          </button>
          {!hasSelection && (
            <p className="help text-center">
              {splitMode === 'platillos' ? 'Marca al menos un platillo para cobrar.' : 'Marca al menos una comanda para cobrar.'}
            </p>
          )}
        </aside>
      </div>

      {/* Modal de Autorización y Selección de Motivo de Cortesía */}
      {courtesyTarget && (
        <Modal onClose={() => setCourtesyTarget(null)} size="sm">
          <div className="space-y-4">
            <div className="flex items-between justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Gift className="w-5 h-5 text-hoja" aria-hidden="true" />
                Aplicar Cortesía Comercial
              </h3>
              <button
                type="button"
                onClick={() => setCourtesyTarget(null)}
                className="icon-btn -mr-2 -mt-1"
                aria-label="Cerrar cortesía"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-mantel/60 rounded-xl border border-linea text-sm space-y-1">
              <p className="font-bold text-tinta">{courtesyTarget.name}</p>
              <p className="text-xs text-suave">
                Valor comercial: <span className="font-bold text-tinta">{formatCOP(courtesyTarget.unitPrice * (itemQuantities[courtesyTarget.id] ?? courtesyTarget.quantity))}</span> (100% descuento para cliente)
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="label text-xs font-bold">Motivo de la cortesía</label>
              <select
                aria-label="Motivo de la cortesía"
                value={courtesyReason}
                onChange={(e) => setCourtesyReason(e.target.value)}
                className="field text-sm"
              >
                {COURTESY_REASONS.map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Verificación de Autorización */}
            {isAdminSession ? (
              <p className="text-xs text-hoja font-bold flex items-center gap-1.5 bg-hoja/10 p-2.5 rounded-lg border border-hoja/20">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Autorizado por: {currentStaff?.displayName || 'Dueño'} (Sesión activa)
              </p>
            ) : (
              <div className="space-y-1.5 pt-1">
                <label className="label text-xs font-bold flex items-center justify-between">
                  <span>PIN de Dueño o Administrador</span>
                  <Lock className="w-3.5 h-3.5 text-suave" />
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={adminPin}
                  onChange={(e) => {
                    setAdminPin(e.target.value);
                    setPinError('');
                  }}
                  placeholder="••••"
                  className="field text-center text-lg tracking-widest font-mono"
                  autoFocus
                />
                {pinError && <p className="text-xs text-aji font-bold">{pinError}</p>}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCourtesyTarget(null)}
                className="btn btn-outline flex-1 text-sm py-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmCourtesy}
                disabled={verifyingPin || (!isAdminSession && adminPin.length < 4)}
                className="btn btn-primary flex-1 text-sm py-2"
              >
                {verifyingPin ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Cortesía'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
