import { PROJECT_LOGO, PROJECT_NAME } from '../../config/branding';

export default function BrandMark({ size = 'md', showName = true }) {
  const box = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11 sm:w-12 sm:h-12';
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className={`${box} rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-light flex items-center justify-center shadow-lg shadow-brand-gold/30 shrink-0 border border-brand-gold-light/40 overflow-hidden`}>
        <img src={PROJECT_LOGO} alt="" className="w-full h-full object-cover" />
      </div>
      {showName && <span className="font-extrabold text-lg sm:text-xl text-brand-ivory truncate">{PROJECT_NAME}</span>}
    </div>
  );
}
