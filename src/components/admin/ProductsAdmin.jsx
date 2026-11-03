import { useState } from 'react';
import { Plus, Eye, EyeOff, Edit3, Trash2, UtensilsCrossed } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { useMenu } from '../../hooks/useMenu';
import { useToast } from '../../hooks/useToast';
import { api } from '../../services/api';
import { formatCOP } from '../../lib/money';
import { InlineError } from '../ui/Screens';
import AdminShell, { primaryButton } from './AdminShell';
import ProductFormModal from './ProductFormModal';

const EMPTY = {
  id: null, name: '', categoryId: null, price: 25000, image: '', description: '',
  isChef: false, isVeg: false, isGf: false, isPopular: false, available: true, ingredients: [], modifiers: [], pairing: null
};

export default function ProductsAdmin() {
  const { tenant } = useTenant();
  const showToast = useToast();
  const menu = useMenu(tenant.id);
  const [editing, setEditing] = useState(null);

  const act = async (fn, okMessage) => {
    try {
      await fn();
      await menu.reload();
      if (okMessage) showToast(okMessage, 'success');
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  return (
    <AdminShell
      title={`Platillos del menú (${menu.products.length})`}
      icon={<UtensilsCrossed className="w-4 h-4 text-orange-500" aria-hidden="true" />}
      actions={
        <button onClick={() => setEditing({ ...EMPTY, categoryId: menu.categories[0]?.id || null })} className={`${primaryButton} flex items-center gap-1.5`}>
          <Plus className="w-4 h-4" aria-hidden="true" /> Nuevo platillo
        </button>
      }
    >
      {menu.error && <InlineError message={menu.error} onRetry={menu.reload} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menu.productsWithStock.map((p) => (
          <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex justify-between items-center gap-3 shadow-md hover:border-slate-700 transition-all">
            <div className="flex items-center space-x-3 overflow-hidden">
              {p.image ? <img src={p.image} alt="" className={`w-12 h-12 rounded-xl object-cover bg-slate-950 shrink-0 ${p.available ? '' : 'opacity-40'}`} loading="lazy" /> : <div className="w-12 h-12 rounded-xl bg-slate-950 shrink-0" />}
              <div className="truncate">
                <h4 className="font-bold text-white text-xs truncate">{p.name}</h4>
                <span className="text-orange-500 font-extrabold text-xs">{formatCOP(p.price)}</span>
                <span className="text-[10px] text-slate-500 block truncate">
                  {p.category || 'Sin categoría'}
                  {!p.available && ' · Oculto'}
                  {p.soldOut && ' · Agotado'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={() => act(() => api.setProductAvailable(p.id, !p.available), p.available ? 'Platillo oculto de la carta' : 'Platillo visible en la carta')}
                className={`p-2 rounded-lg transition-colors ${p.available ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-rose-400 hover:bg-rose-500/10'}`}
                aria-label={p.available ? `Ocultar ${p.name}` : `Mostrar ${p.name}`}
                title={p.available ? 'Visible (clic para ocultar)' : 'Oculto (clic para mostrar)'}
              >
                {p.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button onClick={() => setEditing(p)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800" aria-label={`Editar ${p.name}`} title="Editar">
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.confirm(`¿Eliminar "${p.name}" de la carta?`) && act(() => api.deleteProduct(p.id), 'Platillo eliminado')}
                className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10"
                aria-label={`Eliminar ${p.name}`}
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <ProductFormModal
          product={editing}
          categories={menu.categories}
          onClose={() => setEditing(null)}
          onSave={async (product) => {
            const ok = await act(() => api.saveProduct(tenant.id, product), product.id ? 'Platillo actualizado' : 'Platillo creado');
            if (ok) setEditing(null);
          }}
        />
      )}
    </AdminShell>
  );
}
