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

export const MENU_STORIES = [
  {
    id: 'story-1',
    title: 'Top Estrella ⭐',
    subtitle: 'Burger Trufada Gourmet',
    productId: 1,
    tag: 'MÁS PEDIDO',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop',
    storyText: 'Nuestra icónica hamburguesa con 200g de carne Angus madurada, bañada en crema de trufas negras de Umbría.',
    badgeColor: 'from-amber-500 to-orange-600',
    duration: 5000
  },
  {
    id: 'story-2',
    title: 'Especial Chef 👨‍🍳',
    subtitle: 'Ojo de Bife 300g Importado',
    productId: 4,
    tag: 'SELECCIÓN PREMIUM',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop',
    storyText: 'Maduración de 28 días y sellado a 400°C en brasas de roble y quebracho blanco. Una explosión de sabor.',
    badgeColor: 'from-rose-500 to-red-600',
    duration: 5000
  },
  {
    id: 'story-3',
    title: 'Maridaje Perfecto 🍷',
    subtitle: 'Sangría Artesanal & Trufas',
    productId: 7,
    tag: 'RECOMENDADO',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop',
    storyText: 'Cosecha seleccionada con notas a frutos rojos silvestres macerados con especias de temporada.',
    badgeColor: 'from-purple-500 to-indigo-600',
    duration: 5000
  },
  {
    id: 'story-4',
    title: 'Green & Healthy 🌿',
    subtitle: 'Bowl Mediterráneo Vegano',
    productId: 3,
    tag: '100% PLANT BASED',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop',
    storyText: 'Superalimentos orgánicos cosechados en huertos locales de Santa Elena con aderezo artesanal de sésamo.',
    badgeColor: 'from-emerald-500 to-teal-600',
    duration: 5000
  },
  {
    id: 'story-5',
    title: 'Final Dulce 🍨',
    subtitle: 'Tiramisú Tradicional Artesanal',
    productId: 6,
    tag: 'POSTRE DEL MES',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&auto=format&fit=crop',
    storyText: 'Receta veneciana con café de origen tostado en casa y queso mascarpone importado.',
    badgeColor: 'from-amber-600 to-yellow-500',
    duration: 5000
  }
];

export const ROULETTE_MOODS = [
  { id: 'all', label: '🎲 Sorpréndeme', icon: 'Sparkles', color: 'from-orange-500 to-amber-500' },
  { id: 'carnes', label: '🥩 Antojo de Carne / Gourmet', filter: p => p.category === 'Hamburguesas' || p.category === 'Platos Fuertes', color: 'from-rose-500 to-orange-600' },
  { id: 'light', label: '🌿 Ligero / Saludable', filter: p => p.isVeg || p.isGf, color: 'from-emerald-500 to-teal-600' },
  { id: 'entradas', label: '🌮 Para Compartir / Entradas', filter: p => p.category === 'Entradas', color: 'from-indigo-500 to-blue-600' },
  { id: 'dulce', label: '🍰 Postres & Bebidas', filter: p => p.category === 'Postres' || p.category === 'Bebidas', color: 'from-purple-500 to-pink-600' }
];

export const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: 'Burger Trufada Gourmet',
    category: 'Hamburguesas',
    price: 34000,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop',
    description: 'Carne 100% Angus (200g), queso brie fundido, mayonesa de trufa negra y cebolla caramelizada.',
    isChef: true,
    isVeg: false,
    isGf: false,
    isPopular: true,
    rating: 4.9,
    reviewsCount: 184,
    prepTime: '15-20 min',
    spicyLevel: 0,
    calories: '720 kcal',
    chefNotes: 'Recomendamos el término medio para apreciar la jugosidad del corte Angus y el aroma de la trufa.',
    ingredients: ['Carne Angus 200g', 'Queso Brie', 'Trufa Negra', 'Cebolla Caramelizada', 'Pan Brioche Artesanal'],
    pairing: {
      productId: 7,
      name: 'Sangría Artesanal de Frutos Rojos',
      price: 16000,
      description: 'El balance cítrico y taninos suaves limpian el paladar tras la intensidad de la trufa.',
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&auto=format&fit=crop'
    },
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
        title: 'Adicionales Gourmet',
        required: false,
        options: [
          { name: 'Tocineta Cincelada Crujiente', price: 4500 },
          { name: 'Queso Brie Extra', price: 5000 },
          { name: 'Huevo de Campo Estrellado', price: 3000 }
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'Tacos de Camarón al Pastor',
    category: 'Entradas',
    price: 28000,
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&auto=format&fit=crop',
    description: 'Tres tortillas artesanales, camarones en marinada al pastor, piña asada y emulsión de aguacate.',
    isChef: true,
    isVeg: false,
    isGf: true,
    isPopular: true,
    rating: 4.8,
    reviewsCount: 132,
    prepTime: '12-15 min',
    spicyLevel: 2,
    calories: '450 kcal',
    chefNotes: 'La piña tatemada al carbón equilibra el toque picante del adobo tradicional de guajillo.',
    ingredients: ['Camarones de cultivo sostenible', 'Piña miel asada', 'Cilantro fresco', 'Emulsión de aguacate Hass', 'Tortillas de maíz nixtamalizado'],
    pairing: {
      productId: 5,
      name: 'Limonada de Coco Frappé',
      price: 12000,
      description: 'La frescura del coco aplaca suavemente el picante del adobo al pastor.',
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop'
    },
    available: true,
    modifiers: [
      {
        title: 'Nivel de Picante',
        required: false,
        options: [
          { name: 'Picante Ligero', price: 0 },
          { name: 'Picante Medio (Original)', price: 0 },
          { name: 'Picante Alto (Habanero)', price: 1500 }
        ]
      }
    ]
  },
  {
    id: 3,
    name: 'Bowl Mediterráneo Vegano',
    category: 'Platos Fuertes',
    price: 29000,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop',
    description: 'Quinoa real, garbanzos tostados con paprika, aguacate, pepino, hummus artesanal y aderezo tahini.',
    isChef: false,
    isVeg: true,
    isGf: true,
    isPopular: false,
    rating: 4.7,
    reviewsCount: 96,
    prepTime: '10-12 min',
    spicyLevel: 0,
    calories: '380 kcal',
    chefNotes: 'Rico en proteína vegetal de alto valor biológico y grasas saludables insaturadas.',
    ingredients: ['Quinoa tricolor', 'Hummus de garbanzo', 'Aguacate', 'Tomates cherry', 'Semillas de chía y sésamo'],
    pairing: {
      productId: 5,
      name: 'Limonada de Coco Frappé',
      price: 12000,
      description: 'Acompañamiento refrescante con extracto de menta fresca.',
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop'
    },
    available: true,
    modifiers: [
      {
        title: 'Proteína Extra',
        required: false,
        options: [
          { name: 'Tofu Marinado a la Plancha', price: 4000 },
          { name: 'Champiñones Portobello Asados', price: 4500 }
        ]
      }
    ]
  },
  {
    id: 4,
    name: 'Ojo de Bife 300g Importado',
    category: 'Platos Fuertes',
    price: 62000,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop',
    description: 'Corte madurado a la parrilla de carbón, servido con papas rústicas al romero y chimichurri casero.',
    isChef: true,
    isVeg: false,
    isGf: true,
    isPopular: true,
    rating: 5.0,
    reviewsCount: 245,
    prepTime: '20-25 min',
    spicyLevel: 0,
    calories: '850 kcal',
    chefNotes: 'Corte con marmoleo premium grado 5+, sazonado únicamente con sal marina en escamas y pimienta negra recién molida.',
    ingredients: ['Ribeye / Ojo de Bife 300g', 'Papas rústicas', 'Romero fresco', 'Chimichurri de la casa'],
    pairing: {
      productId: 7,
      name: 'Sangría Artesanal de Frutos Rojos',
      price: 16000,
      description: 'Maridaje sublime que realza las notas ahumadas del asado a la parrilla.',
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&auto=format&fit=crop'
    },
    available: true,
    modifiers: [
      {
        title: 'Término del Corte',
        required: true,
        options: [
          { name: 'Término Medio (Recomendado Chef)', price: 0 },
          { name: 'Tres Cuartos', price: 0 },
          { name: 'Bien Asado', price: 0 },
          { name: 'Azul / Sangrante', price: 0 }
        ]
      },
      {
        title: 'Guarnición Adicional',
        required: false,
        options: [
          { name: 'Espárragos Salteados a la Mantequilla', price: 7000 },
          { name: 'Puré de Papa Trufado', price: 6500 }
        ]
      }
    ]
  },
  {
    id: 5,
    name: 'Limonada de Coco Frappé',
    category: 'Bebidas',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop',
    description: 'Crema de coco natural, zumo de limón fresco exprimido y hielo frappé batido con toque de menta.',
    isChef: false,
    isVeg: true,
    isGf: true,
    isPopular: true,
    rating: 4.9,
    reviewsCount: 178,
    prepTime: '5-8 min',
    spicyLevel: 0,
    calories: '210 kcal',
    chefNotes: 'Preparada al instante sin conservantes ni jarabes artificiales.',
    ingredients: ['Leche de coco cremosa', 'Limón Tahití fresco', 'Hielo cristal', 'Menta fresca'],
    pairing: null,
    available: true,
    modifiers: [
      {
        title: 'Endulzante',
        required: false,
        options: [
          { name: 'Tradicional (Azúcar de Caña)', price: 0 },
          { name: 'Endulzado con Stevia', price: 0 },
          { name: 'Sin Azúcar Añadido', price: 0 }
        ]
      }
    ]
  },
  {
    id: 6,
    name: 'Tiramisú Tradicional Artesanal',
    category: 'Postres',
    price: 18000,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&auto=format&fit=crop',
    description: 'Bizcocho savoiardi embebido en café espresso, licor de amaretto y suave crema mascarpone espolvoreada con cacao.',
    isChef: false,
    isVeg: false,
    isGf: false,
    isPopular: true,
    rating: 4.9,
    reviewsCount: 154,
    prepTime: '5 min',
    spicyLevel: 0,
    calories: '420 kcal',
    chefNotes: 'Receta italiana clásica de Treviso, con cacao amargo al 70% de origen colombiano.',
    ingredients: ['Queso Mascarpone', 'Savoiardi italianos', 'Café Espresso especial', 'Cacao puro 70%', 'Amaretto Disaronno'],
    pairing: null,
    available: true,
    modifiers: []
  },
  {
    id: 7,
    name: 'Sangría Artesanal de Frutos Rojos',
    category: 'Bebidas',
    price: 16000,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop',
    description: 'Vino tinto joven infusionado con fresas, moras, arándanos silvestres, toque de canela y licor de naranja.',
    isChef: true,
    isVeg: true,
    isGf: true,
    isPopular: true,
    rating: 4.9,
    reviewsCount: 110,
    prepTime: '5 min',
    spicyLevel: 0,
    calories: '180 kcal',
    chefNotes: 'Macerada en frío por 24 horas para extraer toda la esencia frutal.',
    ingredients: ['Vino Tinto Reserva', 'Mix de Frutos Rojos', 'Cointreau', 'Rodajas de Naranja y Canela'],
    pairing: null,
    available: true,
    modifiers: []
  },
  {
    id: 8,
    name: 'Burrata Pugliese con Pesto y Prosciutto',
    category: 'Entradas',
    price: 36000,
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22a45?w=800&auto=format&fit=crop',
    description: 'Queso burrata fresco artesanal de 150g, láminas de jamón de Parma, tomates confitados y pesto de albahaca fresca.',
    isChef: true,
    isVeg: false,
    isGf: true,
    isPopular: true,
    rating: 5.0,
    reviewsCount: 201,
    prepTime: '8-10 min',
    spicyLevel: 0,
    calories: '530 kcal',
    chefNotes: 'Servida a temperatura ambiente para permitir que el corazón de stracciatella fluya cremosamente.',
    ingredients: ['Burrata de búfala 150g', 'Prosciutto di Parma', 'Pesto genovés con piñones', 'Tomates cherry', 'Tomates cherry confitados', 'Aceite de oliva extra virgen'],
    pairing: {
      productId: 7,
      name: 'Sangría Artesanal de Frutos Rojos',
      price: 16000,
      description: 'El toque frutal resalta la salinidad del prosciutto y la frescura de la albahaca.',
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&auto=format&fit=crop'
    },
    available: true,
    modifiers: [
      {
        title: 'Acompañamiento de Pan',
        required: false,
        options: [
          { name: 'Focaccia al Romero recién horneada', price: 4000 },
          { name: 'Tostadas Sin Gluten', price: 3500 }
        ]
      }
    ]
  },
  {
    id: 9,
    name: 'Risotto al Tartufo Nero & Funghi Porcini',
    category: 'Platos Fuertes',
    price: 48000,
    image: '/dishes/risotto.jpg',
    description: 'Arroz Carnaroli mantecado con mantequilla de trufa de Umbría, setas porcini silvestres, láminas de trufa negra fresca y queso Parmigiano Reggiano 24 meses.',
    isChef: true,
    isVeg: true,
    isGf: true,
    isPopular: true,
    rating: 5.0,
    reviewsCount: 168,
    prepTime: '18-22 min',
    spicyLevel: 0,
    calories: '590 kcal',
    chefNotes: 'Cocinamos el arroz lentamente con caldo de verduras rostizadas y emulsionamos con Parmigiano de 24 meses.',
    ingredients: ['Arroz Carnaroli', 'Setas Porcini silvestres', 'Mantequilla de Trufa Negra', 'Parmigiano Reggiano 24m', 'Vino Blanco Pinot Grigio'],
    pairing: {
      productId: 7,
      name: 'Sangría Artesanal de Frutos Rojos',
      price: 16000,
      description: 'Los taninos y frutos rojos equilibran la untuosidad del queso y la intensidad de la trufa.',
      image: '/dishes/cocktail.jpg'
    },
    available: true,
    modifiers: [
      {
        title: 'Adicional de Lujo',
        required: false,
        options: [
          { name: 'Láminas extra de Trufa Negra', price: 9000 },
          { name: 'Colas de Langostinos Salteados', price: 12000 }
        ]
      }
    ]
  },
  {
    id: 10,
    name: 'Salmón Glaseado en Costra de Pistacho',
    category: 'Platos Fuertes',
    price: 54000,
    image: '/dishes/salmon.jpg',
    description: 'Filete de salmón noruego con costra crocante de pistacho siciliano, puré sedoso de coliflor al azafrán y reducción de cítricos y miel silvestre.',
    isChef: true,
    isVeg: false,
    isGf: true,
    isPopular: true,
    rating: 4.9,
    reviewsCount: 142,
    prepTime: '16-20 min',
    spicyLevel: 0,
    calories: '520 kcal',
    chefNotes: 'Sellado a fuego vivo para mantener la terneza y jugosidad interior rosada.',
    ingredients: ['Salmón Noruego Fresco', 'Pistachos de Sicilia', 'Puré de Coliflor al Azafrán', 'Reducción de Cítricos', 'Microvegetales'],
    pairing: {
      productId: 18,
      name: 'Elixir Botánico de Saúco & Pepino',
      price: 18000,
      description: 'El frescor floral del saúco resalta la untuosidad de las grasas nobles del salmón.',
      image: '/dishes/elderflower.jpg'
    },
    available: true,
    modifiers: [
      {
        title: 'Término del Salmón',
        required: true,
        options: [
          { name: 'Término Medio Rosado (Recomendado)', price: 0 },
          { name: 'Bien Cocido', price: 0 }
        ]
      }
    ]
  },
  {
    id: 11,
    name: 'Ravioli Neri di Aragosta al Zafferano',
    category: 'Platos Fuertes',
    price: 52000,
    image: '/dishes/ravioli.jpg',
    description: 'Pasta negra artesanal con tinta de calamar, rellena de langosta del Caribe y ricotta fresca en emulsión de mantequilla avellanada al azafrán y caviar Oscietra.',
    isChef: true,
    isVeg: false,
    isGf: false,
    isPopular: true,
    rating: 5.0,
    reviewsCount: 189,
    prepTime: '15-18 min',
    spicyLevel: 0,
    calories: '610 kcal',
    chefNotes: 'Masa estirada a mano cada mañana, con relleno de colas de langosta flameadas en coñac.',
    ingredients: ['Pasta fresca con tinta de calamar', 'Langosta caribeña', 'Ricotta de búfala', 'Azafrán en hebras', 'Caviar Oscietra'],
    pairing: {
      productId: 17,
      name: 'Smoked Old Fashioned de Autor',
      price: 26000,
      description: 'Aromas a madera ahumada que contrastan soberbiamente con el azafrán.',
      image: '/dishes/cocktail.jpg'
    },
    available: true,
    modifiers: [
      {
        title: 'Topping de Autor',
        required: false,
        options: [
          { name: 'Perlas de Caviar Oscietra Extra', price: 14000 },
          { name: 'Queso Parmigiano Rallado al Momento', price: 4000 }
        ]
      }
    ]
  },
  {
    id: 12,
    name: 'Carpaccio di Wagyu A5 con Tartufo',
    category: 'Entradas',
    price: 46000,
    image: '/dishes/carpaccio.jpg',
    description: 'Finas láminas de res Wagyu A5 japonés marmoleado, lascas de Parmigiano Reggiano, microalbahaca, perlas de balsámico di Modena y aceite de trufa blanca.',
    isChef: true,
    isVeg: false,
    isGf: true,
    isPopular: true,
    rating: 4.9,
    reviewsCount: 215,
    prepTime: '8-10 min',
    spicyLevel: 0,
    calories: '390 kcal',
    chefNotes: 'Carne cortada a -2°C para conservar su textura de seda que se funde inmediatamente al paladar.',
    ingredients: ['Corte Wagyu A5 certificado', 'Parmigiano Reggiano 24m', 'Aceite de Trufa Blanca de Alba', 'Perlas de Aceto Balsámico', 'Rúgula selvática'],
    pairing: {
      productId: 7,
      name: 'Sangría Artesanal de Frutos Rojos',
      price: 16000,
      description: 'La acidez frutal balancea la grasa intramuscular marmolada del Wagyu.',
      image: '/dishes/cocktail.jpg'
    },
    available: true,
    modifiers: [
      {
        title: 'Pan de Acompañamiento',
        required: false,
        options: [
          { name: 'Focaccia crocante recién horneada', price: 4000 },
          { name: 'Tostaditas de Centeno y Sal Marina', price: 3500 }
        ]
      }
    ]
  },
  {
    id: 13,
    name: 'Pulpo Braseado al Carbón de Encina',
    category: 'Platos Fuertes',
    price: 58000,
    image: '/dishes/octopus.jpg',
    description: 'Tentáculo de pulpo del Pacífico caramelizado a las brasas, sobre crema tibia de papas criollas al pimentón de la Vera, chips de ajo y aceite de oliva virgen extra.',
    isChef: true,
    isVeg: false,
    isGf: true,
    isPopular: true,
    rating: 4.9,
    reviewsCount: 176,
    prepTime: '15-20 min',
    spicyLevel: 1,
    calories: '470 kcal',
    chefNotes: 'Cocción al vacío a 77°C durante 5 horas antes de terminar en parrilla de hierro al carbón.',
    ingredients: ['Tentáculo de Pulpo', 'Papa criolla andina', 'Pimentón ahumado de la Vera', 'Ajo confitado', 'Sal Maldón en escamas'],
    pairing: {
      productId: 5,
      name: 'Limonada de Coco Frappé',
      price: 12000,
      description: 'El toque cremoso y cítrico refresca las notas ahumadas del carbón de encina.',
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop'
    },
    available: true,
    modifiers: []
  },
  {
    id: 14,
    name: 'Gnocchi al Pesto di Pistacchio e Gamberi',
    category: 'Platos Fuertes',
    price: 49000,
    image: '/dishes/gnocchi.jpg',
    description: 'Ñoquis de papa hechos a mano con pesto cremoso de pistacho de Bronte, camarones jumbo sellados al fuego, stracciatella fresca y flores comestibles.',
    isChef: true,
    isVeg: false,
    isGf: false,
    isPopular: true,
    rating: 4.8,
    reviewsCount: 124,
    prepTime: '12-16 min',
    spicyLevel: 0,
    calories: '640 kcal',
    chefNotes: 'Gnocchi esponjosos como nubes preparados diariamente con papas asadas a la sal.',
    ingredients: ['Ñoquis caseros de papa', 'Camarones jumbo', 'Pesto de pistacho de Bronte', 'Stracciatella cremosa', 'Flores de borraja'],
    pairing: {
      productId: 18,
      name: 'Elixir Botánico de Saúco & Pepino',
      price: 18000,
      description: 'Frescura botánica que complementa el dulzor de los camarones y el pistacho.',
      image: '/dishes/elderflower.jpg'
    },
    available: true,
    modifiers: [
      {
        title: 'Porción Extra',
        required: false,
        options: [
          { name: 'Camarones Jumbo Adicionales (3 uds)', price: 9000 },
          { name: 'Extra Stracciatella de Búfala', price: 5000 }
        ]
      }
    ]
  },
  {
    id: 15,
    name: 'Costillar de Cordero en Costra de Hierbas',
    category: 'Platos Fuertes',
    price: 68000,
    image: '/dishes/lamb.jpg',
    description: 'Chop de cordero lechal asado a término medio con costra dorada de hierbas provenzales, demi-glace al romero fresco, zanahorias baby glaseadas y puré trufado.',
    isChef: true,
    isVeg: false,
    isGf: false,
    isPopular: true,
    rating: 5.0,
    reviewsCount: 198,
    prepTime: '20-25 min',
    spicyLevel: 0,
    calories: '780 kcal',
    chefNotes: 'Carne tierna y jugosa con demi-glace reducida durante 36 horas con huesos tostados y Oporto.',
    ingredients: ['Costillar de Cordero', 'Hierbas de Provenza y Panko', 'Demi-glace al Romero', 'Zanahorias glaseadas con miel', 'Puré trufado'],
    pairing: {
      productId: 17,
      name: 'Smoked Old Fashioned de Autor',
      price: 26000,
      description: 'El roble y los aromas del bourbon hacen sinergia perfecta con la potencia del cordero.',
      image: '/dishes/cocktail.jpg'
    },
    available: true,
    modifiers: [
      {
        title: 'Término de Cocción',
        required: true,
        options: [
          { name: 'Término Medio Rosado (Sugerido)', price: 0 },
          { name: 'Tres Cuartos', price: 0 },
          { name: 'Bien Cocido', price: 0 }
        ]
      }
    ]
  },
  {
    id: 16,
    name: 'Tartare Nikkei de Atún Bluefin',
    category: 'Entradas',
    price: 44000,
    image: '/dishes/tuna.jpg',
    description: 'Dados de atún rojo Bluefin grado sashimi marinados en ponzu trufado, mousse de aguacate Hass, mango biche, sésamo tostado y esferas de yuzu cítrico.',
    isChef: true,
    isVeg: false,
    isGf: true,
    isPopular: true,
    rating: 4.9,
    reviewsCount: 153,
    prepTime: '10 min',
    spicyLevel: 1,
    calories: '360 kcal',
    chefNotes: 'Atún fresco de pesca responsable servido sobre hielo picado para máxima frescura.',
    ingredients: ['Atún Rojo Bluefin', 'Mousse de Aguacate Hass', 'Mango Biche', 'Salsa Ponzu artesanal', 'Perlas de Yuzu'],
    pairing: {
      productId: 18,
      name: 'Elixir Botánico de Saúco & Pepino',
      price: 18000,
      description: 'Maridaje cítrico y refrescante que enaltece el sabor limpio del atún crudo.',
      image: '/dishes/elderflower.jpg'
    },
    available: true,
    modifiers: [
      {
        title: 'Picante Nikkei',
        required: false,
        options: [
          { name: 'Normal (Toque Sutil de Rocoto)', price: 0 },
          { name: 'Intenso (Con Wasabi y Shichimi)', price: 1000 },
          { name: 'Sin Picante', price: 0 }
        ]
      }
    ]
  },
  {
    id: 17,
    name: 'Smoked Old Fashioned de Autor',
    category: 'Bebidas',
    price: 26000,
    image: '/dishes/cocktail.jpg',
    description: 'Bourbon añejado 12 años, bitter aromático artesanal, sirope de panela orgánica infusionada en pieles de naranja y humo de maderas de cerezo servido bajo campana.',
    isChef: true,
    isVeg: true,
    isGf: true,
    isPopular: true,
    rating: 5.0,
    reviewsCount: 230,
    prepTime: '5-7 min',
    spicyLevel: 0,
    calories: '190 kcal',
    chefNotes: 'Ahumado al instante frente a la mesa con virutas de cerezo silvestre y hielo cristalino de corte manual.',
    ingredients: ['Bourbon Single Barrel 12 años', 'Bitter Angostura & Naranja', 'Sirope de Panela & Clavos', 'Cáscara de Naranja flameada', 'Humo de Cerezo'],
    pairing: null,
    available: true,
    modifiers: []
  },
  {
    id: 18,
    name: 'Elixir Botánico de Saúco & Pepino',
    category: 'Bebidas',
    price: 18000,
    image: '/dishes/elderflower.jpg',
    description: 'Mocktail premium con destilado botánico sin alcohol, cordial de flor de saúco, láminas de pepino fresco, tónica artesanal y escamas de oro comestible de 24k.',
    isChef: false,
    isVeg: true,
    isGf: true,
    isPopular: true,
    rating: 4.8,
    reviewsCount: 97,
    prepTime: '5 min',
    spicyLevel: 0,
    calories: '120 kcal',
    chefNotes: 'Bebida elegante, aromática y digestiva servida en copa de cristal tallado.',
    ingredients: ['Destilado botánico de enebro sin alcohol', 'Cordial de Flor de Saúco Saint-Germain', 'Pepino orgánico', 'Agua Tónica Premium', 'Oro 24k comestible'],
    pairing: null,
    available: true,
    modifiers: []
  },
  {
    id: 19,
    name: 'Tarta Vasca de Queso & Pistacho de Bronte',
    category: 'Postres',
    price: 22000,
    image: '/dishes/cheesecake.jpg',
    description: 'Cheesecake horneado al estilo Donostia con corazón fundente y cremoso, pasta pura de pistachos sicilianos tostados, frambuesas silvestres y crumble de mantequilla.',
    isChef: true,
    isVeg: false,
    isGf: false,
    isPopular: true,
    rating: 5.0,
    reviewsCount: 310,
    prepTime: '5 min',
    spicyLevel: 0,
    calories: '490 kcal',
    chefNotes: 'Horneada a alta temperatura para lograr la superficie tostada caramelizada y un centro líquido y sedoso.',
    ingredients: ['Queso Crema San Millán', 'Pistachos de Bronte D.O.P.', 'Huevos de campo', 'Frambuesas frescas', 'Crumble artesanal'],
    pairing: {
      productId: 17,
      name: 'Smoked Old Fashioned de Autor',
      price: 26000,
      description: 'El ahumado del cóctel potencia el tostado exterior de la tarta vasca.',
      image: '/dishes/cocktail.jpg'
    },
    available: true,
    modifiers: []
  },
  {
    id: 20,
    name: 'Volcán de Chocolate Belga 70% & Vainilla',
    category: 'Postres',
    price: 24000,
    image: '/dishes/volcan.jpg',
    description: 'Coulant tibio de chocolate amargo belga Callebaut con centro de lava derretida, helado artesanal de vainilla Bourbon de Madagascar y tierra crocante de avellanas.',
    isChef: true,
    isVeg: false,
    isGf: false,
    isPopular: true,
    rating: 5.0,
    reviewsCount: 284,
    prepTime: '10 min',
    spicyLevel: 0,
    calories: '540 kcal',
    chefNotes: 'Servido caliente al instante del horno para asegurar la caída perfecta del chocolate líquido.',
    ingredients: ['Chocolate Belga Callebaut 70%', 'Mantequilla francesa sin sal', 'Helado de Vainilla Bourbon artesanal', 'Avellanas del Piamonte tostadas'],
    pairing: {
      productId: 7,
      name: 'Sangría Artesanal de Frutos Rojos',
      price: 16000,
      description: 'El maridaje de vino tinto y chocolate negro eleva los matices frutales y achocolatados.',
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&auto=format&fit=crop'
    },
    available: true,
    modifiers: [
      {
        title: 'Bola Extra de Helado',
        required: false,
        options: [
          { name: 'Vainilla Bourbon de Madagascar', price: 4500 },
          { name: 'Helado de Pistacho Siciliano', price: 5500 }
        ]
      }
    ]
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

