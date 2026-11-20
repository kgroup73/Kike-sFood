# Instructivo de Negocio: Requisitos Legales y Tributarios para Facturación Electrónica DIAN (Colombia)

> **Guía para Restaurantes y Bares:** Este documento detalla qué debe cumplir un establecimiento de comercio gastronómico en Colombia para poder emitir Facturación Electrónica ante la DIAN, y cuándo aplica o no esta obligación.

---

## 1. ¿Quién está OBLIGADO a Facturar Electrónicamente en Restaurantes?

Según el **Estatuto Tributario (Artículos 615 y 616-1)** y la **Resolución DIAN 000042 de 2020 / 000165 de 2023**:

### Están OBLIGADOS (100%):
1. **Todas las Personas Jurídicas** (sociedades SAS, Limitadas, etc.) que presten servicios de restaurante, cafetería, bar o discoteca, sin importar el monto de sus ventas.
2. **Personas Naturales** que cumplan CUALQUIERA de estas condiciones:
   - Ingresos brutos anuales iguales o superiores a **3.500 UVT** en el año actual o anterior (Aprox. \$164.7 millones COP en 2024 / \$174 millones COP en 2025/2026).
   - Tener más de **un establecimiento de comercio**, oficina, local o negocio.
   - Desarrollar actividades bajo franquicia, concesión, regalía o cualquier otro sistema que implique la explotación de intangibles.
   - Ser usuarios aduaneros.

### NO están obligados (Opción de no emitir Factura Electrónica):
- Personas naturales que pertenezcan al grupo de **No Responsables del Impuesto Nacional al Consumo (INC)** ni del IVA:
  - Tienen un solo local o establecimiento de comercio.
  - Sus ventas anuales están estrictamente por debajo de las 3.500 UVT.
  - No operan bajo franquicia.
  - *Nota:* Estos restaurantes pueden seguir operando legalmente con el tiquete interno de caja (POS básico) de Kike's Food sin enviar nada a la DIAN.

---

## 2. Paso a Paso del Negocio para Habilitarse ante la DIAN

Para que KGroup o el restaurante puedan configurar el módulo de Facturación Electrónica, el dueño del negocio debe realizar los siguientes 5 trámites previos:

### Paso 1: Actualizar el RUT (Registro Único Tributario)
El representante legal o dueño debe tener su RUT actualizado con:
- **Código de Actividad Económica:** 5611 (Restaurantes), 5612 (Comidas rápidas), 5613 (Catering), 5630 (Bares/discotecas).
- **Código de Responsabilidad 52:** *"Facturador Electrónico"*.
- **Responsabilidad de Impuestos:**
  - Código **33** (*Impuesto Nacional al Consumo - INC 8%*), o
  - Código **48 / 49** (*Responsable de IVA 19%*, aplica para restaurantes que operan como franquicia o ciertos contratos de catering).

### Paso 2: Registro y Habilitación en el Portal DIAN
1. Ingresar al portal de la DIAN: `https://catalogo-vpfe.dian.gov.co/` en la opción **Habilitación**.
2. Ingresar mediante Cédula / NIT del Representante Legal (la DIAN envía un enlace de acceso temporal al correo registrado en el RUT).
3. Seleccionar el modo de operación:
   - *Software Propio* (si se cuenta con desarrollo directo certificado).
   - *Proveedor Tecnológico* (si se utiliza una pasarela autorizada como Factus, Alegra, Siigo, etc.).
4. Superar el set de pruebas: emitir un set de facturas, notas crédito y notas débito de prueba simuladas hasta que la DIAN declare el estado como **Habilitado**.

### Paso 3: Solicitar Rangos de Numeración (Resolución DIAN - Formulario 1876)
1. Ingresar al portal Muisca de la DIAN con firma digital del representante legal.
2. Ir a *Numeración de Facturación* -> *Solicitar Numeración de Facturación*.
3. Indicar el tipo de documento: **Factura Electrónica de Venta**.
4. Definir un **Prefijo** (de 1 a 4 letras mayúsculas, ej. `FE`, `FAC`, `REST`) y el **Rango solicitado** (ej. Del número 1 al 5.000).
5. La DIAN expedirá el **Formulario 1876**, donde figura:
   - Número de resolución (ej. `18764000001234`).
   - Fecha de vigencia (usualmente 6, 12 o 24 meses).
   - Rango autorizado.

### Paso 4: Asociar Prefijos en el Portal de Facturación Electrónica
1. Ingresar nuevamente a `https://catalogo-vpfe.dian.gov.co/` en la opción **Participantes** -> **Asociar Prefijos**.
2. Seleccionar el software del restaurante y vincular el prefijo aprobado en el Formulario 1876.
3. El sistema de la DIAN generará la **Clave Técnica (Technical Key)**: una cadena de seguridad criptográfica obligatoria para generar el CUFE.

### Paso 5: Certificado de Firma Digital
- Si se emite a través de un **Proveedor Tecnológico**, el proveedor coloca su propia firma digital autorizada por la DIAN (ahorro de costos para el restaurante).
- Si se emite como **Software Propio**, el restaurante debe adquirir anualmente un certificado digital de firma a su nombre con una entidad certificadora acreditada por ONAC (GSE, Certicámara, Andes SCD).

---

## 3. Reglas Prácticas en el Servicio Diario de Restaurante

### A. Facturación a "Consumidor Final" vs "Cliente con Nombre y NIT"
- **Consumidor Final (Sin datos del cliente):**
  La DIAN autoriza expresamente que cuando el comensal no requiera su factura con nombre o no suministre sus datos, se emita la Factura Electrónica bajo el adquirente genérico:
  - **Tipo de documento:** Cédula de Ciudadanía.
  - **Número de identificación:** `222222222222` (doce números dos).
  - **Nombre / Razón Social:** `Consumidor Final`.
  - **Correo electrónico:** Correo del propio restaurante o genérico DIAN.
- **Cliente que Solicita Factura Deducible de Impuestos:**
  Si el cliente pide la factura a nombre de su empresa o personal para descontar renta:
  - Es **obligatorio** capturar: Nombre o Razón Social completa, Tipo y Número de Documento (NIT con dígito de verificación o Cédula) y un **correo electrónico válido** (a donde la DIAN y el sistema le entregarán el XML y PDF).

### B. La Regla de las 5 UVT (Tiquete POS vs Factura Electrónica)
- Desde la entrada en vigencia de la Resolución 001092 de 2022 y Resolución 000165 de 2023:
  - Si una cuenta o mesa supera las **5 UVT** (aproximadamente \$235.000 - \$250.000 COP) y el cliente solicita factura para efectos fiscales, **debe expedirse Factura Electrónica de Venta** obligatoriamente, ya que los tiquetes POS tradicionales por encima de ese monto no son deducibles de costos y gastos en la declaración de renta del cliente.

### C. Tratamiento de la Propina Voluntaria (Ley 1935 de 2018)
- La propina es una liberalidad del comensal destinada exclusivamente al personal de servicio.
- **Prohibición fiscal estricta:** La propina **NUNCA** hace parte de la base gravable del restaurante. En la factura debe mostrarse en un renglón separado y **no se le puede calcular ni sumar el 8% de INC ni el 19% de IVA**.

---

## 4. Consecuencias Legales por Incumplimiento
Según el **Artículo 657 del Estatuto Tributario**, expedir facturas sin los requisitos de ley o no facturar estando obligado acarrea:
- **Cierre del establecimiento de comercio** por un término de tres (3) días hábiles en la primera infracción.
- Sanción económica por cada factura emitida sin los requisitos técnicos (hasta el 1% del valor de las operaciones facturadas sin exceder 950 UVT).

---

## 5. Resumen de Decisión para Kike's Food

| ¿El Restaurante tiene Personería Jurídica o supera 3.500 UVT? | ¿El Cliente configuró su resolución y clave técnica en el panel? | Modo en Kike's Food |
| :---: | :---: | :--- |
| **NO** | No | **POS Local Estándar:** Comandas de cocina y tiquete de caja interno. Cero contacto con la DIAN. |
| **SÍ** | Sí | **Facturación Electrónica DIAN:** Botón en caja para emitir FE con CUFE, código QR y envío automático por correo. |
