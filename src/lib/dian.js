/**
 * Utilidades para Facturación Electrónica DIAN Colombia y formateo de moneda.
 */

/**
 * Formatea un valor numérico a pesos colombianos (COP).
 * @param {number} val
 * @returns {string}
 */
export const formatCOP = (val) => '$' + Math.round(val || 0).toLocaleString('es-CO');

/**
 * Simula la generación de un Código Único de Factura Electrónica (CUFE) de 40 caracteres hexadecimales.
 * @param {string} invoiceNum
 * @param {string} date
 * @param {number} total
 * @param {string} nit
 * @returns {string}
 */
export const generateCUFE = (invoiceNum, date, total, nit) => {
  let hash = '';
  const characters = 'abcdef0123456789';
  for (let i = 0; i < 40; i++) {
    hash += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return hash;
};

/**
 * Calcula impuestos (IVA o Impuesto Nacional al Consumo - INC) y totales.
 * @param {number} subtotal
 * @param {number} taxRate
 * @returns {{subtotal: number, tax: number, total: number}}
 */
export const calculateTaxes = (subtotal, taxRate = 8) => {
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
};
