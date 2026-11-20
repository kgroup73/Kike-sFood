import LegalLayout from './LegalLayout';
import { PROJECT_NAME, MAKER_NAME, LEGAL_CONFIG } from '../../config/branding';

export default function TermsPage() {
  return (
    <LegalLayout
      title="Términos y Condiciones de Uso"
      subtitle="Reglas, derechos y responsabilidades que rigen el acceso y uso de la plataforma de software Kike's Food para restaurantes, personal y comensales."
      badge="Términos de Servicio"
    >
      <section>
        <h2>1. Identificación y Aceptación</h2>
        <p>
          Los presentes Términos y Condiciones regulan el acceso, navegación y uso de la plataforma tecnológica <strong>{PROJECT_NAME}</strong> (en adelante, la "Plataforma" o el "Servicio"), un software bajo la modalidad de Software como Servicio (SaaS) desarrollado y comercializado por <strong>{LEGAL_CONFIG.companyName}</strong> ({LEGAL_CONFIG.nit}, {LEGAL_CONFIG.registry} de la {LEGAL_CONFIG.chamberOfCommerce}), con domicilio en {LEGAL_CONFIG.domicile}.
        </p>
        <p>
          Al acceder a la Plataforma mediante código QR, tecnología NFC, URL directa o a través de nuestros paneles de administración y cocina, usted declara ser mayor de edad o contar con la capacidad legal suficiente en su jurisdicción, y acepta someterse de forma vinculante a estos Términos. Si no está de acuerdo con alguna disposición, deberá abstenerse de utilizar el Servicio.
        </p>
      </section>

      <section>
        <h2>2. Naturaleza del Servicio</h2>
        <p>
          {PROJECT_NAME} es una herramienta tecnológica integral de gestión operativa y digitalización para establecimientos gastronómicos (en adelante, los "Establecimientos" o "Restaurantes"). La Plataforma incluye:
        </p>
        <ul>
          <li><strong>Carta digital interactiva:</strong> Visualización de platos, descripciones, alérgenos y precios mediante escaneo QR o toque NFC en mesa.</li>
          <li><strong>Sistema de pedidos y comandas (Kitchen Display System - KDS):</strong> Transmisión en tiempo real de pedidos desde la mesa hacia las pantallas o impresoras de cocina y bar.</li>
          <li><strong>Punto de venta y control de caja (POS):</strong> Agrupación de pedidos por mesa, cálculo de cuentas, registro de medios de pago y cierres de turno.</li>
          <li><strong>Panel administrativo multi-inquilino:</strong> Herramientas para que cada restaurante configure su menú, mesas, personal y preferencias operativas.</li>
        </ul>
      </section>

      <section>
        <h2>3. Deslinde Expreso de Responsabilidad sobre Alimentos y Bebidas</h2>
        <div className="p-4 rounded-xl bg-maracuya/10 border border-maracuya/30 text-tinta my-4">
          <p className="font-semibold text-sm">
            Importante para comensales y consumidores (Estatuto del Consumidor - Ley 1480 de 2011):
          </p>
          <p className="text-xs sm:text-sm text-suave mt-1">
            {PROJECT_NAME} es un proveedor exclusivo de intermediación tecnológica y software. {LEGAL_CONFIG.companyName} NO prepara, manipula, transporta, comercializa ni expende alimentos, bebidas ni productos de consumo humano.
          </p>
        </div>
        <p>
          En virtud de lo anterior, cada Restaurante asociado es el <strong>único y exclusivo responsable</strong> de:
        </p>
        <ul>
          <li>La calidad, inocuidad, preparación, almacenamiento, cocción e higiene de todos los alimentos y bebidas ofrecidos.</li>
          <li>La exactitud en la descripción de ingredientes, advertencias sobre alérgenos (como gluten, frutos secos, lácteos, mariscos), sellos o distinciones nutricionales informadas en la carta.</li>
          <li>El cumplimiento de las normas sanitarias vigentes y registros expedidos por las autoridades sanitarias competentes (como el INVIMA o secretarías de salud locales).</li>
          <li>La fijación, cobro y exactitud de los precios finales informados al consumidor, incluyendo impuestos al consumo o IVA según su régimen tributario.</li>
        </ul>
      </section>

      <section>
        <h2>4. Cuentas de Acceso y Responsabilidad del Personal</h2>
        <p>
          Los Establecimientos son responsables de mantener la confidencialidad de los códigos de acceso, credenciales y roles asignados a su personal (Administrador, Cocina, Caja, Mesero). Cualquier acción, modificación de menú, anulación de comanda o cobro ejecutado bajo sus credenciales será atribuible al Restaurante respectivo.
        </p>
        <p>
          El personal del Restaurante se compromete a hacer un uso honesto y profesional de la Plataforma, absteniéndose de vulnerar la privacidad de los comensales o alterar deliberadamente los registros de auditoría de caja.
        </p>
      </section>

      <section>
        <h2>5. Gestión de Propinas Voluntarias (Ley 1935 de 2018)</h2>
        <p>
          En estricto cumplimiento de la Ley 1935 de 2018 de la República de Colombia y directrices de la Superintendencia de Industria y Comercio (SIC):
        </p>
        <ul>
          <li>La propina es una liberalidad voluntaria del comensal destinada exclusivamente al personal de servicio del Restaurante.</li>
          <li>La Plataforma permite al Restaurante parametrizar la sugerencia estándar (10%), pero <strong>siempre otorga al cliente o al cajero la posibilidad de modificar el porcentaje, ingresar un valor exacto o no incluir propina alguna</strong>.</li>
          <li><strong>{LEGAL_CONFIG.companyName} no retiene, descuenta ni comisiona porcentaje alguno sobre las propinas</strong>. El 100% de los valores recaudados por concepto de propina pertenece y debe ser distribuido entre los trabajadores del servicio del Restaurante.</li>
        </ul>
      </section>

      <section>
        <h2>6. Facturación Electrónica y Cumplimiento Fiscal</h2>
        <p>
          La emisión de la factura electrónica de venta o documento equivalente (tiquete POS electrónico bajo normatividad de la DIAN) es una obligación tributaria directa y no delegable de cada Restaurante.
        </p>
        <p>
          Las funciones de precuenta o comanda generadas por {PROJECT_NAME} constituyen comprobantes operativos internos de control de mesa. La habilitación y conexión definitiva con proveedores tecnológicos autorizados por la DIAN corresponde a los términos contratados en el plan de software y a las credenciales fiscales provistas por el Establecimiento.
        </p>
      </section>

      <section>
        <h2>7. Planes de Suscripción, Pagos y Cancelación</h2>
        <p>
          El acceso a los módulos avanzados de {PROJECT_NAME} se rige por los planes comerciales vigentes (Plan 1 · Solo Carta, Plan 2 · Pedidos y Cocina, Plan 3 · Caja y Control Total):
        </p>
        <ul>
          <li>Las tarifas de suscripción se facturan de forma periódica anticipada (mensual o anual) según el plan acordado.</li>
          <li>El Restaurante podrá solicitar el cambio o cancelación de su plan en cualquier momento antes del siguiente ciclo de facturación, sin cláusulas de permanencia abusivas.</li>
          <li>{LEGAL_CONFIG.companyName} se reserva el derecho de suspender temporalmente el acceso a los paneles administrativos en caso de mora prolongada en el pago de la suscripción, previo aviso formal.</li>
        </ul>
      </section>

      <section>
        <h2>8. Propiedad Intelectual</h2>
        <p>
          Todo el software, código fuente, algoritmos, interfaces gráficas, arquitectura de datos, logotipos, marcas comerciales ({PROJECT_NAME}, {MAKER_NAME}), iconografía y material visual son de propiedad exclusiva de {LEGAL_CONFIG.companyName} o de sus licenciantes, estando protegidos por las leyes de propiedad intelectual y tratados internacionales.
        </p>
        <p>
          El Restaurante conserva en todo momento la titularidad de sus contenidos propios (logotipo del restaurante, fotografías de sus platos, descripciones y recetas). Al cargarlos a la Plataforma, concede a {PROJECT_NAME} una licencia no exclusiva, limitada y gratuita para alojarlos y exhibirlos con el único propósito de prestar el Servicio.
        </p>
      </section>

      <section>
        <h2>9. Disponibilidad del Servicio (SLA) y Garantías</h2>
        <p>
          {LEGAL_CONFIG.companyName} emplea infraestructura en la nube de alta disponibilidad y estándares de seguridad técnica para garantizar la continuidad del Servicio. Sin embargo, debido a la naturaleza de internet y las redes de telecomunicaciones móviles, el software se provee "tal cual" (*as is*) y "según disponibilidad".
        </p>
        <p>
          {PROJECT_NAME} no será responsable por interrupciones atribuibles a: fallas en el suministro eléctrico local del Restaurante, deficiencias en las redes Wi-Fi o datos móviles de los operadores, bloqueos en los dispositivos de los comensales o ataques cibernéticos de fuerza mayor ajenos a nuestro control razonable.
        </p>
      </section>

      <section>
        <h2>10. Modificaciones y Ley Aplicable</h2>
        <p>
          Nos reservamos el derecho de actualizar estos Términos periódicamente para reflejar mejoras operativas o cambios normativos. Los cambios sustanciales serán notificados a través de la Plataforma o al correo electrónico registrado por el Restaurante.
        </p>
        <p>
          Estos Términos se rigen e interpretan de acuerdo con las leyes de la <strong>República de Colombia</strong>. Cualquier controversia que no pueda resolverse de mutuo acuerdo dentro de los treinta (30) días calendario siguientes a su notificación será sometida a los jueces competentes de la República de Colombia.
        </p>
      </section>
    </LegalLayout>
  );
}
