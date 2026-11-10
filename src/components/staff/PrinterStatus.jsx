import { Link } from 'react-router-dom';
import { Printer, AlertTriangle } from 'lucide-react';
import { useOrderPrinter } from '../../hooks/useOrderPrinter';

/** Corre la impresión en segundo plano y muestra en el encabezado que este equipo imprime. */
export default function PrinterStatus({ tenant }) {
  const { error, printed } = useOrderPrinter(tenant, { enabled: true });
  return (
    <Link
      to={`/staff/${tenant.slug}/admin/cocina`}
      title={error ? `Error al imprimir: ${error}` : `Este equipo imprime las comandas${printed ? ` (${printed} en esta sesión)` : ''}`}
      className={`hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full text-xs font-bold ${error ? 'bg-aji text-white' : 'bg-hoja/10 text-hoja'}`}
    >
      {error ? <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> : <Printer className="w-3.5 h-3.5" aria-hidden="true" />}
      {error ? 'Impresora con error' : 'Imprime comandas'}
    </Link>
  );
}
