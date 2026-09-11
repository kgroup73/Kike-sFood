import React, { useState } from 'react';
import { Lock, KeyRound, X, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const verifyPin = (code) => {
    // PIN de staff configurable (por defecto 1234 para demo y pilotos)
    const storedPin = localStorage.getItem('kikes_staff_pin') || '1234';
    if (code === storedPin) {
      sessionStorage.setItem('kikes_staff_auth', 'true');
      onLoginSuccess();
      onClose();
    } else {
      setError('PIN de acceso incorrecto');
      setTimeout(() => setPin(''), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#1e1b13] border border-[#383324] text-[#fdfcf7] w-full max-w-xs sm:max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl relative space-y-4">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-[#2c271d] text-[#857f5d] hover:text-[#fdfcf7] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9b7e09] to-[#b8960e] mx-auto flex items-center justify-center shadow-lg shadow-[#9b7e09]/30 text-[#fdfcf7]">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-black text-lg text-[#fdfcf7]">Acceso de Personal</h3>
          <p className="text-[11px] text-[#857f5d]">
            Ingresa el PIN de 4 dígitos para acceder al monitor KDS, Caja POS o Administración.
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center items-center gap-3 py-2">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-[#b8960e] scale-110 shadow-md shadow-[#9b7e09]/50'
                  : 'bg-[#2c271d] border border-[#383324]'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-xs font-bold text-rose-400 animate-shake">
            {error}
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(String(num))}
              className="py-3 rounded-2xl bg-[#14120c] hover:bg-[#2c271d] active:scale-95 text-base font-black text-[#e9e2ca] border border-[#2c271d] transition-all"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin('')}
            className="py-3 rounded-2xl bg-[#14120c] hover:bg-rose-950/30 text-xs font-bold text-[#857f5d] hover:text-rose-400 border border-[#2c271d] transition-all"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="py-3 rounded-2xl bg-[#14120c] hover:bg-[#2c271d] active:scale-95 text-base font-black text-[#e9e2ca] border border-[#2c271d] transition-all"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="py-3 rounded-2xl bg-[#14120c] hover:bg-[#2c271d] active:scale-95 text-xs font-bold text-[#857f5d] hover:text-[#e9e2ca] border border-[#2c271d] transition-all"
          >
            ⌫
          </button>
        </div>

        <div className="text-center pt-1 border-t border-[#2c271d]">
          <span className="text-[10px] text-[#857f5d]">
            PIN por defecto en etapa piloto: <strong className="text-[#b8960e]">1234</strong>
          </span>
        </div>

      </div>
    </div>
  );
}
