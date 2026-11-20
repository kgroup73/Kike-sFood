import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Nfc, RotateCcw, CheckCircle2, ArrowRight, ArrowUp } from 'lucide-react';
import Timbre from '../ui/Timbre';
import QrCode from '../ui/QrCode';
import { CartaScreen } from './Screens';

/**
 * Simulador interactivo de toque NFC en la mesa.
 * El teléfono emerge desde abajo del recuadro (emulando la mano del cliente acercando
 * el móvil a la mesa), toca el chip NFC produciendo ondas y abre la carta digital.
 */
export default function NfcTapDemo({ url }) {
  // Pasos: 0: abajo en reposo, 1: sube y toca NFC, 2: carta abierta
  const [step, setStep] = useState(0);
  const [isAuto, setIsAuto] = useState(true);
  const timerRef = useRef(null);

  // Ciclo automático para dar vida continua
  useEffect(() => {
    if (!isAuto) return undefined;

    const runCycle = () => {
      // 0 -> 1 (sube y hace contacto con NFC) a los 1.8s
      timerRef.current = setTimeout(() => {
        setStep(1);
        // 1 -> 2 (carta abierta) a los 1.3s
        timerRef.current = setTimeout(() => {
          setStep(2);
          // 2 -> 0 (vuelve a bajar para reiniciar) a los 5s
          timerRef.current = setTimeout(() => {
            setStep(0);
          }, 5000);
        }, 1300);
      }, 1800);
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
        setTimeout(() => setIsAuto(true), 6500);
      }, 1300);
    }, 450);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Indicador de pasos superior */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-4 text-[11px] sm:text-xs font-bold">
        <span
          className={`px-2.5 sm:px-3 py-1 rounded-full transition-all ${
            step === 0
              ? 'bg-tinta text-mantel shadow-sm scale-105'
              : 'bg-mantel/70 text-suave border border-linea'
          }`}
        >
          1. Acerca celular
        </span>
        <span className="text-suave">→</span>
        <span
          className={`px-2.5 sm:px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
            step === 1
              ? 'bg-hoja text-sobre-hoja shadow-md scale-105 animate-pulse'
              : 'bg-mantel/70 text-suave border border-linea'
          }`}
        >
          <Nfc className="w-3 h-3" /> 2. Toque NFC
        </span>
        <span className="text-suave">→</span>
        <span
          className={`px-2.5 sm:px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
            step === 2
              ? 'bg-tinta text-mantel shadow-sm scale-105'
              : 'bg-mantel/70 text-suave border border-linea'
          }`}
        >
          <CheckCircle2 className="w-3 h-3 text-hoja" /> 3. Carta lista
        </span>
      </div>

      {/* Escenario de simulación con máscara de overflow */}
      <div className="relative w-full max-w-[340px] h-[420px] flex items-center justify-center select-none overflow-hidden rounded-2xl bg-mantel/40 p-2 border border-linea/70 shadow-inner">
        {/* Mesa con Sticker físico real (en el fondo) */}
        <div
          className={`absolute transition-all duration-700 ease-out z-10 ${
            step === 2
              ? '-translate-y-20 scale-85 opacity-50 blur-[0.4px]'
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
                  <span className="absolute -inset-8 rounded-3xl border border-hoja/40 animate-nfc-ring [animation-delay:200ms] pointer-events-none" />
                </>
              )}
              <Nfc className="w-3.5 h-3.5 animate-pulse shrink-0" aria-hidden="true" />
              <span>Chip NFC de la Mesa</span>
            </div>

            <QrCode value={url} size={85} label="QR de Mesa 4" className="rounded-lg" />
            <span className="text-[9px] text-suave">Acerca tu móvil o escanea el QR</span>
          </div>
        </div>

        {/* Teléfono móvil optimizado: emerge desde ABAJO */}
        <div
          className={`absolute transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] z-20 ${
            step === 0
              ? 'translate-y-[260px] translate-x-2 rotate-[4deg] scale-90 opacity-75'
              : step === 1
              ? 'translate-y-[25px] translate-x-0 rotate-0 scale-95 shadow-[0_0_35px_rgba(40,167,69,0.5)]'
              : 'translate-y-[15px] translate-x-0 rotate-0 scale-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)]'
          }`}
        >
          {/* Chasis del smartphone compacto y estilizado */}
          <div className="w-[200px] h-[310px] rounded-[32px] bg-tinta p-2 border border-mantel/20 text-mantel flex flex-col relative overflow-hidden">
            {/* Dynamic Island / Cámara */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-3.5 rounded-full bg-black/90 z-30 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
            </div>

            {/* Pantalla del smartphone */}
            <div className="w-full h-full rounded-[24px] overflow-hidden bg-mantel text-tinta flex flex-col relative">
              {/* Notificación flotante emergente al detectar el NFC */}
              <div
                className={`absolute top-6 inset-x-1.5 z-40 bg-tinta/95 text-mantel px-2.5 py-1.5 rounded-xl shadow-xl border border-mantel/20 transition-all duration-300 flex items-center gap-2 text-left ${
                  step === 1
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 -translate-y-3 scale-95 pointer-events-none'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-hoja flex items-center justify-center shrink-0 text-sobre-hoja shadow-sm">
                  <Nfc className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold text-hoja uppercase tracking-wider">NFC Detectado</p>
                  <p className="text-[11px] font-bold truncate">La Trattoria · Mesa 4</p>
                </div>
              </div>

              {/* Contenido en pantalla: Pantalla de bloqueo vs Carta abierta */}
              {step < 2 ? (
                <div className="h-full flex flex-col items-center justify-between py-6 px-3 text-center bg-gradient-to-b from-plato to-mantel select-none">
                  <div>
                    <span className="text-2xl font-display font-light text-suave/80">12:45</span>
                    <p className="text-[9px] text-suave">Viernes, 20 de noviembre</p>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 my-auto">
                    <div className="w-9 h-9 rounded-xl bg-linea/70 flex items-center justify-center text-tinta">
                      <ArrowUp className="w-5 h-5 animate-bounce text-hoja" />
                    </div>
                    <p className="text-[11px] font-bold text-tinta">Sube a la mesa</p>
                    <p className="text-[9px] text-suave">Toca el chip NFC</p>
                  </div>

                  <div className="w-12 h-1 rounded-full bg-tinta/30" />
                </div>
              ) : (
                <div className="h-full w-full overflow-hidden animate-fadeIn">
                  {/* CartaScreen escalada armoniosamente para el tamaño compacto */}
                  <div className="w-[125%] h-[125%] origin-top-left scale-[0.80]">
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
        El cliente acerca su celular desde la mano hacia la mesa y la carta se abre de inmediato.
      </p>
    </div>
  );
}
