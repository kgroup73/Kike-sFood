import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Nfc, RotateCcw, CheckCircle2, ArrowRight, Wifi, Battery, Lock, Camera, Flashlight, Globe } from 'lucide-react';
import Timbre from '../ui/Timbre';
import QrCode from '../ui/QrCode';
import { CartaScreen } from './Screens';

/**
 * Simulador interactivo de toque NFC en la mesa.
 * Emula fielmente la pantalla de un smartphone real: pantalla de bloqueo con reloj y estado,
 * toque con el chip NFC de la mesa, notificación nativa de sistema y apertura inmediata
 * de la carta digital en el navegador móvil.
 */
export default function NfcTapDemo({ url }) {
  // Pasos: 0: reposo abajo, 1: contacto NFC y notificación, 2: carta abierta en navegador
  const [step, setStep] = useState(0);
  const [isAuto, setIsAuto] = useState(true);
  const timerRef = useRef(null);

  // Ciclo automático calibrado: dinámico, fluido y con tiempo justo para apreciar cada momento
  useEffect(() => {
    if (!isAuto) return undefined;

    const runCycle = () => {
      // 0 -> 1: el teléfono sube de forma fluida hacia el chip NFC a los 1.4s
      timerRef.current = setTimeout(() => {
        setStep(1);
        // 1 -> 2: toque NFC registrado, surge notificación y abre la carta a los 1.2s
        timerRef.current = setTimeout(() => {
          setStep(2);
          // 2 -> 0: carta visible para lectura por 4.2s antes de reiniciar el ciclo
          timerRef.current = setTimeout(() => {
            setStep(0);
          }, 4200);
        }, 1200);
      }, 1400);
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
        setTimeout(() => setIsAuto(true), 5500);
      }, 1200);
    }, 250);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Indicador de pasos superior */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-4 text-[11px] sm:text-xs font-bold">
        <span
          className={`px-2.5 sm:px-3 py-1 rounded-full transition-all duration-300 ${
            step === 0
              ? 'bg-tinta text-mantel shadow-sm scale-105'
              : 'bg-mantel/70 text-suave border border-linea'
          }`}
        >
          1. Acerca celular
        </span>
        <span className="text-suave">→</span>
        <span
          className={`px-2.5 sm:px-3 py-1 rounded-full transition-all duration-300 flex items-center gap-1 ${
            step === 1
              ? 'bg-hoja text-sobre-hoja shadow-md scale-105 animate-pulse'
              : 'bg-mantel/70 text-suave border border-linea'
          }`}
        >
          <Nfc className="w-3 h-3" /> 2. Toque NFC
        </span>
        <span className="text-suave">→</span>
        <span
          className={`px-2.5 sm:px-3 py-1 rounded-full transition-all duration-300 flex items-center gap-1 ${
            step === 2
              ? 'bg-tinta text-mantel shadow-sm scale-105'
              : 'bg-mantel/70 text-suave border border-linea'
          }`}
        >
          <CheckCircle2 className="w-3 h-3 text-hoja" /> 3. Carta lista
        </span>
      </div>

      {/* Escenario de simulación con máscara de overflow */}
      <div className="relative w-full max-w-[340px] h-[415px] flex items-center justify-center select-none overflow-hidden rounded-2xl bg-mantel/40 p-2 border border-linea/70 shadow-inner">
        {/* Mesa con Sticker físico real (en el fondo) */}
        <div
          className={`absolute transition-all duration-1000 ease-out z-10 ${
            step === 2
              ? '-translate-y-20 scale-85 opacity-40 blur-[0.3px]'
              : '-translate-y-6 scale-95 opacity-100'
          }`}
        >
          <div className="relative w-[210px] h-[260px] rounded-3xl bg-plato border-2 border-tinta p-3.5 flex flex-col items-center justify-between text-center shadow-[0_16px_45px_-15px_rgb(30_43_36/0.28)]">
            <span className="inline-flex items-center gap-1.5 font-display font-extrabold text-sm tracking-tight text-tinta">
              <Timbre className="w-4 h-4" /> Kike's
            </span>
            <span className="font-display font-extrabold text-2xl tracking-tight leading-none text-tinta">
              Mesa 4
            </span>

            {/* Chip NFC objetivo en el sticker */}
            <div className="relative w-full py-1 px-2 rounded-xl bg-hoja/10 border border-hoja/30 flex items-center justify-center gap-1.5 text-hoja font-bold text-[11px] tracking-wide">
              {/* Ondas concéntricas animadas durante el contacto (step === 1) */}
              {step === 1 && (
                <>
                  <span className="absolute inset-0 rounded-xl bg-hoja/30 animate-ping pointer-events-none" />
                  <span className="absolute -inset-4 rounded-2xl border-2 border-hoja/60 animate-nfc-ring pointer-events-none" />
                  <span className="absolute -inset-8 rounded-3xl border border-hoja/40 animate-nfc-ring [animation-delay:150ms] pointer-events-none" />
                </>
              )}
              <Nfc className="w-3.5 h-3.5 animate-pulse shrink-0" aria-hidden="true" />
              <span>Chip NFC de la Mesa</span>
            </div>

            <QrCode value={url} size={85} label="QR de Mesa 4" className="rounded-lg" />
            <span className="text-[9px] text-suave">Acerca tu móvil o escanea el QR</span>
          </div>
        </div>

        {/* Teléfono móvil: sube fluidamente desde ABAJO */}
        <div
          className={`absolute transition-all duration-1000 ease-[cubic-bezier(0.2,1,0.3,1)] z-20 ${
            step === 0
              ? 'translate-y-[280px] translate-x-2 rotate-[4deg] scale-90 opacity-75'
              : step === 1
              ? 'translate-y-[25px] translate-x-0 rotate-0 scale-95 shadow-[0_0_35px_rgba(40,167,69,0.55)]'
              : 'translate-y-[15px] translate-x-0 rotate-0 scale-100 shadow-[0_22px_55px_-12px_rgba(0,0,0,0.45)]'
          }`}
        >
          {/* Chasis del smartphone realista */}
          <div className="w-[200px] h-[310px] rounded-[32px] bg-tinta p-2 border border-mantel/20 text-mantel flex flex-col relative overflow-hidden">
            {/* Dynamic Island / Cámara */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-3.5 rounded-full bg-black/90 z-30 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
            </div>

            {/* Pantalla del smartphone */}
            <div className="w-full h-full rounded-[24px] overflow-hidden bg-mantel text-tinta flex flex-col relative">
              {step < 2 ? (
                /* Pantalla de bloqueo real de smartphone */
                <div className="h-full flex flex-col justify-between p-3 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 text-white select-none relative overflow-hidden">
                  {/* Resplandores ambientales de wallpaper */}
                  <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-hoja/20 blur-xl pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-maracuya/15 blur-xl pointer-events-none" />

                  {/* Status Bar */}
                  <div className="flex items-center justify-between text-[9px] text-white/80 px-1 pt-0.5 z-10 font-semibold tracking-tight">
                    <span>9:41</span>
                    <div className="flex items-center gap-1 text-white/70">
                      <Wifi className="w-2.5 h-2.5" />
                      <Battery className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Reloj y Fecha estilo iOS/Android */}
                  <div className="flex flex-col items-center mt-2 z-10">
                    <Lock className="w-2.5 h-2.5 text-white/40 mb-1" />
                    <span className="text-3xl font-display font-light tracking-tight text-white leading-none">
                      09:41
                    </span>
                    <p className="text-[9px] text-white/60 mt-1 capitalize font-medium">
                      Viernes, 20 de noviembre
                    </p>
                  </div>

                  {/* Notificación flotante de sistema al hacer contacto NFC (step === 1) */}
                  <div
                    className={`my-auto z-30 transition-all duration-300 ease-out ${
                      step === 1
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-90 translate-y-2 pointer-events-none'
                    }`}
                  >
                    <div className="bg-neutral-800/95 backdrop-blur-md text-white p-2 rounded-xl border border-white/20 shadow-2xl flex items-center gap-2 text-left">
                      <div className="w-6 h-6 rounded-lg bg-hoja flex items-center justify-center shrink-0 text-sobre-hoja shadow-sm">
                        <Nfc className="w-3.5 h-3.5 animate-pulse" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-bold text-hoja uppercase tracking-wider">Etiqueta NFC</span>
                          <span className="text-[7px] text-white/40">Ahora</span>
                        </div>
                        <p className="text-[10px] font-bold truncate text-white leading-tight">La Trattoria · Mesa 4</p>
                        <p className="text-[8px] text-white/60 truncate flex items-center gap-0.5">
                          <Globe className="w-2 h-2 text-hoja" /> kikes.app
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Accesos directos inferiores de la pantalla de bloqueo */}
                  <div className="flex items-center justify-between px-1.5 pb-0.5 z-10 text-white/60">
                    <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                      <Flashlight className="w-3 h-3" />
                    </div>
                    <div className="w-12 h-1 rounded-full bg-white/30" />
                    <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                      <Camera className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ) : (
                /* Pantalla de Navegador con Carta abierta */
                <div className="h-full w-full flex flex-col bg-mantel overflow-hidden animate-fadeIn">
                  {/* Barra de dirección URL de navegador móvil */}
                  <div className="h-5 bg-plato border-b border-linea/60 flex items-center justify-center px-2 shrink-0 text-[8px] text-suave gap-1 font-mono">
                    <span className="text-hoja text-[7px]">🔒</span>
                    <span className="truncate">kikes.app/r/la-trattoria/m/4</span>
                  </div>

                  {/* CartaScreen en vivo escalada */}
                  <div className="flex-1 min-h-0 w-[125%] h-[125%] origin-top-left scale-[0.80] overflow-hidden">
                    <CartaScreen />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Botón manual para probar en video y enlace directo */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full">
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
          <span>Abrir carta de Mesa 4</span>
          <ArrowRight className="w-3.5 h-3.5 text-hoja" />
        </Link>
      </div>

      <p className="mt-3 text-center text-xs text-suave max-w-xs leading-relaxed">
        El cliente acerca su celular hacia la mesa y el navegador abre la carta al instante.
      </p>
    </div>
  );
}
