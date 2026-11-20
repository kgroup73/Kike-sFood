import LegalLayout from './LegalLayout';
import { PROJECT_NAME, MAKER_NAME, LEGAL_CONFIG } from '../../config/branding';

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Política de Cookies y Almacenamiento Local"
      subtitle="Explicación transparente sobre cómo y para qué utilizamos el almacenamiento local en su navegador al usar Kike's Food."
      badge="Cookies & LocalStorage"
    >
      <section>
        <h2>1. ¿Qué tecnologías utilizamos?</h2>
        <p>
          En <strong>{PROJECT_NAME}</strong>, priorizamos la ligereza, la velocidad y su privacidad. En lugar de utilizar redes invasivas de rastreo de terceros, nuestra aplicación web utiliza tecnologías de almacenamiento local del navegador estándar provistas por HTML5 (principalmente <strong>localStorage</strong> y <strong>sessionStorage</strong>), así como cookies técnicas de primera parte estrictamente necesarias.
        </p>
        <div className="p-4 rounded-xl bg-hoja/10 border border-hoja/30 text-tinta my-4">
          <p className="font-semibold text-sm">
            Compromiso de Privacidad Cero Rastreo:
          </p>
          <p className="text-xs sm:text-sm text-suave mt-1">
            <strong>{PROJECT_NAME} no utiliza cookies de publicidad comportamental, ni redes publicitarias de terceros, ni vende historiales de navegación a anunciantes.</strong> Todo el almacenamiento utilizado tiene un propósito técnico y operativo directo.
          </p>
        </div>
      </section>

      <section>
        <h2>2. Detalle de Llaves y Almacenamiento Utilizado</h2>
        <p>
          A continuación, detallamos de forma exhaustiva las llaves técnicas que la Plataforma almacena en su dispositivo:
        </p>

        <div className="overflow-x-auto my-6 border border-linea rounded-xl bg-plato">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-mantel border-b border-linea text-tinta font-bold">
                <th className="py-3 px-4">Llave / Identificador</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Finalidad Operativa</th>
                <th className="py-3 px-4">Duración</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linea">
              <tr>
                <td className="py-3 px-4 font-mono font-semibold text-hoja">kikes_cookie_consent</td>
                <td className="py-3 px-4">localStorage</td>
                <td className="py-3 px-4">Recuerda que el usuario ya leyó y aceptó el aviso informativo para no volver a mostrar el banner inferior.</td>
                <td className="py-3 px-4">Persistente (hasta limpieza manual)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-semibold text-hoja">kikes_cart_draft / pedido activo</td>
                <td className="py-3 px-4">sessionStorage / local</td>
                <td className="py-3 px-4">Preserva los platos y notas que el comensal agregó en su mesa para que no se pierdan si se recarga la página.</td>
                <td className="py-3 px-4">Sesión de mesa / temporal</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-semibold text-hoja">kikes_staff_token</td>
                <td className="py-3 px-4">localStorage / cookie segura</td>
                <td className="py-3 px-4">Mantiene la sesión de trabajo autenticada del personal de cocina, caja o administración durante su turno.</td>
                <td className="py-3 px-4">Duración del turno laboral o cierre de sesión</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-semibold text-hoja">kikes_theme</td>
                <td className="py-3 px-4">localStorage</td>
                <td className="py-3 px-4">Guarda la preferencia visual o contraste seleccionada por el usuario en su pantalla.</td>
                <td className="py-3 px-4">Persistente</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-semibold text-hoja">kikes_demo_*</td>
                <td className="py-3 px-4">localStorage</td>
                <td className="py-3 px-4">Alberga los datos de simulación interactiva cuando se navega en modo demostración.</td>
                <td className="py-3 px-4">Hasta reinicio de demo o limpieza</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>3. Base Legal del Uso de Almacenamiento Técnico</h2>
        <p>
          De conformidad con las mejores prácticas internacionales (como la Directiva ePrivacy y el RGPD) y la normatividad de la Superintendencia de Industria y Comercio (SIC):
        </p>
        <p>
          Las cookies y elementos de almacenamiento local estrictamente necesarios para la transmisión de comunicaciones o la prestación de un servicio expresamente solicitado por el usuario (como visualizar la carta de la mesa que visita, procesar su pedido o autenticar al cajero) <strong>no requieren consentimiento previo para el funcionamiento esencial</strong>. No obstante, en {PROJECT_NAME} informamos de manera abierta y transparente su propósito.
        </p>
      </section>

      <section>
        <h2>4. ¿Cómo eliminar o gestionar el almacenamiento local?</h2>
        <p>
          Usted tiene pleno control en todo momento. Puede revisar, borrar o bloquear los datos almacenados en su navegador siguiendo estos pasos según su aplicación:
        </p>
        <ul>
          <li>
            <strong>Google Chrome (Android / iOS / Escritorio):</strong> Ingrese a <em>Configuración &gt; Privacidad y seguridad &gt; Borrar datos de navegación</em> y seleccione "Cookies y otros datos de sitios web".
          </li>
          <li>
            <strong>Apple Safari (iPhone / iPad / Mac):</strong> Vaya a <em>Ajustes &gt; Safari &gt; Avanzado &gt; Datos de sitios web</em> y seleccione "Eliminar todos los datos".
          </li>
          <li>
            <strong>Mozilla Firefox:</strong> Diríjase a <em>Ajustes &gt; Privacidad y seguridad &gt; Cookies y datos del sitio &gt; Limpiar datos</em>.
          </li>
        </ul>
        <p className="text-xs text-suave italic">
          Nota: Si elimina el almacenamiento local mientras está realizando un pedido en mesa, la lista de platos añadidos a su carrito temporal podría restablecerse.
        </p>
      </section>

      <section>
        <h2>5. Dudas y Contacto</h2>
        <p>
          Si tiene preguntas acerca del uso de estas tecnologías técnicas en {PROJECT_NAME}, puede escribirnos a{' '}
          <a href={`mailto:${LEGAL_CONFIG.legalEmail}`} className="text-hoja underline font-bold">
            {LEGAL_CONFIG.legalEmail}
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  );
}
