import LegalLayout from './LegalLayout';
import { PROJECT_NAME, MAKER_NAME, LEGAL_CONFIG } from '../../config/branding';

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Política de Tratamiento de Datos Personales"
      subtitle="Conozca cómo protegemos y gestionamos la información personal en cumplimiento de la Ley 1581 de 2012 y el régimen de Habeas Data de Colombia."
      badge="Ley 1581 / Habeas Data"
    >
      <section>
        <h2>1. Marco Normativo y Compromiso de Privacidad</h2>
        <p>
          En <strong>{PROJECT_NAME}</strong>, una solución tecnológica desarrollada y operada por <strong>{LEGAL_CONFIG.companyName}</strong> ({LEGAL_CONFIG.nit}, {LEGAL_CONFIG.registry}), reconocemos la importancia de la privacidad y la protección de los datos personales. Damos cumplimiento estricto a la <strong>Ley Estatutaria 1581 de 2012</strong>, su Decreto Reglamentario 1377 de 2013 (compilado en el Decreto Único 1074 de 2015) y demás normas concordantes expedidas por la Superintendencia de Industria y Comercio (SIC) de la República de Colombia.
        </p>
        <p>
          Esta Política describe qué datos recopilamos, con qué finalidades legítimas, cómo los protegemos y cuáles son los mecanismos para que usted ejerza sus derechos de Habeas Data.
        </p>
      </section>

      <section>
        <h2>2. Roles en el Tratamiento de Datos (Responsable vs. Encargado)</h2>
        <p>
          Para efectos de la legislación colombiana y estándares internacionales de protección de datos, operamos bajo dos condiciones diferenciadas:
        </p>
        <ul>
          <li>
            <strong>Como Encargado del Tratamiento:</strong> Cuando un comensal escanea el QR o acerca su celular por NFC a la mesa de un Restaurante cliente, {PROJECT_NAME} actúa como <em>Encargado del Tratamiento</em> que procesa temporalmente la información necesaria para que la cocina despache el pedido y la caja cobre la cuenta. El <strong>Restaurante afiliado actúa como Responsable del Tratamiento</strong> de la relación comercial directa con sus comensales.
          </li>
          <li>
            <strong>Como Responsable del Tratamiento:</strong> {LEGAL_CONFIG.companyName} actúa como <em>Responsable del Tratamiento</em> respecto a los datos de registro, contacto, facturación y gestión operativa de los propietarios, administradores y personal de los Restaurantes que contratan nuestro software.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Principio de Minimización de Datos</h2>
        <p>
          Diseñamos {PROJECT_NAME} bajo el principio de <strong>privacidad por diseño y por defecto</strong>. No obligamos al comensal a crear una cuenta, introducir contraseñas complejas ni entregar datos sensibles para poder ver la carta en su celular:
        </p>
        <ul>
          <li><strong>Consulta de Carta:</strong> Visualizar el menú, precios y fotos es totalmente anónimo y no requiere recolección de datos personales de identificación.</li>
          <li><strong>Pedidos desde la Mesa:</strong> Únicamente se asocia la orden al identificador técnico de la mesa (ej: "Mesa 4"), los productos seleccionados y las observaciones culinarias voluntarias (ej: "sin sal", "término medio"). Si el comensal ingresa voluntariamente un nombre de cortesía, este solo se utiliza para vocear o entregar el plato.</li>
          <li><strong>Datos del Personal de Restaurante:</strong> Para los colaboradores del restaurante (cocineros, cajeros, administradores), tratamos únicamente nombre, rol operativo, identificador interno y correo electrónico necesario para el acceso seguro.</li>
        </ul>
      </section>

      <section>
        <h2>4. Finalidades del Tratamiento</h2>
        <p>
          Los datos personales recolectados a través de la Plataforma son tratados con las siguientes finalidades legítimas:
        </p>
        <ul>
          <li>Transmitir las comandas en tiempo real a las pantallas e impresoras de la cocina y bar del Restaurante.</li>
          <li>Agrupar los consumos de la mesa para permitir el cálculo de la cuenta, división de pago y cobro en la caja.</li>
          <li>Permitir la configuración de catálogos de platos, inventario e ingredientes por parte del administrador.</li>
          <li>Prestar soporte técnico, atención al cliente y resolver incidencias de conectividad o funcionamiento.</li>
          <li>Garantizar la seguridad informática, prevenir accesos no autorizados y mantener registros de auditoría técnica.</li>
          <li>Facturar los servicios de software contratados y cumplir con las obligaciones legales y contables aplicables.</li>
        </ul>
        <p>
          <strong>No vendemos, no alquilamos ni comercializamos datos personales</strong> de los comensales o restaurantes a terceros con fines publicitarios ajenos a la operación del restaurante.
        </p>
      </section>

      <section>
        <h2>5. Derechos de los Titulares (Habeas Data)</h2>
        <p>
          De conformidad con el artículo 8 de la Ley 1581 de 2012, el titular de los datos personales cuenta con los siguientes derechos:
        </p>
        <ul>
          <li><strong>Conocer, actualizar y rectificar</strong> sus datos personales frente a los Responsables y Encargados.</li>
          <li><strong>Solicitar prueba de la autorización</strong> otorgada para el tratamiento, salvo cuando la ley la exceptúe.</li>
          <li><strong>Ser informado</strong> por el Responsable o Encargado, previa solicitud, respecto del uso que se le ha dado a sus datos.</li>
          <li><strong>Presentar ante la Superintendencia de Industria y Comercio (SIC)</strong> quejas por infracciones a la normatividad de protección de datos, una vez agotado el trámite de consulta o reclamo ante {PROJECT_NAME} o el Restaurante.</li>
          <li><strong>Revocar la autorización y/o solicitar la supresión del dato</strong> cuando en el tratamiento no se respeten los principios, derechos y garantías constitucionales y legales.</li>
          <li><strong>Acceder de forma gratuita</strong> a sus datos personales que hayan sido objeto de tratamiento.</li>
        </ul>
      </section>

      <section>
        <h2>6. Procedimiento para el Ejercicio de Derechos (PQR)</h2>
        <p>
          Para radicar consultas, peticiones, quejas o reclamos (PQR) relacionados con el tratamiento de sus datos personales, ponemos a su disposición el canal oficial:
        </p>
        <div className="p-4 rounded-xl bg-plato border border-linea text-tinta my-4 space-y-2 text-sm">
          <p>
            <strong>Canal oficial:</strong> Correo electrónico:{' '}
            <a href={`mailto:${LEGAL_CONFIG.legalEmail}`} className="text-hoja underline font-bold">
              {LEGAL_CONFIG.legalEmail}
            </a>
          </p>
          <p>
            <strong>Asunto recomendado:</strong> "Ejercicio de Derechos de Habeas Data - [Nombre del Solicitante]"
          </p>
          <p>
            <strong>Requisitos de la solicitud:</strong> Nombre completo, documento de identidad, descripción clara de los hechos o derecho que ejerce, datos de contacto para notificación y documentos que soporten su petición.
          </p>
        </div>
        <p>
          <strong>Términos de respuesta legal:</strong>
        </p>
        <ul>
          <li><strong>Consultas:</strong> Serán atendidas en un plazo máximo de diez (10) días hábiles contados a partir de la fecha de su recibo.</li>
          <li><strong>Reclamos:</strong> Serán atendidos en un plazo máximo de quince (15) días hábiles contados a partir del día siguiente a la fecha de su recibo completo.</li>
        </ul>
      </section>

      <section>
        <h2>7. Medidas de Seguridad de la Información</h2>
        <p>
          {PROJECT_NAME} implementa rigurosas medidas técnicas, humanas y administrativas para garantizar la confidencialidad, integridad y disponibilidad de la información:
        </p>
        <ul>
          <li>Protocolos de transmisión cifrada mediante SSL/TLS (HTTPS) de extremo a extremo.</li>
          <li>Aislamiento de datos por restaurante (arquitectura multi-inquilino) que impide el cruce indebido de información entre diferentes establecimientos.</li>
          <li>Tokens criptográficos efímeros para el acceso a las mesas, garantizando que solo quienes están físicamente en el local puedan interactuar con la orden activa.</li>
          <li>Monitoreo continuo de incidentes de seguridad e infraestructura en centros de datos con certificaciones internacionales ISO 27001 y SOC 2.</li>
        </ul>
      </section>

      <section>
        <h2>8. Vigencia y Modificaciones</h2>
        <p>
          Esta Política de Tratamiento rige a partir de {LEGAL_CONFIG.lastUpdated} y permanecerá vigente mientras sea necesario para cumplir con las finalidades descritas o durante el tiempo que exijan las normas legales aplicables.
        </p>
      </section>
    </LegalLayout>
  );
}
