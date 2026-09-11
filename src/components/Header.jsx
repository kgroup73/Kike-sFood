import React from 'react';
import {
  Utensils,
  QrCode,
  Flame,
  Receipt,
  Settings,
  Volume2,
  VolumeX,
  Bell,
  Zap
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
  posPendingCount,
  isNfcConnected = false,
  pendingWaiterCallsCount = 0
}) {
  return (
    <header className="bg-[#1e1b13]/95 backdrop-blur-md border-b border-[#383324] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-tr from-[#9b7e09] to-[#b8960e] rounded-xl flex items-center justify-center text-[#fdfcf7] shadow-lg shadow-[#9b7e09]/25 shrink-0 border border-[#b8960e]/30">
              <Utensils className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h1 className="font-extrabold text-sm sm:text-base leading-tight text-[#fdfcf7] truncate">{company.name}</h1>
              <div className="flex items-center space-x-1.5 text-[11px] text-[#857f5d]">
                <button
                  onClick={() => setIsGeoModalOpen(true)}
                  className="hover:underline flex items-center gap-1 font-bold text-[#e9e2ca] bg-[#14120c] px-2 py-0.5 rounded-md border border-[#383324] transition-all hover:border-[#b8960e]"
                  title="Cambiar de mesa o simular toque NFC"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isNfcConnected ? 'bg-amber-400' : 'bg-emerald-500'} animate-pulse`}></span>
                  <span>Mesa <strong className="text-[#b8960e]">{tableNumber}</strong></span>
                  {isNfcConnected && <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />}
                </button>
                <span>•</span>
                <span className="text-[10px] text-[#857f5d]">
                  {isNfcConnected ? 'NFC Enlazado ⚡' : 'Carta Digital'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="sm:hidden p-2 text-[#857f5d] hover:text-[#fdfcf7] bg-[#2c271d] rounded-xl border border-[#383324]"
            title={soundEnabled ? "Silenciar sonido" : "Activar sonido"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#9b7e09]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-[#14120c] p-1 rounded-xl border border-[#383324] text-[11px] font-semibold w-full sm:w-auto overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setCurrentRole('client')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                currentRole === 'client'
                  ? 'bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] shadow-md shadow-[#9b7e09]/20'
                  : 'text-[#857f5d] hover:text-[#e9e2ca]'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" /> <span>Cliente</span>
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
              onClick={() => setCurrentRole('pos')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial justify-center relative ${
                currentRole === 'pos'
                  ? 'bg-gradient-to-r from-[#9b7e09] to-[#b8960e] text-[#fdfcf7] shadow-md shadow-[#9b7e09]/20'
                  : 'text-[#857f5d] hover:text-[#e9e2ca]'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" /> <span>Caja POS</span>
              {pendingWaiterCallsCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[9px] px-1.5 py-0.2 rounded-full font-black ml-1 animate-pulse flex items-center gap-0.5">
                  <Bell className="w-2.5 h-2.5" /> {pendingWaiterCallsCount}
                </span>
              )}
              {posPendingCount > 0 && (
                <span className="bg-emerald-500 text-white text-[9px] px-1 py-0.2 rounded-full font-bold ml-1">{posPendingCount}</span>
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
