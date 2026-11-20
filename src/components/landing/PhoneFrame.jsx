import { Wifi, Battery } from 'lucide-react';

/** Marco de celular para las maquetas del landing. Decorativo: el contenedor que lo usa lleva el texto alternativo. */
export default function PhoneFrame({ children, className = '', screenClassName = 'bg-mantel', statusTone = 'dark' }) {
  return (
    <div className={`rounded-[44px] bg-tinta p-[10px] shadow-[0_30px_80px_-30px_rgb(30_43_36/0.45)] ${className}`}>
      <div className={`relative h-full rounded-[34px] overflow-hidden ${screenClassName}`}>
        {/* Header con hora, wifi y batería para realismo sin notch */}
        <div
          className={`absolute top-0 inset-x-0 z-30 px-5 pt-2.5 pb-1 flex items-center justify-between text-[11px] font-semibold tracking-tight select-none pointer-events-none ${
            statusTone === 'light' ? 'text-white/90' : 'text-tinta/80'
          }`}
          aria-hidden="true"
        >
          <span>9:41</span>
          <div className="flex items-center gap-1.5 opacity-80">
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
