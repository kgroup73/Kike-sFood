import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

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
import BillingModal from './components/modals/BillingModal';
import TicketModal from './components/modals/TicketModal';
import DailyCloseModal from './components/modals/DailyCloseModal';
import {
  NewCustomerModal,
  WaiterCallModal,
  GeoNfcModal,
  AdminProductModal
} from './components/modals/AuxiliaryModals';

export default function App() {
  const [currentRole, setCurrentRole] = useState('client');
  const [clientLayout, setClientLayout] = useState('list');
  const [tableNumber, setTableNumber] = useState('4');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [dietaryFilter, setDietaryFilter] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // States
  const [company, setCompany] = useState(INITIAL_COMPANY);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [kitchenOrders, setKitchenOrders] = useState(INITIAL_KITCHEN_ORDERS);
  const [invoices, setInvoices] = useState([]);
  const [dailyCloseHistory, setDailyCloseHistory] = useState([]);

  // Cart
  const [cart, setCart] = useState([]);
  const [includeTip, setIncludeTip] = useState(true);

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);
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

  return (
    <div className="bg-slate-950 text-slate-100 font-sans min-h-screen pb-24 selection:bg-orange-500 selection:text-white">
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
        posPendingCount={kitchenOrders.filter(o => o.status === 'Por Cobrar').length}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
        {currentRole === 'client' && (
          <ClientView
            products={products}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            dietaryFilter={dietaryFilter}
            setDietaryFilter={setDietaryFilter}
            clientLayout={clientLayout}
            setClientLayout={setClientLayout}
            setSelectedProduct={setSelectedProduct}
          />
        )}

        {currentRole === 'kitchen' && (
          <KitchenView
            kitchenOrders={kitchenOrders}
            updateOrderStatus={(id, status) => {
              setKitchenOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
              if (status === 'Por Cobrar') showToast(`Comanda #${id} enviada a Caja POS`);
              playChime();
            }}
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
          />
        )}

        {currentRole === 'config' && (
          <AdminView
            products={products}
            company={company}
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
          />
        )}
      </main>

      {currentRole === 'client' && (
        <FloatingClientBar
          cart={cart}
          includeTip={includeTip}
          setIsCartOpen={setIsCartOpen}
          triggerWaiterCall={() => {
            if (!isInsidePremises) setIsGeoModalOpen(true);
            else setIsWaiterModalOpen(true);
          }}
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
            if (!isInsidePremises) {
              setIsGeoModalOpen(true);
              return;
            }
            if (!cart.length) return;
            const newOrder = {
              id: Math.floor(100 + Math.random() * 900),
              table: tableNumber,
              time: 'Hace un instante',
              status: 'Pendiente',
              items: cart.map(c => ({
                name: c.product.name,
                quantity: c.quantity,
                price: c.product.price,
                selectedOptions: c.optionsText ? [c.optionsText] : []
              }))
            };
            setKitchenOrders(prev => [newOrder, ...prev]);
            setCart([]);
            setIsCartOpen(false);
            playChime();
            showToast('¡Pedido enviado a Cocina! 🍳');
          }}
        />
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(cartItem) => {
            setCart(prev => [...prev, cartItem]);
            setSelectedProduct(null);
            showToast('¡Agregado a tu pedido! 🛒');
          }}
        />
      )}

      {isWaiterModalOpen && (
        <WaiterCallModal
          tableNumber={tableNumber}
          onClose={() => setIsWaiterModalOpen(false)}
          callWaiter={(reason) => {
            setIsWaiterModalOpen(false);
            showToast(`Llamado enviado: "${reason}" 🛎️`);
          }}
        />
      )}

      {isGeoModalOpen && (
        <GeoNfcModal
          onClose={() => setIsGeoModalOpen(false)}
          simulateNfc={(num) => {
            setTableNumber(num);
            setIsInsidePremises(true);
            setIsGeoModalOpen(false);
            showToast(`¡Mesa ${num} verificada por NFC! ⚡`);
          }}
          confirmGps={() => {
            setIsInsidePremises(true);
            setIsGeoModalOpen(false);
            showToast('Ubicación confirmada en el local 📍');
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
