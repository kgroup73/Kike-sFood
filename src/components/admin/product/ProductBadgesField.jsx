import { ChefHat, Star, Leaf, WheatOff, Flame, Eye } from 'lucide-react';

/**
 * Selector de badges comerciales, alérgenos, nivel de picante y visibilidad del plato.
 * Mantiene la semántica, estilos de chips oficiales de Tailwind y accesibilidad.
 */
export default function ProductBadgesField({ form, set, labelClass }) {
  return (
    <div className="space-y-4 pt-3 border-t border-linea">
      <div>
        <span className={labelClass}>Distintivos y Preferencias del Platillo</span>
        <p className="help">
          Activa las etiquetas que correspondan. En la carta digital del comensal solo aparecerán los filtros de las opciones que al menos un plato tenga activas.
        </p>
      </div>

      {/* Grupo 1: Impulso Comercial & Ventas */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-suave block">
          Destacados de Venta
        </span>
        <div className="flex flex-wrap gap-2">
          <label
            className={`h-9 px-3.5 rounded-full border flex items-center gap-1.5 cursor-pointer select-none font-bold text-xs transition-colors ${
              form.isChef ? 'bg-hoja border-hoja text-sobre-hoja' : 'bg-plato border-linea hover:border-tinta'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(form.isChef)}
              onChange={(e) => set('isChef', e.target.checked)}
              className="sr-only"
            />
            <ChefHat className="w-3.5 h-3.5" /> Especial del chef
          </label>

          <label
            className={`h-9 px-3.5 rounded-full border flex items-center gap-1.5 cursor-pointer select-none font-bold text-xs transition-colors ${
              form.isPopular ? 'bg-hoja border-hoja text-sobre-hoja' : 'bg-plato border-linea hover:border-tinta'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(form.isPopular)}
              onChange={(e) => set('isPopular', e.target.checked)}
              className="sr-only"
            />
            <Star className="w-3.5 h-3.5" /> Más pedido / Popular
          </label>
        </div>
      </div>

      {/* Grupo 2: Preferencias Dietéticas & Sabor */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-suave block">
          Preferencias y Características
        </span>
        <div className="flex flex-wrap gap-2">
          <label
            className={`h-9 px-3.5 rounded-full border flex items-center gap-1.5 cursor-pointer select-none font-bold text-xs transition-colors ${
              form.isVeg ? 'bg-hoja border-hoja text-sobre-hoja' : 'bg-plato border-linea hover:border-tinta'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(form.isVeg)}
              onChange={(e) => set('isVeg', e.target.checked)}
              className="sr-only"
            />
            <Leaf className="w-3.5 h-3.5" /> Vegano
          </label>

          <label
            className={`h-9 px-3.5 rounded-full border flex items-center gap-1.5 cursor-pointer select-none font-bold text-xs transition-colors ${
              form.isGf ? 'bg-hoja border-hoja text-sobre-hoja' : 'bg-plato border-linea hover:border-tinta'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(form.isGf)}
              onChange={(e) => set('isGf', e.target.checked)}
              className="sr-only"
            />
            <WheatOff className="w-3.5 h-3.5" /> Sin gluten
          </label>

          <label
            className={`h-9 px-3.5 rounded-full border flex items-center gap-1.5 cursor-pointer select-none font-bold text-xs transition-colors ${
              form.spicyLevel > 0 || form.isSpicy
                ? 'bg-aji border-aji text-white'
                : 'bg-plato border-linea hover:border-tinta'
            }`}
          >
            <input
              type="checkbox"
              checked={Boolean(form.spicyLevel > 0 || form.isSpicy)}
              onChange={(e) => {
                const on = e.target.checked;
                set('spicyLevel', on ? 1 : 0);
                set('isSpicy', on);
              }}
              className="sr-only"
            />
            <Flame className="w-3.5 h-3.5" /> Picante
          </label>
        </div>
      </div>

      {/* Visibilidad del Platillo */}
      <div className="pt-1">
        <label
          className={`h-9 px-3.5 rounded-full border inline-flex items-center gap-1.5 cursor-pointer select-none font-bold text-xs transition-colors ${
            form.available ? 'bg-tinta border-tinta text-mantel' : 'bg-plato border-linea text-suave'
          }`}
        >
          <input
            type="checkbox"
            checked={Boolean(form.available)}
            onChange={(e) => set('available', e.target.checked)}
            className="sr-only"
          />
          <Eye className="w-3.5 h-3.5" /> {form.available ? 'Visible en la carta' : 'Oculto (Borrador)'}
        </label>
      </div>
    </div>
  );
}
