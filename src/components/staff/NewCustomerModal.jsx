import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import Modal from '../ui/Modal';
import { DOC_TYPES } from '../../lib/billing';

const input = 'field';

export default function NewCustomerModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', docType: 'CC', docNumber: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const valid = form.name.trim() && form.docNumber.trim().length >= 3;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Registrar cliente" icon={<UserPlus />} onClose={onClose} size="sm">
      <form onSubmit={submit} className="space-y-3">
        <input aria-label="Nombre o razón social" placeholder="Nombre completo / Razón social" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
        <div className="flex gap-2">
          <select aria-label="Tipo de documento" value={form.docType} onChange={(e) => setForm({ ...form, docType: e.target.value })} className={`${input} !w-28`}>
            {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input aria-label="Número de documento" placeholder="Número de documento" value={form.docNumber} onChange={(e) => setForm({ ...form, docNumber: e.target.value.replace(/[^0-9A-Za-z-]/g, '') })} className={input} />
        </div>
        <input type="email" aria-label="Correo electrónico" placeholder="Correo (para factura electrónica)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
        <input aria-label="Teléfono" placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
        <button disabled={!valid || saving} className="btn btn-primary w-full mt-2">
          {saving ? 'Guardando…' : 'Guardar cliente'}
        </button>
      </form>
    </Modal>
  );
}
