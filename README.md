# 🍽️ Gourmet POS & KDS - Sistema para Restaurantes con Facturación Electrónica DIAN

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Sistema web integral y moderno para restaurantes y locales gastronómicos que unifica en una sola aplicación interactiva:
1. 📱 **Menú QR Digital para Clientes** con geolocalización, simulación NFC, propina voluntaria y llamado a meseros.
2. 🍳 **Monitor KDS (Kitchen Display System)** en tiempo real para cocina con flujo de preparación de comandas y timbres sonoros.
3. 💳 **Caja POS & Facturación Electrónica DIAN** con generación de CUFE, código QR, tickets térmicos imprimibles y arqueo/cierre de caja (Reporte Z).
4. ⚙️ **Panel de Administración** para gestión de menú/platillos, configuración fiscal de la empresa y parametrización de resolución DIAN (Resolución 000165 de 2023 / UBL 2.1).

---

## 🚀 Características Principales

### 📱 1. Experiencia del Cliente (Menú Digital)
- **Vista interactiva**: Alternancia entre modo Lista y Cuadrícula.
- **Filtros por categoría y dietéticos**: Vegano, Sin Gluten, Especialidad del Chef.
- **Buscador predictivo**: Búsqueda instantánea por nombre o ingredientes.
- **Personalización de platillos**: Modificadores (término de la carne, adicionales con precio extra).
- **Control de presencia**: Verificación mediante GPS y simulación de escaneo NFC en mesa.
- **Botón de llamado a mesero**: Con motivos predefinidos (servilletas, agua, atención presencial).
- **Carrito de compras**: Cálculo automático de subtotal y sugerencia de propina voluntaria del 10%.

### 🍳 2. Monitor KDS de Cocina
- **Flujo de preparación por estados**: `Pendiente` ➔ `En Preparación` ➔ `Listo` ➔ `Pasar a Caja POS`.
- **Alertas sonoras**: Notificaciones mediante Web Audio API al recibir o actualizar pedidos.
- **Detalle de comandas**: Desglose de modificadores por ítem, tiempo transcurrido y número de mesa.

### 💳 3. Caja POS & Facturación DIAN (Colombia)
- **Facturación de comandas**: Emisión de Factura Electrónica de Venta o Tiquete POS.
- **Algoritmo de CUFE**: Generación de hash SHA-style simulado para validación DIAN.
- **Tiquetes térmicos imprimibles**: Formato de 80mm con código QR, desglose de impuestos (INC 8% o IVA 19%) y pie de página legal.
- **Arqueo y Cierre Z**: Cuadre de caja comparando ventas del sistema (efectivo, tarjeta, transferencias) contra efectivo físico contado con cálculo de faltante/sobrante.

### ⚙️ 4. Administración & Parametrización
- **CRUD de platillos**: Creación, edición, visibilidad (ocultar/mostrar) y eliminación de productos.
- **Datos de la empresa**: Razón social, NIT, dirección, teléfono y tipo de régimen fiscal.
- **Parámetros DIAN**: Prefijo autorizado, resolución de facturación (Formulario 1876), rangos numéricos, Clave Técnica, Software ID y SetTestID.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 (Hooks, Context/State, Memoization)
- **Bundler & Dev Server**: Vite 6
- **Estilos**: Tailwind CSS con diseño Glassmorphism & Dark Mode
- **Iconografía**: Lucide React
- **Audio Feedback**: Web Audio API sintetizado (sin dependencias externas de audio)
- **Control de Versiones & CI**: Git + GitHub Actions

---

## 📂 Estructura del Proyecto

```text
├── .github/
│   └── workflows/
│       └── ci.yml                 # Pipeline automatizado de CI (Build & Lint)
├── public/
│   └── favicon.svg                # Ícono oficial del restaurante
├── src/
│   ├── components/
│   │   ├── modals/
│   │   │   ├── AuxiliaryModals.jsx   # Modales (Cliente nuevo, Mesero, NFC, Platillos)
│   │   │   ├── BillingModal.jsx      # Modal de Facturación DIAN y POS
│   │   │   ├── CartDrawer.jsx        # Drawer lateral del pedido
│   │   │   ├── DailyCloseModal.jsx   # Arqueo de caja y Reporte Z
│   │   │   ├── ProductDetailModal.jsx# Personalización de ingredientes
│   │   │   └── TicketModal.jsx       # Tique térmico con QR y CUFE
│   │   ├── AdminView.jsx          # Panel de configuración y DIAN
│   │   ├── ClientView.jsx         # Menú interactivo para clientes
│   │   ├── FloatingBar.jsx        # Barra flotante de llamado y carrito
│   │   ├── Header.jsx             # Selector de roles y estado de conexión
│   │   ├── KitchenView.jsx        # Monitor KDS de cocina
│   │   └── PosView.jsx            # Caja y arqueo diario
│   ├── data/
│   │   └── mockData.js            # Datos iniciales y catálogo
│   ├── lib/
│   │   └── dian.js                # Utilidades de CUFE, impuestos y formato COP
│   ├── App.jsx                    # Orquestador principal de estado
│   ├── index.css                  # Directivas Tailwind y estilos de impresión
│   └── main.jsx                   # Punto de entrada React
├── .env.example                   # Variables de entorno de ejemplo
├── .gitignore                     # Archivos ignorados por Git
├── index.html                     # HTML5 con fuentes y SEO
├── LICENSE                        # Licencia MIT
├── package.json                   # Dependencias y scripts
├── postcss.config.js              # Configuración PostCSS
├── tailwind.config.js             # Configuración TailwindCSS
└── vite.config.js                 # Configuración de Vite
```

---

## 📦 Instalación y Uso Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
cd TU_REPOSITORIO
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```
La aplicación se abrirá en `http://localhost:3000`.

### 4. Compilar para producción
```bash
npm run build
```

---

## 🚀 Despliegue en la Nube

### Despliegue en Vercel
1. Conecta tu repositorio de GitHub en [Vercel](https://vercel.com).
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Haz clic en **Deploy**.

### Despliegue en Netlify
1. Crea un nuevo sitio desde Git en [Netlify](https://netlify.com).
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Haz clic en **Deploy Site**.

---

## 📄 Licencia

Este proyecto está bajo la Licencia [MIT](./LICENSE).
