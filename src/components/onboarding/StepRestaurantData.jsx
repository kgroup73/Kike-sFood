import { UtensilsCrossed, Globe, Check, AlertCircle, RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';
import { primaryButton } from '../admin/AdminShell';

export default function StepRestaurantData({
  restaurantName,
  setRestaurantName,
  customSlug,
  setCustomSlug,
  effectiveSlug,
  slugStatus,
  city,
  setCity,
  phone,
  setPhone,
  onNext,
  onBack
}) {
  const canProceed = restaurantName.trim().length >= 2 && slugStatus.available === true;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canProceed) onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5 text-center sm:text-left">
        <h2 className="font-display font-black text-2xl text-tinta">
          Datos de tu restaurante
        </h2>
        <p className="text-suave text-sm leading-relaxed">
          Configura el nombre comercial y el enlace web que tus comensales abrirán al escanear los códigos QR.
        </p>
      </div>

      <div className="space-y-4">
        {/* Nombre del restaurante */}
        <label className="block">
          <span className="text-sm font-bold text-suave block mb-1.5">Nombre del restaurante *</span>
          <div className="relative">
            <UtensilsCrossed className="w-5 h-5 text-suave absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              required
              autoFocus
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Ej. La Trattoria Gourmet, Burger House"
              className="field !pl-11 w-full text-base h-12"
            />
          </div>
        </label>

        {/* Slug y enlace web */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-suave">Enlace personalizado (URL) *</label>
            {slugStatus.checking ? (
              <span className="text-xs text-suave flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Verificando…
              </span>
            ) : slugStatus.available === true ? (
              <span className="text-xs text-hoja font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Disponible
              </span>
            ) : slugStatus.available === false ? (
              <span className="text-xs text-aji font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {slugStatus.error || 'No disponible'}
              </span>
            ) : null}
          </div>

          <div className="relative">
            <Globe className="w-5 h-5 text-suave absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              value={customSlug || effectiveSlug}
              onChange={(e) => setCustomSlug(e.target.value)}
              placeholder="mi-restaurante"
              className={`field !pl-11 w-full text-base font-mono h-12 ${
                slugStatus.available === false ? '!border-aji !bg-aji/5' : ''
              }`}
            />
          </div>

          {effectiveSlug && (
            <p className="text-xs text-suave">
              Tus comensales entrarán en: <strong className="text-tinta">kikes.app/r/{effectiveSlug}</strong>
            </p>
          )}
        </div>

        {/* Ciudad y Teléfono */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-bold text-suave block mb-1.5">Ciudad</span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej. Bogotá, Medellín, Cali"
              className="field w-full"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-suave block mb-1.5">Teléfono de contacto</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. +57 300 123 4567"
              className="field w-full"
            />
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="btn btn-quiet"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <button
          type="submit"
          disabled={!canProceed}
          className={`${primaryButton} h-12 px-6 justify-center gap-2`}
        >
          <span>Continuar</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
