import { useRef } from 'react';
import PhoneFrame from './PhoneFrame';
import { CartaScreen, PlatoScreen, PedidoScreen } from './Screens';
import { useScrollProgress } from './useScrollProgress';

/**
 * Tres momentos de la carta en el celular del comensal: la lista al frente, el detalle de
 * un plato y el pedido a los lados. Al bajar por la página, los celulares de los lados se
 * abren en abanico y el del centro sube (`--p`, ver useScrollProgress). Cada transformación
 * va en su propio contenedor: la entrada (animate-rise), el abanico y la posición fija.
 */
export default function HeroDevices() {
  const ref = useRef(null);
  useScrollProgress(ref, { start: 0.75, end: 0 });
  return (
    <div
      ref={ref}
      role="img"
      aria-label="Tres pantallas de la carta en el celular del comensal: la lista de platos con fotos, el detalle de un plato con sus opciones y el pedido listo para enviar a la cocina"
      className="relative h-[460px] sm:h-[500px] lg:h-[580px] mt-10 sm:mt-14 [--p:0]"
    >
      <div className="absolute inset-x-0 top-0 flex items-start justify-center">
        <div className="hidden sm:block animate-rise [animation-delay:120ms]">
          <div className="hero-fan-left">
            <div className="w-[250px] lg:w-[290px] h-[480px] lg:h-[560px] translate-x-10 translate-y-10">
              <PhoneFrame className="h-full">
                <PlatoScreen />
              </PhoneFrame>
            </div>
          </div>
        </div>
        <div className="relative z-10 animate-rise">
          <div className="hero-fan-center">
            <div className="w-[270px] lg:w-[320px] h-[540px] lg:h-[620px]">
              <PhoneFrame className="h-full">
                <CartaScreen />
              </PhoneFrame>
            </div>
          </div>
        </div>
        <div className="hidden sm:block animate-rise [animation-delay:200ms]">
          <div className="hero-fan-right">
            <div className="w-[250px] lg:w-[290px] h-[480px] lg:h-[560px] -translate-x-10 translate-y-10">
              <PhoneFrame className="h-full">
                <PedidoScreen />
              </PhoneFrame>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
