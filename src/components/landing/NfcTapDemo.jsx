import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Nfc, RotateCcw, CheckCircle2, ArrowRight, Wifi, Battery, Lock, Camera, Flashlight, Globe, Plus } from 'lucide-react';
import Timbre from '../ui/Timbre';
import QrCode from '../ui/QrCode';

/**
 * Simulador interactivo de toque NFC en la mesa.
 * - Sin artefactos visuales: chasis oscuro con ring sin fugas blancas.
 * - Sticker y teléfono posicionados con claridad para que el sticker no asome como líneas alrededor del móvil.
 * - Paso 0: Celular en reposo abajo con pantalla de bloqueo real.
 * - Paso 1: Celular sube ágilmente hacia la tarjeta (650ms).
 * - Paso 2: Toque NFC instantáneo con ondas y notificación nativa (850ms).
 * - Paso 3: Apertura de la carta digital real con platos visibles y cuenta recién iniciada (vacía).
 */
export default function NfcTapDemo({ url }) {
  // 0: reposo abajo, 1: subiendo a la mesa, 2: contacto NFC y notificación, 3: carta abierta
  const [step, setStep] = useState(0);
  const [isAuto, setIsAuto] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isAuto) return undefined;

    const runCycle = () => {
      // 0 -> 1: a los 600ms el teléfono sube decididamente hacia la tarjeta
      timerRef.current = setTimeout(() => {
        setStep(1);

        // El ascenso toma 650ms. Justo al llegar a la tarjeta:
        timerRef.current = setTimeout(() => {
          setStep(2); // ¡Contacto NFC! Ondas concéntricas y notificación emergente

          // Permanece en lectura NFC durante 850ms
          timerRef.current = setTimeout(() => {
            setStep(3); // Se abre la carta digital en el navegador

            // Mantiene la carta visible durante 3.2s antes de reiniciar el ciclo
            timerRef.current = setTimeout(() => {
              setStep(0);
            }, 3200);
          }, 850);
        }, 650);
      }, 600);
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
      setStep(1); // sube
      setTimeout(() => {
        setStep(2); // contacto y notificación
        setTimeout(() => {
          setStep(3); // abre carta
          setTimeout(() => setIsAuto(true), 4500);
        }, 850);
      }, 650);
    }, 150);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Indicador de pasos superior */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-4 text-[11px] sm:text-xs font-bold">
        <span
          className={`px-2.5 sm:px-3 py-1 rounded-full transition-all duration-200 ${
            step <= 1
              ? 'bg-tinta text-mantel shadow-sm scale-105'
              : 'bg-mantel/70 text-suave border border-linea'
          }`}
        >
          1. Acerca celular
        </span>
        <span className="text-suave">→</span>
        <span
          className={`px-2.5 sm:px-3 py-1 rounded-full transition-all duration-200 flex items-center gap-1 ${
            step === 2
              ? 'bg-hoja text-sobre-hoja shadow-md scale-105 animate-pulse'
              : 'bg-mantel/70 text-suave border border-linea'
          }`}
        >
          <Nfc className="w-3 h-3" /> 2. Toque NFC
        </span>
        <span className="text-suave">→</span>
        <span
          className={`px-2.5 sm:px-3 py-1 rounded-full transition-all duration-200 flex items-center gap-1 ${
            step === 3
              ? 'bg-tinta text-mantel shadow-sm scale-105'
              : 'bg-mantel/70 text-suave border border-linea'
          }`}
        >
          <CheckCircle2 className="w-3 h-3 text-hoja" /> 3. Carta lista
        </span>
      </div>

      {/* Escenario de simulación con máscara de overflow */}
      <div className="relative w-full max-w-[340px] h-[435px] flex items-center justify-center select-none overflow-hidden rounded-2xl bg-mantel/40 p-2 border border-linea/70 shadow-inner">
        {/* Mesa con Sticker físico real (en la parte superior de la mesa) */}
        <div
          className={`absolute transition-all duration-[650ms] ease-out z-10 ${
            step === 0
              ? '-translate-y-4 scale-95 opacity-100'
              : step === 3
              ? '-translate-y-[105px] scale-80 opacity-20 blur-[0.5px]'
              : '-translate-y-[85px] scale-90 opacity-100'
          }`}
        >
          <div className="relative w-[190px] h-[230px] rounded-3xl bg-plato border-2 border-tinta p-3 flex flex-col items-center justify-between text-center shadow-[0_16px_40px_-15px_rgb(30_43_36/0.25)]">
            <span className="inline-flex items-center gap-1.5 font-display font-extrabold text-xs tracking-tight text-tinta">
              <Timbre className="w-3.5 h-3.5" /> Kike's
            </span>
            <span className="font-display font-extrabold text-2xl tracking-tight leading-none text-tinta">
              Mesa 4
            </span>

            {/* Logo NFC táctil estratégico (limpio, sin caja ni aviso verde) */}
            <div className="relative my-0.5 flex items-center justify-center">
              {/* Ondas concéntricas animadas ÚNICAMENTE al hacer contacto (step === 2) */}
              {step === 2 && (
                <>
                  <span className="absolute w-8 h-8 rounded-full bg-hoja/30 animate-ping pointer-events-none" />
                  <span className="absolute w-12 h-12 rounded-full border-2 border-hoja/60 animate-nfc-ring pointer-events-none" />
                  <span className="absolute w-16 h-16 rounded-full border border-hoja/40 animate-nfc-ring [animation-delay:120ms] pointer-events-none" />
                </>
              )}
              <div className="w-7 h-7 rounded-full bg-mantel border border-linea/80 flex items-center justify-center text-tinta shadow-sm">
                <Nfc className="w-4 h-4 text-tinta shrink-0" aria-hidden="true" />
              </div>
            </div>

            <QrCode value={url} size={84} label="QR de Mesa 4" className="rounded-lg" />
            <span className="text-[9px] text-suave font-medium">Acerca tu móvil o escanea el QR</span>
          </div>
        </div>

        {/* Teléfono móvil: sube con elegancia y contacta el chip sin solaparse como línea accidental */}
        <div
          className={`absolute transition-all duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] z-20 rounded-[32px] ${
            step === 0
              ? 'translate-y-[280px] translate-x-2 rotate-[4deg] scale-90 opacity-75'
              : step === 3
              ? 'translate-y-[15px] translate-x-0 rotate-0 scale-100'
              : 'translate-y-[35px] translate-x-0 rotate-0 scale-95'
          }`}
        >
          {/* Chasis del smartphone con acabado grafito puro y esquinas redondeadas coincidentes con la sombra */}
          <div
            className={`w-[195px] h-[305px] rounded-[32px] bg-[#121614] p-2 ring-1 ring-white/10 flex flex-col relative overflow-hidden transition-shadow duration-[650ms] ${
              step === 2
                ? 'shadow-[0_0_35px_rgba(40,167,69,0.55)]'
                : step === 3
                ? 'shadow-[0_22px_55px_-12px_rgba(0,0,0,0.5)]'
                : 'shadow-2xl'
            }`}
          >
            {/* Pantalla del smartphone con fondo negro puro que elimina cualquier línea de antialiasing */}
            <div className="w-full h-full rounded-[24px] overflow-hidden bg-black text-tinta flex flex-col relative">
              {step < 3 ? (
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

                  {/* Notificación emergente al hacer contacto NFC (step === 2) */}
                  <div
                    className={`my-auto z-30 transition-all duration-200 ease-out ${
                      step === 2
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-90 translate-y-3 pointer-events-none'
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
                /* Pantalla de la carta abierta al escanear (Inmersiva, sin notch ni barra de URL) */
                <div className="h-full w-full flex flex-col bg-mantel text-tinta select-none overflow-hidden animate-fadeIn text-left">
                  {/* Cabecera del restaurante recién abierto */}
                  <div className="px-3 pt-3 pb-1.5 border-b border-linea/50 shrink-0">
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-hoja/10 text-hoja text-[8px] font-bold">
                      <span className="w-1 h-1 rounded-full bg-hoja animate-pulse" />
                      <span>Mesa 4 · pide desde aquí</span>
                    </div>
                    <h3 className="font-display font-extrabold text-[13px] leading-tight text-tinta truncate mt-0.5">
                      La Trattoria Gourmet
                    </h3>
                  </div>

                  {/* Categorías de la carta */}
                  <div className="px-3 py-1 flex items-center gap-1 border-b border-linea/40 shrink-0 overflow-x-hidden text-[9px]">
                    <span className="h-4 px-2 rounded-full bg-tinta text-mantel font-bold inline-flex items-center">
                      Entradas
                    </span>
                    <span className="h-4 px-2 rounded-full text-suave font-medium inline-flex items-center">
                      Fuertes
                    </span>
                    <span className="h-4 px-2 rounded-full text-suave font-medium inline-flex items-center">
                      Bebidas
                    </span>
                  </div>

                  {/* Lista de platos reales con fotos y botón + */}
                  <div className="flex-1 overflow-hidden px-3 py-1.5 space-y-2">
                    {/* Plato 1 */}
                    <div className="flex items-center gap-2 pb-1.5 border-b border-linea/40">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-bold text-[10px] leading-tight text-tinta truncate">
                          Tacos de Camarón al Pastor
                        </h4>
                        <p className="text-[8px] text-suave line-clamp-1 mt-0.5">Tortillas artesanales y piña</p>
                        <p className="font-bold text-[10px] text-tinta precio mt-0.5">$28.000</p>
                      </div>
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-linea/30 shadow-sm">
                        <img src="/dishes/tuna.jpg" alt="Tacos" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-hoja text-sobre-hoja flex items-center justify-center shadow">
                          <Plus className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      </div>
                    </div>

                    {/* Plato 2 */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-bold text-[10px] leading-tight text-tinta truncate">
                          Carpaccio di Wagyu A5
                        </h4>
                        <p className="text-[8px] text-suave line-clamp-1 mt-0.5">Láminas de Wagyu y Parmigiano</p>
                        <p className="font-bold text-[10px] text-tinta precio mt-0.5">$46.000</p>
                      </div>
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-linea/30 shadow-sm">
                        <img src="/dishes/carpaccio.jpg" alt="Carpaccio" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-hoja text-sobre-hoja flex items-center justify-center shadow">
                          <Plus className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      </div>
                    </div>
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
