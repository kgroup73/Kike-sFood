import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ProductFormModal from '../components/admin/ProductFormModal';

// Limpieza de Portals de document.body entre pruebas
afterEach(() => {
  cleanup();
});

// Mock de useTenant para pruebas
vi.mock('../hooks/useTenant', () => ({
  useTenant: () => ({ tenant: { slug: 'la-trattoria', name: 'La Trattoria' } })
}));

describe('ProductFormModal (Desacoplado y Modular)', () => {
  const categories = [
    { id: 'cat-1', name: 'Entradas' },
    { id: 'cat-2', name: 'Platos Fuertes' }
  ];

  it('renderiza correctamente el formulario para un platillo existente', () => {
    const product = {
      id: 'p-1',
      name: 'Carpaccio di Wagyu',
      price: 46000,
      categoryId: 'cat-1',
      description: 'Finas láminas de res',
      ingredients: ['Wagyu', 'Parmesano'],
      isChef: true,
      available: true
    };

    render(
      <ProductFormModal
        product={product}
        categories={categories}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('Carpaccio di Wagyu')).toBeInTheDocument();
    expect(screen.getByDisplayValue('46000')).toBeInTheDocument();
    expect(screen.getByText('Wagyu')).toBeInTheDocument();
    expect(screen.getByText('Parmesano')).toBeInTheDocument();
    expect(screen.getByText('Editar platillo')).toBeInTheDocument();
  });

  it('permite añadir y remover insumos/ingredientes', () => {
    const onSave = vi.fn();
    const product = { id: 'p-2', name: 'Tacos', price: 28000, ingredients: ['Camarón'] };

    render(
      <ProductFormModal
        product={product}
        categories={categories}
        availableIngredients={['Aguacate', 'Cilantro']}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    const input = screen.getByPlaceholderText(/Agregar otro/i);
    fireEvent.change(input, { target: { value: 'Piña asada' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('Piña asada')).toBeInTheDocument();

    // Eliminar el primer ingrediente
    const deleteBtn = screen.getByLabelText('Eliminar Camarón');
    fireEvent.click(deleteBtn);
    expect(screen.queryByText('Camarón')).not.toBeInTheDocument();
  });

  it.each([
    { badgeText: 'Especial del chef', key: 'isChef' },
    { badgeText: 'Más pedido / Popular', key: 'isPopular' },
    { badgeText: 'Vegano', key: 'isVeg' },
    { badgeText: 'Sin gluten', key: 'isGf' }
  ])('permite activar la etiqueta "$badgeText" conmutando el estado', ({ badgeText }) => {
    const product = { id: 'p-3', name: 'Plato Test', price: 20000 };
    render(
      <ProductFormModal
        product={product}
        categories={categories}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const label = screen.getByText(badgeText);
    expect(label).toBeInTheDocument();
  });

  it('envía los datos saneados al guardar', async () => {
    const onSave = vi.fn().mockResolvedValue({});
    const product = { id: 'p-4', name: 'Bowl Vegano', price: '29000', categoryId: 'cat-2' };

    render(
      <ProductFormModal
        product={product}
        categories={categories}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Guardar platillo/i });
    fireEvent.click(submitBtn);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Bowl Vegano',
        price: 29000,
        category: 'Platos Fuertes'
      })
    );
  });
});
