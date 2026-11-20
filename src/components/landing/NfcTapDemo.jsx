import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Nfc, QrCode as QrIcon, Sparkles, RotateCcw, Smartphone, ExternalLink, CheckCircle2, ArrowRight } from 'lucide-react';
import Timbre from '../ui/Timbre';
import QrCode from '../ui/QrCode';
import { CartaScreen } from './Screens';

/**
 * Simulador interactivo de toque NFC en la mesa.
 * Emula la experiencia real: el comensal acerca el teléfono a la mesa,
 * el chip NFC responde con ondas de radiofrecuencia y la carta digital
 * se abre al instante en el navegador del teléfono.
 */
export default function NfcTapDemo({ url }) {
  // Pasos: 0: reposo (acercando), 1: contacto NFC (ondas), 2: carta abierta
  const [step, setStep] = useState(0);
  const [isAuto, setIsAuto] = useState(true);
  const timerRef = useRef(null);

  // Ciclo automático para dar vida continua a la landing
  useEffect(() => {
    if (!isAuto) return undefined;

    const runCycle = () => {
      // 0 -> 1 (contacto) a los 1.6s
      timerRef.current = setTimeout(() => {
        setStep(1);
        // 1 -> 2 (carta abierta) a los 1.2s después
        timerRef.current = setTimeout(() => {
          setStep(2);
          // 2 -> 0 (reinicia ciclo) a los 4.5s después
          timerRef.current = setTimeout(() => {
            setStep(0);
          }, 4500);
        }, 1200);
      }, 1600);
    };

    runCycle();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [step === 0, isAuto]);

  const handleManualTrigger = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsAuto(false);
    setStep(0);
    setTimeout(() => {
      setStep(1);
      setTimeout(() => {
        setStep(2);
        // Regresa al auto-loop tras un rato
        setTimeout(() => setIsAuto(true), 6000);
      }, 1200);
    }, 400);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Indicador de pasos interactivo */}
      <div className="flex items-center gap-2 mb-4 text-xs font-bold">
        <span
          className={`px-3 py-1 rounded-full transition-all ${
            step === 0
              ? 'bg-tinta text-mantel shadow-sm scale-105'
              : 'bg-mantel/70 text-suave border border-linea'
          }`}
        >
          1. Acerca celular
        </span>
        <span className="text-suave">→</span>
        <span
          className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
            step === 1
              ? 'bg-hoja text-sobre-hoja shadow-md scale-105 animate-pulse'
              : 'bg-mantel/70 text-suave border border-linea'
          }`}
        >
          <Nfc className="w-3 h-3" /> 2. Toque NFC
        </span>
        <span className="text-suave">→</span>
        <span
          className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
            step === 2
              ? 'bg-tinta text-mantel shadow-sm scale-105'
              : 'bg-mantel/70 text-suave border border-linea'
          }`}
        >
          <CheckCircle2 className="w-3 h-3 text-hoja" /> 3. Carta lista
        </span>
      </div>

      {/* Escenario de simulación */}
      <div className="relative w-full max-w-[340px] h-[400px] flex items-center justify-center select-none overflow-hidden rounded-2xl bg-mantel/30 p-2 border border-linea/60">
        {/* Mesa con Sticker físico real */}
        <div
          className={`absolute transition-all duration-700 ease-out ${
            step === 2
              ? 'scale-75 -translate-y-24 opacity-40 blur-[0.5px]'
              : 'scale-90 translate-y-4 opacity-100'
          }`}
        >
          <div className="relative w-[230px] h-[270px] rounded-3xl bg-plato border-2 border-tinta p-4 flex flex-col items-center justify-between text-center shadow-[0_20px_50px_-20px_rgb(30_43_36/0.3)]">
            <span className="inline-flex items-center gap-1.5 font-display font-extrabold text-base tracking-tight text-tinta">
              <Timbre className="w-5 h-5" /> Kike's
            </span>
            <span className="font-display font-extrabold text-3xl tracking-tight leading-none text-tinta">
              Mesa 4
            </span>

            {/* Zona objetivo del chip NFC */}
            <div className="relative w-full py-1.5 px-3 rounded-xl bg-hoja/10 border border-hoja/30 flex items-center justify-center gap-1.5 text-hoja font-bold text-xs tracking-wide">
              {/* Ondas concéntricas animadas durante el contacto (step === 1) */}
              {step === 1 && (
                <>
                  <span className="absolute inset-0 rounded-xl bg-hoja/30 animate-ping pointer-events-none" />
                  <span className="absolute -inset-4 rounded-2xl border-2 border-hoja/60 animate-nfc-ring pointer-events-none" />
                  <span className="absolute -inset-8 rounded-3xl border border-hoja/40 animate-nfc-ring [animation-delay:200ms] pointer-events-none" />
                </>
              )}
              <Nfc className="w-4 h-4 animate-pulse shrink-0" aria-hidden="true" />
              <span>Chip NFC Contactless</span>
            </div>

            <QrCode value={url} size={90} label="QR de Mesa 4" className="rounded-lg" />
            <span className="text-[10px] text-suave">Toca con NFC o escanea QR</span>
          </div>
        </div>

        {/* Teléfono inteligente interactivo */}
        <div
          className={`absolute transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] z-20 ${
            step === 0
              ? 'translate-y-[-70px] translate-x-12 rotate-[14deg] scale-90'
              : step === 1
              ? 'translate-y-[-10px] translate-x-0 rotate-0 scale-95 shadow-[0_0_35px_rgba(40,167,69,0.45)]'
              : 'translate-y-0 translate-x-0 rotate-0 scale-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)]'
          }`}
        >
          <div className="w-[240px] h-[360px] rounded-[36px] bg-tinta p-2 border border-mantel/20 text-mantel flex flex-col relative overflow-hidden">
            {/* Altavoz y cámara frontal */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-black/80 z-30 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-neutral-800" />
            </div>

            {/* Pantalla del teléfono */}
            <div className="w-full h-full rounded-[28px] overflow-hidden bg-mantel text-tinta flex flex-col relative">
              {/* Notificación flotante de lectura NFC (step === 1) */}
              <div
                className={`absolute top-8 inset-x-2 z-40 bg-tinta/95 text-mantel px-3 py-2 rounded-2xl shadow-xl border border-mantel/20 transition-all duration-300 flex items-center gap-2.5 text-left ${
                  step === 1
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-hoja flex items-center justify-center shrink-0 text-sobre-hoja shadow-sm">
                  <Nfc className="w-4 h-4 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-hoja uppercase tracking-wider">NFC Detectado</p>
                  <p className="text-xs font-bold truncate">La Trattoria · Mesa 4</p>
                  <p className="text-[9px] text-mantel/70">Abriendo carta digital...</p>
                </div>
              </div>

              {/* Contenido en pantalla: Reposo vs Carta digital */}
              {step < 2 ? (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-plato to-mantel select-none">
                  <span className="text-3xl font-display font-light text-suave/80">12:45</span>
                  <p className="text-[11px] text-suave mt-1">Viernes, 20 de noviembre</p>
                  <div className="mt-14 w-12 h-12 rounded-2xl bg-linea/60 flex items-center justify-center text-suave">
                    <Smartphone className="w-6 h-6 animate-bounce" />
                  </div>
                  <p className="text-xs font-bold text-tinta mt-3">Acerca a la mesa</p>
                  <p className="text-[10px] text-suave mt-0.5">La carta abrirá al tocar el NFC</p>
                </div>
              ) : (
                <div className="h-full flex flex-col animate-fadeIn">
                  <CartaScreen />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de control manual y enlace real */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
        <button
          type="button"
          onClick={handleManualTrigger}
          className="btn btn-sm btn-primary flex items-center gap-2 px-4 h-10 shadow-md text-xs active:scale-95 transition-transform"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Simular toque NFC</span>
        </button>

        <Link
          to="/r/la-trattoria/m/demo-mesa-4"
          className="btn btn-sm btn-quiet text-xs flex items-center gap-1.5 h-10 hover:text-tinta"
        >
          <span>Abrir carta real de Mesa 4</span>
          <ArrowRight className="w-3.5 h-3.5 text-hoja" />
        </Link>
      </div>

      <p className="mt-3 text-center text-xs text-suave max-w-xs leading-relaxed">
        El cliente solo acerca su celular con NFC o escanea el QR con la cámara. Cero descargas, cero fricción.
      </p>
    </div>
  );
}
