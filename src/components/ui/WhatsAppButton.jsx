import { LEGAL_CONFIG } from '../../config/branding';

export default function WhatsAppButton() {
  return (
    <aside
      aria-label="Atención por WhatsApp"
      className="fixed bottom-5 right-5 z-40 print-hidden"
    >
      <a
        href={LEGAL_CONFIG.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hablar por WhatsApp con KGroup (+57 314 8316310)"
        className="group flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white pl-3.5 pr-4 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
      >
        {/* Ícono oficial de WhatsApp en SVG limpio */}
        <svg
          className="w-5 h-5 fill-current shrink-0"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24M8.53 7.33c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.02 0 1.19.87 2.34.99 2.5.12.16 1.7 2.6 4.12 3.65.58.25 1.02.4 1.38.52.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.47-.28-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.53.06-.24-.12-1.03-.38-1.96-1.21-.72-.65-1.21-1.45-1.35-1.69-.14-.24-.02-.37.1-.49.11-.11.24-.28.37-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42l-.47-.01z" />
        </svg>
        <span className="text-xs font-bold tracking-tight whitespace-nowrap">
          ¿Dudas? Escríbenos
        </span>
      </a>
    </aside>
  );
}
