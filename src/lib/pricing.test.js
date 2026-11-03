import { describe, it, expect } from 'vitest';
import {
  validateSelections, unitPriceFor, makeCartItem, addToCart, setCartQuantity,
  cartSubtotal, cartCount, toOrderPayload
} from './pricing';

const burger = {
  id: 'p1',
  name: 'Burger',
  price: 34000,
  modifiers: [
    { title: 'Término', required: true, options: [{ name: 'Medio', price: 0 }, { name: 'Bien cocida', price: 0 }] },
    { title: 'Adicionales', required: false, options: [{ name: 'Queso', price: 5000 }, { name: 'Tocineta', price: 4500 }] }
  ]
};

describe('pricing', () => {
  it('exige los modificadores obligatorios', () => {
    expect(validateSelections(burger, {}).ok).toBe(false);
    expect(validateSelections(burger, { Término: 'Medio' }).ok).toBe(true);
  });

  it('rechaza opciones o grupos inexistentes', () => {
    expect(validateSelections(burger, { Término: 'Crudo' }).ok).toBe(false);
    expect(validateSelections(burger, { Término: 'Medio', Gratis: 'Sí' }).ok).toBe(false);
  });

  it('suma el precio de los adicionales (bug anterior: se perdían al enviar)', () => {
    expect(unitPriceFor(burger, { Término: 'Medio', Adicionales: 'Queso' })).toBe(39000);
  });

  it('agrupa ítems iguales y no muta el carrito', () => {
    const item = makeCartItem(burger, { Término: 'Medio' }, 1);
    const cart1 = addToCart([], item);
    const cart2 = addToCart(cart1, item);
    expect(cart1[0].quantity).toBe(1);
    expect(cart2).toHaveLength(1);
    expect(cart2[0].quantity).toBe(2);
    const cart3 = addToCart(cart2, makeCartItem(burger, { Término: 'Bien cocida' }, 1));
    expect(cart3).toHaveLength(2);
    expect(cartCount(cart3)).toBe(3);
    expect(cartSubtotal(cart3)).toBe(34000 * 3);
  });

  it('cambia cantidades y elimina con 0', () => {
    const cart = [makeCartItem(burger, { Término: 'Medio' }, 2)];
    expect(setCartQuantity(cart, cart[0].key, 5)[0].quantity).toBe(5);
    expect(setCartQuantity(cart, cart[0].key, 0)).toHaveLength(0);
    expect(cart[0].quantity).toBe(2);
  });

  it('al servidor solo viajan ids, cantidades y opciones', () => {
    const payload = toOrderPayload([makeCartItem(burger, { Término: 'Medio' }, 2)]);
    expect(payload).toEqual([{ productId: 'p1', quantity: 2, selections: { Término: 'Medio' } }]);
  });
});
