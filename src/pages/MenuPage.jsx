import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPin, ShieldAlert } from 'lucide-react';
import { useTenant } from '../hooks/useTenant';
import { useMenu } from '../hooks/useMenu';
import { useToast } from '../hooks/useToast';
import { playChime } from '../hooks/useSound';
import { api } from '../services/api';
import { hasFeature } from '../lib/plans';
import { buildStories } from '../lib/catalog';
import { makeCartItem, addToCart, setCartQuantity, toOrderPayload } from '../lib/pricing';
import BrandMark from '../components/ui/BrandMark';
import { LoadingScreen, ErrorScreen, InlineError } from '../components/ui/Screens';
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
  const [includeTip, setIncludeTip] = useState(true);
  const [favorites, setFavorites] = useState(() => readJSON(localStorage, favKey, []));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [dietaryFilter, setDietaryFilter] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [storyIndex, setStoryIndex] = useState(null);
  const [tableModal, setTableModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
  useEffect(() => writeJSON(localStorage, favKey, favorites), [favKey, favorites]);

  const orderingEnabled = hasFeature(tenant.plan, 'ordering');
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
        includeTip
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
    <div className="min-h-screen pb-28">
      <header className="bg-brand-panel/95 backdrop-blur-md border-b border-brand-line sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <BrandMark size="sm" />
          {table.status === 'ok' ? (
            <span className="text-[11px] font-bold bg-brand-gold/15 text-brand-cream border border-brand-gold/40 px-2.5 py-1 rounded-full flex items-center gap-1">
              <MapPin className="w-3 h-3 text-brand-gold-light" aria-hidden="true" /> Mesa {table.label}
            </span>
          ) : orderingEnabled ? (
            <button
              onClick={() => setTableModal(true)}
              className="text-[11px] font-bold bg-brand-raised text-brand-mute border border-brand-line px-2.5 py-1 rounded-full flex items-center gap-1"
            >
              <ShieldAlert className="w-3 h-3" aria-hidden="true" /> {table.status === 'checking' ? 'Validando mesa…' : 'Sin mesa'}
            </button>
          ) : null}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
        {menu.error && <InlineError message={`No se pudo cargar la carta: ${menu.error}`} onRetry={menu.reload} />}
        {menu.loading ? (
          <div className="py-24 text-center text-xs text-brand-khaki">Cargando la carta…</div>
        ) : (
          <ClientView
            company={tenant}
            products={visibleProducts}
            categories={categoryNames}
            stories={stories}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            dietaryFilter={dietaryFilter}
            setDietaryFilter={setDietaryFilter}
            setSelectedProduct={(p) => setSelectedProductId(p.id)}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onOpenStory={setStoryIndex}
            canOrder={canOrder}
          />
        )}
      </main>

      <FloatingClientBar
        cart={cart}
        includeTip={includeTip}
        tipRate={tenant.tipRate}
        onOpenCart={() => setIsCartOpen(true)}
        mode={orderingEnabled ? 'order' : 'consult'}
        tableLabel={table.label}
      />

      {isCartOpen && (
        <CartDrawer
          cart={cart}
          tableLabel={table.label}
          tipRate={tenant.tipRate}
          includeTip={includeTip}
          setIncludeTip={setIncludeTip}
          onChangeQuantity={(key, q) => setCart((prev) => setCartQuantity(prev, key, q))}
          onClose={() => setIsCartOpen(false)}
          onSubmit={submitOrder}
          submitting={submitting}
          blockedReason={blockedReason}
        />
      )}

      {selectedProduct && (
        <ProductDetailModal
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
