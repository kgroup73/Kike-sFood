import { useState } from 'react';
import { Plus, Eye, EyeOff, Edit3, Trash2 } from 'lucide-react';
import { useTenant } from '../../hooks/useTenant';
import { useMenu } from '../../hooks/useMenu';
import { useToast } from '../../hooks/useToast';
import { api } from '../../services/api';
import { formatCOP } from '../../lib/money';
import { InlineError } from '../ui/Screens';
import AdminShell, { primaryButton } from './AdminShell';
import ProductFormModal from './ProductFormModal';
import DishImage from '../client/DishImage';

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

  const groups = [
    ...menu.categories.map((c) => ({ name: c.name, items: menu.productsWithStock.filter((p) => p.category === c.name) })),
    { name: 'Sin categoría', items: menu.productsWithStock.filter((p) => !p.category) }
  ].filter((g) => g.items.length);

  return (
    <AdminShell
      title="Platillos"
      subtitle={`${menu.products.length} platos en la carta. Los ocultos no aparecen para el comensal.`}
      actions={
        <button onClick={() => setEditing({ ...EMPTY, categoryId: menu.categories[0]?.id || null })} className={primaryButton}>
          <Plus className="w-4 h-4" aria-hidden="true" /> Nuevo platillo
        </button>
      }
    >
      {menu.error && <InlineError message={menu.error} onRetry={menu.reload} />}
      <div className="space-y-10">
        {groups.map((group) => (
          <section key={group.name} className="space-y-3">
            <h2 className="block-title">
              {group.name} <span className="text-suave font-normal">{group.items.length}</span>
            </h2>
            <ul className="surface divide-y divide-linea overflow-hidden">
              {group.items.map((p) => (
                <li key={p.id} className="flex items-center gap-4 px-4 sm:px-5 py-3">
                  <DishImage src={p.image} className={`w-14 h-14 rounded-xl shrink-0 ${p.available ? '' : 'opacity-40'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${p.available ? '' : 'text-suave'}`}>{p.name}</p>
                    <p className="flex items-center gap-2 flex-wrap">
                      <span className="precio">{formatCOP(p.price)}</span>
                      {!p.available && <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-linea">Oculto</span>}
                      {p.soldOut && <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-aji text-white">Agotado</span>}
                    </p>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button
                      onClick={() => act(() => api.setProductAvailable(p.id, !p.available), p.available ? 'Platillo oculto de la carta' : 'Platillo visible en la carta')}
                      className="icon-btn"
                      aria-label={p.available ? `Ocultar ${p.name}` : `Mostrar ${p.name}`}
                      title={p.available ? 'Visible: clic para ocultar' : 'Oculto: clic para mostrar'}
                    >
                      {p.available ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setEditing(p)} className="icon-btn" aria-label={`Editar ${p.name}`} title="Editar">
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => window.confirm(`¿Eliminar "${p.name}" de la carta?`) && act(() => api.deleteProduct(p.id), 'Platillo eliminado')}
                      className="icon-btn hover:!text-aji hover:!bg-aji/10"
                      aria-label={`Eliminar ${p.name}`}
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
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
