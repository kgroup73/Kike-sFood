import React from 'react';
import {
  Utensils,
  QrCode,
  Flame,
  Receipt,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';

export default function Header({
  currentRole,
  setCurrentRole,
  company,
  tableNumber,
  isInsidePremises,
  setIsGeoModalOpen,
  soundEnabled,
  setSoundEnabled,
  kitchenActiveCount,
  posPendingCount
}) {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h1 className="font-extrabold text-sm sm:text-base leading-tight text-white truncate">{company.name}</h1>
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                <span className="font-bold">Mesa <strong className="text-orange-500">{tableNumber}</strong></span>
                <span>•</span>
                <button onClick={() => setIsGeoModalOpen(true)} className="hover:underline flex items-center gap-1 font-medium">
                  <span className={`w-1.5 h-1.5 rounded-full ${isInsidePremises ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></span>
                  <span>{isInsidePremises ? 'En local' : 'Fuera'}</span>
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="sm:hidden p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-xl border border-slate-700/60"
            title={soundEnabled ? "Silenciar sonido" : "Activar sonido"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-500" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-[11px] font-semibold w-full sm:w-auto overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setCurrentRole('client')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial justify-center ${currentRole === 'client' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <QrCode className="w-3.5 h-3.5" /> <span>Cliente</span>
            </button>

            <button
              onClick={() => setCurrentRole('kitchen')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial justify-center relative ${currentRole === 'kitchen' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <Flame className="w-3.5 h-3.5" /> <span>Cocina</span>
              {kitchenActiveCount > 0 && (
                <span className="bg-rose-500 text-white text-[9px] px-1 py-0.2 rounded-full font-bold ml-1">{kitchenActiveCount}</span>
              )}
            </button>

            <button
              onClick={() => setCurrentRole('pos')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial justify-center relative ${currentRole === 'pos' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <Receipt className="w-3.5 h-3.5" /> <span>Caja POS</span>
              {posPendingCount > 0 && (
                <span className="bg-emerald-500 text-white text-[9px] px-1 py-0.2 rounded-full font-bold ml-1">{posPendingCount}</span>
              )}
            </button>

            <button
              onClick={() => setCurrentRole('config')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial justify-center ${currentRole === 'config' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <Settings className="w-3.5 h-3.5" /> <span>Admin</span>
            </button>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="hidden sm:flex p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"
            title={soundEnabled ? "Silenciar sonido" : "Activar sonido"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-500" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </header>
  );
}
