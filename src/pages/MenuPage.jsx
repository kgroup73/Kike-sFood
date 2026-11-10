import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTenant } from '../hooks/useTenant';
import { useMenu } from '../hooks/useMenu';
import { useToast } from '../hooks/useToast';
import { playChime } from '../hooks/useSound';
import { api } from '../services/api';
import { hasFeature } from '../lib/plans';
import { buildStories } from '../lib/catalog';
import { makeCartItem, addToCart, setCartQuantity, toOrderPayload } from '../lib/pricing';
import { LoadingScreen, ErrorScreen, InlineError } from '../components/ui/Screens';
import { PROJECT_NAME } from '../config/branding';
import ClientView from '../components/client/ClientView';
import FloatingClientBar from '../components/client/FloatingBar';
import CartDrawer from '../components/client/CartDrawer';
import ProductDetailModal from '../components/client/ProductDetailModal';
import StoryReelModal from '../components/client/StoryReelModal';
import TableRequiredModal from '../components/client/TableRequiredModal';

function readJSON(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // almacenamiento no disponible
  }
}

export default function MenuPage({ tableToken }) {
  const { tenant, loading, error } = useTenant();

  if (loading) return <LoadingScreen label="Cargando la carta…" />;
  if (error === 'notfound' || !tenant) {
    return <ErrorScreen title="Restaurante no encontrado" message="Revisa el enlace o vuelve a escanear el código de tu mesa." />;
  }
  if (error) return <ErrorScreen message={error} />;
  return <Menu tenant={tenant} tableToken={tableToken} key={tableToken || 'sin-mesa'} />;
}

function Menu({ tenant, tableToken }) {
  const showToast = useToast();
  const menu = useMenu(tenant.id);
  const cartKey = `kikes_cart_${tenant.slug}_${tableToken || 'none'}`;
  const favKey = `kikes_favorites_${tenant.slug}`;

  const [table, setTable] = useState({ status: tableToken ? 'checking' : 'none', label: null });
  const [cart, setCart] = useState(() => readJSON(sessionStorage, cartKey, []));
  const [favorites, setFavorites] = useState(() => readJSON(localStorage, favKey, []));
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [storyIndex, setStoryIndex] = useState(null);
  const [tableModal, setTableModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [waiter, setWaiter] = useState('idle'); // 'idle' | 'sending' | 'called'

  // Valida el token de la mesa en el servidor (antes bastaba con ?mesa=4 en la URL).
  useEffect(() => {
    if (!tableToken) return undefined;
    let cancelled = false;
    api
      .resolveTable(tenant.slug, tableToken)
      .then((t) => !cancelled && setTable(t ? { status: 'ok', label: t.label } : { status: 'invalid', label: null }))
      .catch(() => !cancelled && setTable({ status: 'invalid', label: null }));
    return () => {
      cancelled = true;
    };
  }, [tenant.slug, tableToken]);

  useEffect(() => writeJSON(sessionStorage, cartKey, cart), [cartKey, cart]);

  // La carta tiene su propia piel (src/index.css, .carta); se aplica a toda la página.
  useEffect(() => {
    document.documentElement.classList.add('carta');
    return () => document.documentElement.classList.remove('carta');
  }, []);
  useEffect(() => writeJSON(localStorage, favKey, favorites), [favKey, favorites]);

  const orderingEnabled = hasFeature(tenant.plan, 'ordering');
  const canCallWaiter = hasFeature(tenant.plan, 'waiterCall') && table.status === 'ok';

  // Tras avisar, el botón queda en "Mesero avisado" un minuto: evita llamados repetidos.
  useEffect(() => {
    if (waiter !== 'called') return undefined;
    const t = setTimeout(() => setWaiter('idle'), 60000);
    return () => clearTimeout(t);
  }, [waiter]);

  const callWaiter = async () => {
    if (waiter !== 'idle') return;
    setWaiter('sending');
    try {
      await api.callWaiter({ slug: tenant.slug, tableToken });
      setWaiter('called');
      playChime();
      showToast('Avisamos al personal: el mesero va en camino', 'success');
    } catch (err) {
      setWaiter('idle');
      showToast(err.message || 'No se pudo llamar al mesero. Intenta de nuevo.', 'error');
    }
  };
  const canOrder = orderingEnabled && table.status === 'ok';
  const blockedReason = !orderingEnabled
    ? 'Este restaurante opera con carta de consulta. Pide directamente a tu mesero.'
    : table.status === 'invalid'
      ? 'El código de esta mesa ya no es válido. Pide al personal que lo revise.'
      : table.status !== 'ok'
        ? 'Escanea el código QR de tu mesa para poder pedir.'
        : '';

  const products = menu.productsWithStock;
  const visibleProducts = useMemo(() => products.filter((p) => p.available !== false), [products]);
  const categoryNames = useMemo(() => menu.categories.map((c) => c.name), [menu.categories]);
  const stories = useMemo(() => buildStories(visibleProducts), [visibleProducts]);
  const selectedProduct = visibleProducts.find((p) => p.id === selectedProductId) || null;

  // Si la cocina agota algo que está en el carrito, se retira y se avisa.
  useEffect(() => {
    if (!cart.length || menu.loading) return;
    const unavailable = cart.filter((c) => {
      const p = products.find((x) => x.id === c.productId);
      return !p || p.soldOut || p.available === false;
    });
    if (unavailable.length) {
      setCart((list) => list.filter((c) => !unavailable.some((u) => u.key === c.key)));
      showToast(`Se retiró del pedido por agotarse: ${unavailable.map((u) => u.name).join(', ')}`, 'error');
    }
  }, [products, cart, menu.loading, showToast]);

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const handleAddToCart = useCallback(
    (product, selections, quantity) => {
      if (product.soldOut) {
        showToast(`${product.name} se agotó y no puede agregarse 😔`, 'error');
        return;
      }
      setCart((prev) => addToCart(prev, makeCartItem(product, selections, quantity)));
      showToast(`${product.name} agregado a tu pedido 🛒`);
      playChime();
    },
    [showToast]
  );

  const submitOrder = async () => {
    if (!canOrder) {
      setTableModal(true);
      return;
    }
    if (!cart.length || submitting) return;
    setSubmitting(true);
    try {
      const result = await api.createOrder({
        slug: tenant.slug,
        tableToken,
        items: toOrderPayload(cart),
        // La propina es voluntaria y se define al pagar, en caja (Ley 1935 de 2018).
        includeTip: false
      });
      setCart([]);
      setIsCartOpen(false);
      playChime();
      showToast(`¡Pedido #${result.orderId} enviado a cocina! 🍳`, 'success');
    } catch (err) {
      // El carrito se conserva para reintentar.
      showToast(err.message || 'No se pudo enviar el pedido. Intenta de nuevo.', 'error');
      menu.reload();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="carta min-h-screen pb-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <header className="pt-8 pb-5 sm:pt-12">
          <h1 className="font-display font-extrabold text-[2.5rem] sm:text-6xl leading-[0.95] tracking-tight">{tenant.name}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-suave">
            {table.status === 'ok' ? (
              <>
                <span className="font-bold text-tinta">Mesa {table.label}</span>
                <span>{orderingEnabled ? '· pide desde aquí y llega a la cocina' : ''}</span>
              </>
            ) : orderingEnabled ? (
              <button onClick={() => setTableModal(true)} className="font-bold text-tinta underline underline-offset-4">
                {table.status === 'checking' ? 'Validando mesa…' : 'Sin mesa'}
              </button>
            ) : (
              <span>Carta</span>
            )}
            {tenant.address && <span className="w-full text-sm">{tenant.address}{tenant.city ? `, ${tenant.city}` : ''}</span>}
          </p>
        </header>

        <main>
          {menu.error && <InlineError message={`No se pudo cargar la carta: ${menu.error}`} onRetry={menu.reload} />}
          {menu.loading ? (
            <p className="py-24 text-center text-suave">Cargando la carta…</p>
          ) : (
            <ClientView
              products={visibleProducts}
              categories={categoryNames}
              stories={stories}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              dietaryFilter={dietaryFilter}
              setDietaryFilter={setDietaryFilter}
              setSelectedProduct={(p) => setSelectedProductId(p.id)}
              onQuickAdd={(p) => handleAddToCart(p, {}, 1)}
              favorites={favorites}
              onOpenStory={setStoryIndex}
              canOrder={canOrder}
            />
          )}
        </main>

        <footer className="pt-12 pb-4 text-center text-xs text-suave">Carta digital por {PROJECT_NAME}</footer>
      </div>

      <FloatingClientBar
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        mode={orderingEnabled ? 'order' : 'consult'}
        onCallWaiter={canCallWaiter ? callWaiter : undefined}
        waiter={waiter}
      />

      {isCartOpen && (
        <CartDrawer
          cart={cart}
          tableLabel={table.label}
          onChangeQuantity={(key, q) => setCart((prev) => setCartQuantity(prev, key, q))}
          onClose={() => setIsCartOpen(false)}
          onSubmit={submitOrder}
          submitting={submitting}
          blockedReason={blockedReason}
        />
      )}

      {selectedProduct && (
        <ProductDetailModal
          key={selectedProduct.id}
          product={selectedProduct}
          allProducts={visibleProducts}
          isFavorite={favorites.includes(selectedProduct.id)}
          onToggleFavorite={toggleFavorite}
          onClose={() => setSelectedProductId(null)}
          canOrder={orderingEnabled}
          orderHint={blockedReason || undefined}
          onAddToCart={handleAddToCart}
        />
      )}

      {storyIndex !== null && (
        <StoryReelModal
          stories={stories}
          initialStoryIndex={storyIndex}
          products={visibleProducts}
          onClose={() => setStoryIndex(null)}
          onOpenProductDetail={(prod) => {
            setStoryIndex(null);
            setSelectedProductId(prod.id);
          }}
        />
      )}

      {tableModal && <TableRequiredModal slug={tenant.slug} reason={blockedReason} onClose={() => setTableModal(false)} />}
    </div>
  );
}
