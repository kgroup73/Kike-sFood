export const PAYMENT_METHODS = Object.freeze({
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta crédito/débito',
  transferencia: 'Transferencia / Nequi'
});

export const INVOICE_KINDS = Object.freeze({
  pos: 'Tiquete POS',
  electronica: 'Factura electrónica'
});

export const DIAN_STATUS = Object.freeze({
  no_aplica: { label: 'No aplica', tone: 'neutral' },
  simulado: { label: 'SIMULADO — sin validez fiscal', tone: 'warning' },
  pendiente: { label: 'Pendiente de envío', tone: 'warning' },
  aceptada: { label: 'Aceptada por la DIAN', tone: 'success' },
  rechazada: { label: 'Rechazada por la DIAN', tone: 'danger' }
});

export const TAX_TYPES = Object.freeze({
  INC: { label: 'Impuesto Nacional al Consumo (INC)', defaultRate: 8 },
  IVA: { label: 'IVA', defaultRate: 19 },
  NINGUNO: { label: 'No responsable de impuesto al consumo', defaultRate: 0 }
});

export const CONSUMIDOR_FINAL = Object.freeze({ name: 'Consumidor Final', docType: 'CC', docNumber: '222222222222' });

export const DOC_TYPES = ['CC', 'NIT', 'CE', 'PP', 'TI', 'NUIP'];
