import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import {
  normalizeIngredient,
  buildMasterIngredientList,
  getAffectedProducts,
  deriveProductsWithStock
} from './lib/inventory';

// Data & Libs
import {
  INITIAL_COMPANY,
  INITIAL_CUSTOMERS,
  CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_KITCHEN_ORDERS
} from './data/mockData';

// Components
import Header from './components/Header';
import ClientView from './components/ClientView';
import KitchenView from './components/KitchenView';
import PosView from './components/PosView';
import AdminView from './components/AdminView';
import FloatingClientBar from './components/FloatingBar';

// Modals
import CartDrawer from './components/modals/CartDrawer';
import ProductDetailModal from './components/modals/ProductDetailModal';
import StoryReelModal from './components/modals/StoryReelModal';
import BillingModal from './components/modals/BillingModal';
import TicketModal from './components/modals/TicketModal';
import DailyCloseModal from './components/modals/DailyCloseModal';
import {
  NewCustomerModal,
  GeoNfcModal,
  AdminProductModal
} from './components/modals/AuxiliaryModals';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';

export default function App() {
  const [currentRole, setCurrentRole] = useState('client');
  const [tableNumber, setTableNumber] = useState('4');
  const [isNfcConnected, setIsNfcConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [dietaryFilter, setDietaryFilter] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // States & Persistence
  const [company, setCompany] = useState(() => {
    try {
      const saved = localStorage.getItem('kikes_company');
      if (saved) return { ...INITIAL_COMPANY, slug: 'la-trattoria', plan: 'full', ...JSON.parse(saved) };
    } catch (e) {}
    return { ...INITIAL_COMPANY, slug: 'la-trattoria', plan: 'full' };
  });

  useEffect(() => {
    try {
      localStorage.setItem('kikes_company', JSON.stringify(company));
    } catch (e) {}
  }, [company]);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [kitchenOrders, setKitchenOrders] = useState(INITIAL_KITCHEN_ORDERS);
  const [invoices, setInvoices] = useState([]);
  const [dailyCloseHistory, setDailyCloseHistory] = useState([]);

  // Inventario: historial de desabastecimiento reportado por cocina (persistido)
  const [stockEvents, setStockEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('gourmet_stock_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gourmet_stock_history', JSON.stringify(stockEvents.slice(0, 300)));
    } catch (e) {}
  }, [stockEvents]);

  // Inventario: estado de materias primas (ingredientes) agotadas (persistido)
  // Formato: { [claveNormalizada]: { name, soldOut, at, by, note } }
  const [ingredientsStock, setIngredientsStock] = useState(() => {
    try {
      const saved = localStorage.getItem('gourmet_ingredients_stock');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gourmet_ingredients_stock', JSON.stringify(ingredientsStock));
    } catch (e) {}
  }, [ingredientsStock]);

  // Listado maestro de materias primas y estado derivado de los platillos
  const masterIngredients = useMemo(() => buildMasterIngredientList(products), [products]);
  const productsWithStock = useMemo(
    () => deriveProductsWithStock(products, ingredientsStock),
    [products, ingredientsStock]
  );

  // Favorites state (persisted)
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('gourmet_favorites');
      return saved ? JSON.parse(saved) : [1, 4];
    } catch (e) {
      return [1, 4];
    }
  });

  // Cart
  const [cart, setCart] = useState([]);
  const [includeTip, setIncludeTip] = useState(true);

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [isGeoModalOpen, setIsGeoModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [activeBillingOrder, setActiveBillingOrder] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [isDailyCloseModalOpen, setIsDailyCloseModalOpen] = useState(false);
  const [isAdminProductModalOpen, setIsAdminProductModalOpen] = useState(false);
  const [adminProductForm, setAdminProductForm] = useState(null);

  const [isInsidePremises, setIsInsidePremises] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn('Audio feedback not available', e);
    }
  };

  // URL Parameter Detection (NFC, Tenant Slug & Table Auto-Binding)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mesaParam = params.get('mesa') || params.get('table');
      const nfcParam = params.get('nfc');
      const rParam = params.get('r') || params.get('restaurant');

      if (rParam) {
        setCompany(prev => ({ ...prev, slug: rParam.toLowerCase().replace(/[^a-z0-9-]/g, '-') }));
      }

      if (mesaParam) {
        setTableNumber(mesaParam);
        sessionStorage.setItem('kikes_active_table', mesaParam);
        if (nfcParam === 'true' || nfcParam === '1') {
          setIsNfcConnected(true);
          showToast(`⚡ ¡Conectado a Mesa ${mesaParam} por sensor NFC!`);
          playChime();
        } else {
          showToast(`📍 Menú vinculado a Mesa ${mesaParam}`);
        }
      } else {
        const saved = sessionStorage.getItem('kikes_active_table');
        if (saved) setTableNumber(saved);
      }
    } catch (e) {
      console.error('Error parsing URL parameters:', e);
    }
  }, []);

  // Sincronización en Tiempo Real con Supabase (WebSockets)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const fetchInitialData = async () => {
      try {
        const { data: dbOrders } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .order('id', { ascending: false })
          .limit(50);

        if (dbOrders && dbOrders.length) {
          setKitchenOrders(dbOrders.map(o => ({
            id: o.id,
            table: o.table_number,
            time: new Date(o.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
            status: o.status,
            items: (o.order_items || []).map(it => ({
              name: it.name,
              quantity: it.quantity,
              price: it.unit_price,
              selectedOptions: it.selected_options || []
            }))
          })));
        }
      } catch (err) {
        console.warn('Supabase fetch notice:', err);
      }
    };

    fetchInitialData();

    // Canales WebSockets para Cocina y Meseros
    const ordersChannel = supabase
      .channel('realtime_orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        showToast(`🔔 ¡Nueva comanda Mesa ${payload.new.table_number}!`);
        playChime();
        fetchInitialData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        setKitchenOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, status: payload.new.status } : o));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const toggleFavorite = (productId) => {
    setFavorites(prev => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter(id => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem('gourmet_favorites', JSON.stringify(updated));
      } catch (e) {}
      showToast(exists ? 'Eliminado de favoritos 💔' : '¡Guardado en tus favoritos! ❤️');
      playChime();
      return updated;
    });
  };

  const handleSimulateTableNfc = (tNum) => {
    setTableNumber(tNum);
    setIsNfcConnected(true);
    setIsInsidePremises(true);
    setIsGeoModalOpen(false);
    setCurrentRole('client');
    try {
      const slug = company.slug || 'la-trattoria';
      const newUrl = `${window.location.pathname}?r=${slug}&mesa=${tNum}&nfc=true`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      sessionStorage.setItem('kikes_active_table', tNum);
    } catch (e) {}
    showToast(`⚡ ¡Mesa ${tNum} vinculada por sensor NFC!`);
    playChime();
  };

  // ===== Inventario: agotamiento por Materia Prima (ingrediente) =====
  // Marcar un ingrediente como agotado desactiva automáticamente todos los
  // platillos que lo contienen en su array `ingredients`.
  const markIngredientSoldOut = (ingredientNames, { note = '' } = {}) => {
    const names = (Array.isArray(ingredientNames) ? ingredientNames : [ingredientNames])
      .map(n => (typeof n === 'string' ? n.trim() : ''))
      .filter(Boolean);
    if (!names.length) return;

    const iso = new Date().toISOString();
    const affectedSet = new Set();
    const added = names.filter(name => {
      const key = normalizeIngredient(name);
      if (ingredientsStock[key]?.soldOut) return false;
      getAffectedProducts(products, key).forEach(pn => affectedSet.add(pn));
      return true;
    });
    if (!added.length) return;

    setIngredientsStock(prev => {
      const next = { ...prev };
      added.forEach(name => {
        next[normalizeIngredient(name)] = { name, soldOut: true, at: iso, by: 'Cocina', note };
      });
      return next;
    });

    setStockEvents(prev => [
      ...added.map(name => ({
        id: Date.now() + Math.random(),
        type: 'AGOTADO',
        ingredient: name,
        missingIngredients: [name],
        affectedProducts: getAffectedProducts(products, name),
        note,
        reportedBy: 'Cocina',
        timestamp: iso
      })),
      ...prev
    ]);
    playChime();
    const list = added.join(', ');
    if (affectedSet.size) {
      showToast(`"${list}" agotado. Se desactivó: ${[...affectedSet].join(', ')} 📦`);
    } else {
      showToast(`"${list}" agotado (sin platillos vinculados) 📦`);
    }
  };

  const restockIngredient = (ingredientName) => {
    const key = normalizeIngredient(ingredientName);
    const current = ingredientsStock[key];
    if (!current?.soldOut) return;
    const iso = new Date().toISOString();
    const affected = getAffectedProducts(products, key);

    const nextStock = { ...ingredientsStock };
    delete nextStock[key];
    const stillSoldOut = deriveProductsWithStock(products, nextStock)
      .filter(p => affected.includes(p.name))
      .map(p => p.name);

    setIngredientsStock(nextStock);
    setStockEvents(prev => [{
      id: Date.now() + Math.random(),
      type: 'REPUESTO',
      ingredient: current.name,
      missingIngredients: [current.name],
      affectedProducts: affected,
      note: '',
      reportedBy: 'Cocina',
      timestamp: iso
    }, ...prev]);
    playChime();
    if (stillSoldOut.length) {
      showToast(`"${current.name}" repuesto. Siguen agotados (otro insumo): ${stillSoldOut.join(', ')} ✅`);
    } else if (affected.length) {
      showToast(`"${current.name}" repuesto. Disponible de nuevo: ${affected.join(', ')} ✅`);
    } else {
      showToast(`"${current.name}" repuesto ✅`);
    }
  };

  return (
    <div className="bg-[#14120c] text-[#fdfcf7] font-sans min-h-screen pb-24 selection:bg-[#9b7e09] selection:text-[#fdfcf7]">
      <Header
        currentRole={currentRole}
        setCurrentRole={(r) => {
          setCurrentRole(r);
          showToast(`Modo: ${r === 'client' ? 'Menú Cliente' : r === 'kitchen' ? 'Monitor KDS' : r === 'pos' ? 'Caja POS' : 'Administración'}`);
        }}
        company={company}
        tableNumber={tableNumber}
        isInsidePremises={isInsidePremises}
        setIsGeoModalOpen={setIsGeoModalOpen}
        soundEnabled={soundEnabled}
        setSoundEnabled={(s) => {
          setSoundEnabled(s);
          showToast(s ? 'Sonido Activado 🔔' : 'Sonido Silenciado 🔇');
        }}
        kitchenActiveCount={kitchenOrders.filter(o => o.status !== 'Por Cobrar').length}
        isNfcConnected={isNfcConnected}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
        {currentRole === 'client' && (
          <ClientView
            company={company}
            products={productsWithStock}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            dietaryFilter={dietaryFilter}
            setDietaryFilter={setDietaryFilter}
            setSelectedProduct={setSelectedProduct}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            onOpenStory={(idx) => {
              setActiveStoryIndex(idx);
              setIsStoryModalOpen(true);
            }}
          />
        )}

        {currentRole === 'kitchen' && (
          <KitchenView
            kitchenOrders={kitchenOrders}
            products={productsWithStock}
            masterIngredients={masterIngredients}
            ingredientsStock={ingredientsStock}
            updateOrderStatus={(id, status) => {
              setKitchenOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
              if (isSupabaseConfigured && supabase) {
                supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id).then();
              }
              if (status === 'Por Cobrar') showToast(`Comanda #${id} enviada a Caja POS`);
              playChime();
            }}
            onMarkIngredientSoldOut={markIngredientSoldOut}
            onRestockIngredient={restockIngredient}
          />
        )}

        {currentRole === 'pos' && (
          <PosView
            kitchenOrders={kitchenOrders}
            invoices={invoices}
            prepareBilling={(order) => {
              setActiveBillingOrder(order);
              setIsBillingModalOpen(true);
            }}
            viewInvoiceTicket={(inv) => {
              setCurrentTicket(inv);
              setIsTicketModalOpen(true);
            }}
            openDailyCloseModal={() => setIsDailyCloseModalOpen(true)}
            onBackToAdmin={() => setCurrentRole('config')}
          />
        )}

        {currentRole === 'config' && (
          <AdminView
            products={products}
            productsWithStock={productsWithStock}
            masterIngredients={masterIngredients}
            ingredientsStock={ingredientsStock}
            company={company}
            stockEvents={stockEvents}
            setCompany={setCompany}
            showToast={showToast}
            toggleProductAvailability={(id) => {
              setProducts(prev => prev.map(p => p.id === id ? { ...p, available: !p.available } : p));
              showToast('Estado del platillo actualizado');
            }}
            deleteProduct={(id) => {
              setProducts(prev => prev.filter(p => p.id !== id));
              showToast('Platillo eliminado');
            }}
            openEditProduct={(p) => {
              setAdminProductForm(JSON.parse(JSON.stringify(p)));
              setIsAdminProductModalOpen(true);
            }}
            openNewProduct={() => {
              setAdminProductForm({
                id: null,
                name: '',
                category: 'Platos Fuertes',
                price: 25000,
                image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop',
                description: '',
                isChef: false,
                isVeg: false,
                isGf: false,
                available: true,
                modifiers: []
              });
              setIsAdminProductModalOpen(true);
            }}
            onSimulateTableNfc={handleSimulateTableNfc}
            onOpenPos={() => setCurrentRole('pos')}
          />
        )}
      </main>

      {currentRole === 'client' && (
        <FloatingClientBar
          cart={cart}
          includeTip={includeTip}
          setIsCartOpen={setIsCartOpen}
          plan={company.plan || 'full'}
          tableNumber={tableNumber}
        />
      )}

      {isCartOpen && (
        <CartDrawer
          cart={cart}
          setCart={setCart}
          tableNumber={tableNumber}
          includeTip={includeTip}
          setIncludeTip={setIncludeTip}
          onClose={() => setIsCartOpen(false)}
          submitOrder={() => {
            if (company.plan === 'basic') {
              showToast('Este restaurante opera bajo el plan Carta Digital. Ordena directamente a tu mesero.');
              return;
            }
            if (!isInsidePremises) {
              setIsGeoModalOpen(true);
              return;
            }
            if (!cart.length) return;
            // Validación en tiempo real: descarta ítems marcados agotados por cocina
            const validCart = cart.filter(c => !productsWithStock.find(p => p.id === c.product.id)?.soldOut);
            const removedCount = cart.length - validCart.length;
            if (removedCount > 0) {
              setCart(validCart);
              showToast(`Se retiraron ${removedCount} producto(s) agotado(s) de tu pedido ⚠️`);
            }
            if (!validCart.length) return;

            // Anti-Tampering & Security Sanitization:
            // 1. Obtener precio autorizado del catálogo maestro (ignorar manipulaciones de cliente)
            // 2. Sanitizar texto de opciones personalizadas
            const sanitizeText = (txt) => {
              if (typeof txt !== 'string') return '';
              return txt.replace(/[<>]/g, '').trim().slice(0, 150);
            };

            const verifiedItems = validCart.map(c => {
              const catalogProd = products.find(p => p.id === c.product.id) || c.product;
              const safePrice = typeof catalogProd.price === 'number' && catalogProd.price > 0 
                ? catalogProd.price 
                : c.product.price;
              const safeQty = Math.max(1, Math.min(50, Math.floor(Number(c.quantity) || 1)));
              const safeOptions = c.optionsText ? [sanitizeText(c.optionsText)] : [];

              return {
                name: catalogProd.name || c.product.name,
                quantity: safeQty,
                price: safePrice,
                selectedOptions: safeOptions
              };
            });

            const orderId = Math.floor(100 + Math.random() * 900);
            const newOrder = {
              id: orderId,
              table: tableNumber,
              time: 'Hace un instante',
              status: 'Pendiente',
              items: verifiedItems
            };
            setKitchenOrders(prev => [newOrder, ...prev]);

            // Persistir comanda en Supabase si la base de datos está conectada
            if (isSupabaseConfigured && supabase) {
              (async () => {
                try {
                  const subtotal = verifiedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                  const tipAmount = includeTip ? Math.round(subtotal * 0.1) : 0;
                  const total = subtotal + tipAmount;

                  const { data: dbOrder } = await supabase
                    .from('orders')
                    .insert([{
                      tenant_id: 'a0000000-0000-0000-0000-000000000001',
                      table_number: tableNumber,
                      status: 'Pendiente',
                      subtotal,
                      tip: tipAmount,
                      total
                    }])
                    .select()
                    .single();

                  if (dbOrder) {
                    await supabase.from('order_items').insert(
                      verifiedItems.map(item => ({
                        order_id: dbOrder.id,
                        name: item.name,
                        quantity: item.quantity,
                        unit_price: item.price,
                        total_price: item.price * item.quantity,
                        selected_options: item.selectedOptions
                      }))
                    );
                  }
                } catch (err) {
                  console.error('Error insertando comanda en Supabase:', err);
                }
              })();
            }

            setCart([]);
            setIsCartOpen(false);
            playChime();
            showToast('¡Pedido enviado a Cocina! 🍳');
          }}
        />
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={productsWithStock.find(p => p.id === selectedProduct.id) || selectedProduct}
          allProducts={productsWithStock}
          isFavorite={favorites.includes(selectedProduct.id)}
          onToggleFavorite={toggleFavorite}
          onClose={() => setSelectedProduct(null)}
          plan={company.plan || 'full'}
          onAddToCart={(cartItem) => {
            const liveProduct = productsWithStock.find(p => p.id === cartItem.product.id);
            if (liveProduct?.soldOut) {
              showToast(`${cartItem.product.name} se agotó y no puede agregarse al pedido 😔`);
              return;
            }
            setCart(prev => [...prev, cartItem]);
            showToast('¡Agregado a tu pedido! 🛒');
            playChime();
          }}
        />
      )}

      {isStoryModalOpen && (
        <StoryReelModal
          initialStoryIndex={activeStoryIndex}
          products={productsWithStock}
          onClose={() => setIsStoryModalOpen(false)}
          onOpenProductDetail={(prod) => {
            setIsStoryModalOpen(false);
            setSelectedProduct(prod);
          }}
        />
      )}

      {isGeoModalOpen && (
        <GeoNfcModal
          currentTable={tableNumber}
          onClose={() => setIsGeoModalOpen(false)}
          simulateNfc={(num) => handleSimulateTableNfc(num)}
          confirmGps={() => {
            setIsInsidePremises(true);
            setIsGeoModalOpen(false);
            showToast('Ubicación confirmada en el local 📍');
            playChime();
          }}
        />
      )}

      {isBillingModalOpen && (
        <BillingModal
          order={activeBillingOrder}
          company={company}
          customers={customers}
          onClose={() => setIsBillingModalOpen(false)}
          openNewCustomer={() => setIsCustomerModalOpen(true)}
          generateInvoice={(invoiceData) => {
            const newInv = {
              id: Date.now(),
              number: `${company.dianPrefix}-${String(invoices.length + 101).padStart(4, '0')}`,
              date: new Date().toLocaleString('es-CO'),
              ...invoiceData
            };
            setInvoices(prev => [newInv, ...prev]);
            setKitchenOrders(prev => prev.filter(o => o.id !== activeBillingOrder.id));
            setIsBillingModalOpen(false);
            setCurrentTicket(newInv);
            setIsTicketModalOpen(true);
            showToast(`Comprobante ${newInv.number} generado con éxito`);
          }}
        />
      )}

      {isCustomerModalOpen && (
        <NewCustomerModal
          onClose={() => setIsCustomerModalOpen(false)}
          onSave={(cust) => {
            setCustomers(prev => [...prev, { id: Date.now(), ...cust }]);
            setIsCustomerModalOpen(false);
            showToast('Cliente guardado');
          }}
        />
      )}

      {isTicketModalOpen && (
        <TicketModal
          ticket={currentTicket}
          company={company}
          onClose={() => setIsTicketModalOpen(false)}
        />
      )}

      {isDailyCloseModalOpen && (
        <DailyCloseModal
          invoices={invoices}
          onClose={() => setIsDailyCloseModalOpen(false)}
          onProcessClose={(report) => {
            setDailyCloseHistory(prev => [report, ...prev]);
            setIsDailyCloseModalOpen(false);
            showToast(`¡Cierre Z ${report.code} generado correctamente!`);
          }}
        />
      )}

      {isAdminProductModalOpen && (
        <AdminProductModal
          formData={adminProductForm}
          setFormData={setAdminProductForm}
          categories={CATEGORIES}
          onClose={() => setIsAdminProductModalOpen(false)}
          onSave={() => {
            if (!adminProductForm.name) {
              showToast('Ingresa el nombre del producto');
              return;
            }
            if (adminProductForm.id) {
              setProducts(prev => prev.map(p => p.id === adminProductForm.id ? adminProductForm : p));
              showToast('Platillo actualizado');
            } else {
              setProducts(prev => [{ ...adminProductForm, id: Date.now() }, ...prev]);
              showToast('Nuevo platillo creado');
            }
            setIsAdminProductModalOpen(false);
          }}
        />
      )}

      {toast.show && (
        <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 text-white text-xs px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 max-w-[90vw] truncate animate-bounce">
          <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
          <span className="truncate font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
