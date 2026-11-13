import { useState } from 'react';
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Send,
  Loader2,
  Lock
} from 'lucide-react';

export default function UpgradeCodesManager({
  upgradeCodes,
  createUpgradeCode
}) {
  const [showModal, setShowModal] = useState(false);
  const [plan, setPlan] = useState('intermedio');
  const [durationDays, setDurationDays] = useState('30');
  const [targetSlug, setTargetSlug] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [newlyCreatedCode, setNewlyCreatedCode] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (generating) return;
    setGenerating(true);
    try {
      const duration = durationDays === 'perm' ? null : Number(durationDays);
      const res = await createUpgradeCode({
        plan,
        durationDays: duration,
        targetSlug: targetSlug.trim() || null
      });
      setNewlyCreatedCode(res);
      setTargetSlug('');
    } catch {
      // toast ya se maneja en el hook
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const shareViaWhatsApp = (code, planName, duration) => {
    const durText = duration ? `${duration} días` : 'permanente';
    const text = `¡Hola! Aquí tienes tu código de activación para Kike's Food (${planName.toUpperCase()} - ${durText}):\n\n👉 *${code}*\n\nCanjéalo ingresando al panel de tu restaurante en la sección "Planes".`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acción */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-plato p-5 rounded-2xl border border-linea">
        <div className="space-y-1">
          <h3 className="font-display font-bold text-xl text-tinta flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-hoja" /> Códigos de Activación y Upgrade
          </h3>
          <p className="text-xs text-suave max-w-xl">
            Genera códigos para que los dueños de restaurantes mejoren su plan de forma autónoma desde su panel administrativo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewlyCreatedCode(null);
            setShowModal(true);
          }}
          className="btn btn-primary text-sm flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Generar Código
        </button>
      </div>

      {/* Tabla / Lista de Códigos */}
      <div className="card border-linea overflow-hidden">
        <div className="p-4 border-b border-linea bg-plato/50 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-suave">
            Historial de Códigos ({upgradeCodes.length})
          </span>
        </div>

        {upgradeCodes.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <KeyRound className="w-10 h-10 text-suave mx-auto opacity-40" />
            <p className="font-display font-bold text-base text-tinta">No hay códigos generados</p>
            <p className="text-xs text-suave">Haz clic en "Generar Código" para crear el primero.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-plato text-xs uppercase tracking-wider text-suave border-b border-linea">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Duración</th>
                  <th className="py-3 px-4">Destino</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Expiración</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linea">
                {upgradeCodes.map((c) => {
                  const isRedeemed = Boolean(c.redeemed_at || c.redeemedAt);
                  const isExpired = !isRedeemed && new Date(c.expires_at || c.expiresAt) < new Date();
                  const isValid = !isRedeemed && !isExpired;
                  const codeStr = c.code;
                  const planStr = c.plan;
                  const duration = c.duration_days ?? c.durationDays;
                  const target = c.target_slug ?? c.targetSlug;
                  const redeemedSlug = c.redeemed_slug ?? c.redeemedSlug;

                  return (
                    <tr key={c.id || c.code} className="hover:bg-plato/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-tinta">
                        <span className="bg-mantel px-2 py-1 rounded border border-linea">
                          {codeStr}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase border ${
                            planStr === 'premium'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          {planStr}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-suave">
                        {duration ? `${duration} días` : 'Permanente'}
                      </td>

                      <td className="py-3.5 px-4 text-suave">
                        {target ? (
                          <span className="font-semibold text-tinta">@{target}</span>
                        ) : (
                          <span className="text-suave/70 italic">Cualquiera</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isRedeemed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            Canjeado {redeemedSlug ? `por @${redeemedSlug}` : ''}
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                            Expirado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ● Disponible
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-suave">
                        {new Date(c.expires_at || c.expiresAt).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(codeStr)}
                            className="p-1.5 rounded-lg border border-linea hover:border-tinta transition-colors"
                            title="Copiar código"
                          >
                            {copiedCode === codeStr ? (
                              <Check className="w-4 h-4 text-hoja" />
                            ) : (
                              <Copy className="w-4 h-4 text-suave" />
                            )}
                          </button>

                          {isValid && (
                            <button
                              type="button"
                              onClick={() => shareViaWhatsApp(codeStr, planStr, duration)}
                              className="p-1.5 rounded-lg border border-linea hover:border-emerald-600 hover:text-emerald-600 transition-colors"
                              title="Compartir por WhatsApp"
                            >
                              <Send className="w-4 h-4 text-suave hover:text-emerald-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Generador de Código */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card bg-mantel border-linea max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            {newlyCreatedCode ? (
              <div className="space-y-5 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-display font-bold text-2xl text-tinta">¡Código Generado!</h3>
                  <p className="text-xs text-suave">
                    Copia este código y envíalo al dueño del restaurante para que lo canjee.
                  </p>
                </div>

                <div className="p-4 bg-plato border-2 border-dashed border-linea rounded-2xl space-y-2">
                  <span className="font-mono text-2xl font-extrabold tracking-widest text-tinta select-all block">
                    {newlyCreatedCode.code}
                  </span>
                  <div className="text-xs text-suave flex items-center justify-center gap-2">
                    <span className="capitalize font-bold text-tinta">{newlyCreatedCode.plan}</span>
                    <span>•</span>
                    <span>{newlyCreatedCode.durationDays ? `${newlyCreatedCode.durationDays} días` : 'Permanente'}</span>
                    {newlyCreatedCode.targetSlug && (
                      <>
                        <span>•</span>
                        <span>Para @{newlyCreatedCode.targetSlug}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(newlyCreatedCode.code)}
                    className="btn btn-quiet flex-1 flex items-center justify-center gap-1.5 text-sm"
                  >
                    {copiedCode === newlyCreatedCode.code ? (
                      <>
                        <Check className="w-4 h-4 text-hoja" /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copiar Código
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      shareViaWhatsApp(
                        newlyCreatedCode.code,
                        newlyCreatedCode.plan,
                        newlyCreatedCode.durationDays
                      )
                    }
                    className="btn btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Send className="w-4 h-4" /> WhatsApp
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setNewlyCreatedCode(null);
                    setShowModal(false);
                  }}
                  className="btn btn-sm btn-quiet w-full text-xs"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-xl text-tinta flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-hoja" /> Generar Código de Upgrade
                  </h3>
                  <p className="text-xs text-suave">
                    Configura el plan, la duración y las restricciones del código.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-suave">
                    Plan a Otorgar
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPlan('intermedio');
                        if (targetSlug === 'la-trattoria') setTargetSlug('');
                      }}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition-colors ${
                        plan === 'intermedio'
                          ? 'border-tinta bg-tinta text-mantel'
                          : 'border-linea bg-plato hover:border-tinta'
                      }`}
                    >
                      Plan Intermedio
                      <span className="block text-[10px] text-emerald-600 font-semibold mt-0.5">
                        Disponible para clientes
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPlan('premium');
                        setTargetSlug('la-trattoria');
                      }}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition-colors relative ${
                        plan === 'premium'
                          ? 'border-tinta bg-tinta text-mantel'
                          : 'border-linea bg-plato hover:border-tinta'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-amber-500" /> Plan Premium
                      </div>
                      <span className="block text-[9px] text-amber-500 font-normal mt-0.5">
                        Solo pruebas (@la-trattoria)
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-suave">
                    Duración del Plan
                  </label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="field py-2 text-sm w-full"
                  >
                    <option value="30">30 días (1 mes)</option>
                    <option value="90">90 días (3 meses)</option>
                    <option value="180">180 días (6 meses)</option>
                    <option value="365">365 días (1 año)</option>
                    <option value="perm">Permanente / Indefinido</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-suave">
                    Restringir a Restaurante Específico (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: chalas-bar (o dejar vacío para cualquiera)"
                    value={targetSlug}
                    disabled={plan === 'premium'}
                    onChange={(e) => setTargetSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="field py-2 text-sm w-full font-mono disabled:opacity-60 disabled:bg-linea"
                  />
                  <p className="text-[11px] text-suave">
                    {plan === 'premium'
                      ? 'El plan Premium solo está habilitado para pruebas en @la-trattoria.'
                      : 'Si indicas el slug, solo ese restaurante podrá canjearlo. Si lo dejas vacío, cualquier cliente con el código puede activarlo.'}
                  </p>
                </div>

                {plan === 'premium' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                    <strong>Aviso de pruebas:</strong> El plan Premium está bloqueado para restaurantes de producción y solo se permite en la-trattoria para pruebas de caja/DIAN.
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-sm btn-quiet"
                    disabled={generating}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="btn btn-sm btn-primary min-w-28"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Generar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
