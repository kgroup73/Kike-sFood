import React from 'react';
import {
  QrCode,
  Flame,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';

export default function Header({
  currentRole,
  setCurrentRole,
  company,
  soundEnabled,
  setSoundEnabled,
  kitchenActiveCount = 0
}) {
  const initials = company.name
    .split(' ')
    .filter((w) => /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <header className="bg-[#1e1b13]/95 backdrop-blur-md border-b border-[#383324] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        
        {/* Left: Branding & Logo */}
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#9b7e09] to-[#b8960e] flex items-center justify-center text-[#fdfcf7] shadow-lg shadow-[#9b7e09]/30 shrink-0 border border-[#b8960e]/40">
              <span className="font-extrabold text-base sm:text-xl tracking-wider leading-none">{initials}</span>
            </div>
            <h1 className="font-extrabold text-lg sm:text-2xl leading-tight text-[#fdfcf7] truncate">
              {company.name}
            </h1>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="sm:hidden p-2 text-[#857f5d] hover:text-[#fdfcf7] bg-[#2c271d] rounded-xl border border-[#383324]"
            title={soundEnabled ? "Silenciar sonido" : "Activar sonido"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#9b7e09]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Right: Role Switcher */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <div className="flex items-center bg-[#14120c] p-1 rounded-xl border border-[#383324] text-[11px] font-semibold w-full sm:w-auto overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setCurrentRole('client')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                  currentRole === 'client'
                    ? 'bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] shadow-md shadow-[#9b7e09]/20'
                    : 'text-[#857f5d] hover:text-[#e9e2ca]'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" /> <span>Menú</span>
              </button>

              <button
                onClick={() => setCurrentRole('kitchen')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial justify-center relative ${
                  currentRole === 'kitchen'
                    ? 'bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] shadow-md shadow-[#9b7e09]/20'
                    : 'text-[#857f5d] hover:text-[#e9e2ca]'
                }`}
              >
                <Flame className="w-3.5 h-3.5" /> <span>Cocina</span>
                {kitchenActiveCount > 0 && (
                  <span className="bg-rose-500 text-white text-[9px] px-1 py-0.2 rounded-full font-bold ml-1">{kitchenActiveCount}</span>
                )}
              </button>

              <button
                onClick={() => setCurrentRole('config')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                  currentRole === 'config'
                    ? 'bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] shadow-md shadow-[#9b7e09]/20'
                    : 'text-[#857f5d] hover:text-[#e9e2ca]'
                }`}
              >
                <Settings className="w-3.5 h-3.5" /> <span>Admin</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="hidden sm:flex p-2 bg-[#2c271d] hover:bg-[#383324] text-[#857f5d] hover:text-[#fdfcf7] rounded-xl border border-[#383324]"
            title={soundEnabled ? "Silenciar sonido" : "Activar sonido"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#9b7e09]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </header>
  );
}
