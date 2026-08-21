export const INITIAL_COMPANY = {
  name: 'La Trattoria Gourmet S.A.S.',
  nit: '901.234.567-8',
  address: 'Calle 10 # 43-22, El Poblado, Medellín',
  phone: '+57 (604) 444-5566',
  email: 'facturacion@latrattoria.com',
  taxType: 'INC', // 'INC' (8%) o 'IVA' (19%)
  taxRate: 8,
  footerText: '¡Gracias por su compra! Régimen Común / Factura Electrónica DIAN',
  // Campos exigidos por la DIAN (Resolución 000165 de 2023)
  dianResolution: '187600000001',
  dianPrefix: 'FE',
  dianRangeFrom: 1,
  dianRangeTo: 10000,
  dianResolutionDate: '2025-01-15',
  dianExpirationDate: '2026-01-15',
  dianTechKey: 'c3f29a01e84741b29a1d2e3f40516273849501a2',
  dianSoftwareId: 'b7a892c1-3d4e-4f5a-8b1c-901234567890',
  dianTestSetId: 'd4e5f6a7-8b9c-0d1e-2f3a-4b5c6d7e8f9a'
};

export const INITIAL_CUSTOMERS = [
  { id: 1, name: 'Consumidor Final', nit: '222222222222', email: 'ventas@latrattoria.com', phone: '0000000000' },
  { id: 2, name: 'Juan Carlos Pérez', nit: '1020304050', email: 'juan.perez@gmail.com', phone: '3001234567' },
  { id: 3, name: 'Inversiones Tech S.A.S.', nit: '800.999.111-2', email: 'contabilidad@ytech.com', phone: '6042221100' }
];

export const CATEGORIES = ['Todos', 'Entradas', 'Platos Fuertes', 'Hamburguesas', 'Bebidas', 'Postres'];

export const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: 'Burger Trufada Gourmet',
    category: 'Hamburguesas',
    price: 34000,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop',
    description: 'Carne 100% Angus (200g), queso brie fundido, mayonesa de trufa negra y cebolla caramelizada.',
    isChef: true,
    isVeg: false,
    isGf: false,
    available: true,
    modifiers: [
      {
        title: 'Término de la Carne',
        required: true,
        options: [
          { name: 'Término Medio', price: 0 },
          { name: 'Tres Cuartos', price: 0 },
          { name: 'Bien Cocida', price: 0 }
        ]
      },
      {
        title: 'Adicionales',
        required: false,
        options: [
          { name: 'Tocineta Cincelada', price: 4500 },
          { name: 'Queso Extra', price: 3500 }
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'Tacos de Camarón al Pastor',
    category: 'Entradas',
    price: 28000,
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&auto=format&fit=crop',
    description: 'Tres tortillas artesanales, camarones en marinada al pastor, piña asada y emulsión de aguacate.',
    isChef: true,
    isVeg: false,
    isGf: true,
    available: true,
    modifiers: []
  },
  {
    id: 3,
    name: 'Bowl Mediterráneo Vegano',
    category: 'Platos Fuertes',
    price: 29000,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop',
    description: 'Quinoa real, garbanzos tostados, aguacate, pepino, hummus artesanal y aderezo tahini.',
    isChef: false,
    isVeg: true,
    isGf: true,
    available: true,
    modifiers: []
  },
  {
    id: 4,
    name: 'Ojo de Bife 300g Importado',
    category: 'Platos Fuertes',
    price: 62000,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop',
    description: 'Corte madurado a la parrilla de carbón, servido con papas rústicas al romero y chimichurri.',
    isChef: true,
    isVeg: false,
    isGf: true,
    available: true,
    modifiers: []
  },
  {
    id: 5,
    name: 'Limonada de Coco Frappé',
    category: 'Bebidas',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop',
    description: 'Crema de coco natural, zumo de limón fresco exprimido y hielo frappé con menta.',
    isChef: false,
    isVeg: true,
    isGf: true,
    available: true,
    modifiers: []
  },
  {
    id: 6,
    name: 'Tiramisú Tradicional Artesanal',
    category: 'Postres',
    price: 18000,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop',
    description: 'Bizcocho savoiardi embebido en café espresso, licor de amaretto y crema mascarpone.',
    isChef: false,
    isVeg: false,
    isGf: false,
    available: true,
    modifiers: []
  }
];

export const INITIAL_KITCHEN_ORDERS = [
  {
    id: 101,
    table: '2',
    time: 'Hace 8 min',
    status: 'Listo',
    items: [
      { name: 'Burger Trufada Gourmet', quantity: 1, price: 34000, selectedOptions: ['Término Medio'] },
      { name: 'Limonada de Coco Frappé', quantity: 1, price: 12000, selectedOptions: [] }
    ]
  },
  {
    id: 102,
    table: '4',
    time: 'Hace 2 min',
    status: 'En Preparación',
    items: [
      { name: 'Tacos de Camarón al Pastor', quantity: 2, price: 28000, selectedOptions: [] },
      { name: 'Bowl Mediterráneo Vegano', quantity: 1, price: 29000, selectedOptions: [] }
    ]
  }
];
