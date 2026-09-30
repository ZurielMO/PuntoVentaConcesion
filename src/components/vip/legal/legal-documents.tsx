import type { ReactNode } from "react";
import {
  legalIdentityValue,
  VIP_LEGAL_CONTROLLER,
  VIP_LEGAL_DOCUMENT_VERSION,
  vipLegalVersionLabel,
} from "@/lib/vip/legal-config";

function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-[family-name:var(--font-montserrat)] text-lg font-bold text-[#062E20] tracking-tight">
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-[#374151]">{children}</div>
    </section>
  );
}

export function VipLegalIdentity() {
  const rows = [
    ["Razón social", legalIdentityValue(VIP_LEGAL_CONTROLLER.legalName)],
    ["Domicilio", legalIdentityValue(VIP_LEGAL_CONTROLLER.address)],
    ["Teléfono", legalIdentityValue(VIP_LEGAL_CONTROLLER.phone)],
    ["Correo", legalIdentityValue(VIP_LEGAL_CONTROLLER.email)],
  ];

  return (
    <dl className="grid gap-2 rounded-2xl border border-[#E5EBE8] bg-[#F8FAF9] px-4 py-3.5">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[7.5rem_1fr] gap-3 text-sm">
          <dt className="font-semibold text-[#6B7280]">{label}</dt>
          <dd className="font-medium text-[#111827]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function VersionLine() {
  return (
    <p className="text-sm text-[#6B7280]">
      Versión {VIP_LEGAL_DOCUMENT_VERSION} · {vipLegalVersionLabel()}
    </p>
  );
}

export function VipPrivacyNotice() {
  const email = legalIdentityValue(VIP_LEGAL_CONTROLLER.email);
  const name = legalIdentityValue(VIP_LEGAL_CONTROLLER.legalName);

  return (
    <div className="flex flex-col gap-6">
      <VersionLine />
      <p className="text-[15px] leading-relaxed text-[#374151]">
        Este aviso explica cómo se tratan los datos de quien pide alimentos o bebidas a su palco
        en el Estadio León. Está elaborado conforme a la Ley Federal de Protección de Datos
        Personales en Posesión de los Particulares.
      </p>

      <LegalSection title="Responsable">
        <p>{name} es quien decide sobre el tratamiento de estos datos.</p>
        <VipLegalIdentity />
      </LegalSection>

      <LegalSection title="Datos que tratamos">
        <p>
          Nombre de quien recibe el pedido, correo, teléfono, zona, número de palco, piso,
          productos, comentarios del pedido e identificadores de la orden y del cobro.
        </p>
        <p>
          El número completo de la tarjeta lo captura Stripe en su propia página. Esta aplicación
          no lo guarda. No pedimos datos sensibles. Si un comentario menciona una alergia o una
          preferencia de salud, se usa solo para preparar ese pedido.
        </p>
      </LegalSection>

      <LegalSection title="Para qué los usamos">
        <p>
          Estas finalidades no piden un consentimiento distinto del pedido, porque sirven para
          cumplir la compra: preparar y entregar en el palco, cobrar una sola vez, enviar la
          confirmación y la guía, atender aclaraciones y cumplir obligaciones fiscales o de
          protección al consumidor.
        </p>
        <p>
          No usamos estos datos para publicidad, para venderlos ni para elaborar perfiles. Esas
          finalidades sí requerirían tu consentimiento, y no las realizamos.
        </p>
      </LegalSection>

      <LegalSection title="Cómo limitar el uso">
        <p>
          El correo y el teléfono se usan para el pedido y su entrega. Puedes pedir que no se
          usen para ningún otro contacto escribiendo a {email}. No hay boletín ni avisos
          comerciales asociados a esta compra.
        </p>
      </LegalSection>

      <LegalSection title="A quién se comunican">
        <p>
          Se comunican solo cuando hace falta para cumplir el pedido: a la concesión que prepara
          los alimentos, a Stripe para el cobro y a la infraestructura que hospeda la orden. Esas
          comunicaciones son necesarias para la relación contigo. Quien los recibe debe usarlos
          con el mismo cuidado que describe este aviso.
        </p>
      </LegalSection>

      <LegalSection title="Derechos ARCO">
        <p>
          Puedes acceder, rectificar, cancelar u oponerte al tratamiento, y revocar el
          consentimiento, sin efectos sobre lo ya realizado. La solicitud se envía a {email} e
          incluye tu nombre, un medio de contacto, la identificación del titular o de quien lo
          represente, y una descripción clara del derecho que quieres ejercer.
        </p>
        <p>
          Respondemos en un máximo de veinte días hábiles. Si procede, lo hacemos efectivo en los
          quince días hábiles siguientes. El ejercicio es gratuito, salvo el costo de reproducción
          o envío cuando exista. Si no estás de acuerdo con la respuesta, o si no la hay en ese
          plazo, puedes acudir a la Secretaría Anticorrupción y Buen Gobierno.
        </p>
        <p>
          La cancelación puede no proceder cuando los datos sigan siendo necesarios para el
          contrato, una obligación legal o la atención de una reclamación. En ese caso se
          conservan bloqueados durante el plazo aplicable.
        </p>
      </LegalSection>

      <LegalSection title="Conservación y seguridad">
        <p>
          Conservamos los datos el tiempo necesario para entregar el pedido, atender reclamaciones
          y cumplir obligaciones legales. Los datos ligados a un incumplimiento contractual se
          eliminan al cabo de setenta y dos meses, contados desde la fecha de ese incumplimiento.
        </p>
        <p>
          Aplicamos medidas administrativas y técnicas para evitar pérdida, alteración o acceso no
          autorizado. Si una vulneración afecta de forma significativa tus derechos, te lo
          informamos por el correo del pedido.
        </p>
      </LegalSection>

      <LegalSection title="Cambios">
        <p>
          Si este aviso cambia, la versión nueva se publica en esta misma página con su fecha. El
          pago pide aceptar la versión vigente antes de cobrar.
        </p>
      </LegalSection>
    </div>
  );
}

export function VipTermsDocument() {
  const email = legalIdentityValue(VIP_LEGAL_CONTROLLER.email);
  const phone = legalIdentityValue(VIP_LEGAL_CONTROLLER.phone);

  return (
    <div className="flex flex-col gap-6">
      <VersionLine />
      <p className="text-[15px] leading-relaxed text-[#374151]">
        Estos términos regulan la compra de alimentos y bebidas con entrega en palco, celebrada
        por medios electrónicos conforme a la Ley Federal de Protección al Consumidor.
      </p>

      <LegalSection title="Proveedor">
        <p>Quien ofrece el servicio es el responsable que se identifica así:</p>
        <VipLegalIdentity />
        <p>
          Para aclaraciones o quejas puedes usar el correo {email} o el teléfono {phone}. También
          puedes acudir a la Procuraduría Federal del Consumidor.
        </p>
      </LegalSection>

      <LegalSection title="El servicio">
        <p>
          Servicio Palcos permite ordenar alimentos y bebidas de las concesiones del Estadio León
          para recibirlos en un palco de Oriente o Poniente. Puedes pedir entrega durante el
          partido, cuando la venta está abierta, o una preventa para un horario publicado.
        </p>
        <p>
          Cada compra es un pedido independiente. No hay membresía, renovación automática ni cobro
          recurrente.
        </p>
      </LegalSection>

      <LegalSection title="Precio y pago">
        <p>
          Antes de pagar ves el desglose: productos, cargo por servicio y total en pesos
          mexicanos. El total lo calcula el servidor. El cobro es único, con tarjeta, a través de
          Stripe. No se realiza ningún cargo hasta que confirmas el pago en esa página.
        </p>
      </LegalSection>

      <LegalSection title="Seguridad de la transacción">
        <p>
          La conexión del sitio va cifrada. Los datos de la tarjeta se capturan en el formulario
          de Stripe, no en esta aplicación. Usamos esa información solo para concluir el pedido y
          no la compartimos con proveedores ajenos a la entrega y al cobro.
        </p>
      </LegalSection>

      <LegalSection title="Entrega">
        <p>
          La entrega se hace en la zona, el palco y el piso que indiques, a nombre de la persona
          de contacto. En preventa, la ventana de horario que elijas forma parte del pedido. Si
          falta un producto o no es posible entregarlo, te contactamos al correo o al teléfono del
          pedido para ofrecerte la alternativa disponible o el ajuste que corresponda.
        </p>
      </LegalSection>

      <LegalSection title="Cancelación">
        <p>
          Son alimentos preparados para consumirse en el estadio. Puedes solicitar la cancelación
          en {email} antes de que la concesión empiece a preparar el pedido. Si la preparación ya
          inició, no hay reembolso, salvo que el pedido no se entregue o el cargo no corresponda
          a lo aceptado.
        </p>
      </LegalSection>

      <LegalSection title="Aceptación">
        <p>
          Al marcar la casilla del carrito aceptas estos términos, el aviso de privacidad y la
          política de cookies de la versión publicada ese día. Las leyes aplicables son las de los
          Estados Unidos Mexicanos, y los tribunales competentes son los de León, Guanajuato.
        </p>
      </LegalSection>
    </div>
  );
}

export function VipCookiePolicy() {
  return (
    <div className="flex flex-col gap-6">
      <VersionLine />
      <p className="text-[15px] leading-relaxed text-[#374151]">
        Esta página describe el almacenamiento que usa Servicio Palcos en tu dispositivo. No hay
        cookies de publicidad ni de analítica en este sitio.
      </p>

      <LegalSection title="Almacenamiento esencial">
        <p>
          El carrito, el cierre de este aviso y los datos locales para seguir un pedido se guardan
          en el almacenamiento del navegador. Sirven para que el pedido no se pierda si cambias de
          pantalla y para recordar que ya leíste este aviso. Sin ellos el servicio no puede armar
          la compra en el dispositivo.
        </p>
      </LegalSection>

      <LegalSection title="Pago con tarjeta">
        <p>
          Al continuar a Stripe, ese sitio puede usar sus propias cookies para procesar el cobro y
          prevenir fraude. Esas cookies pertenecen a Stripe y se rigen por su aviso. No las
          controla esta aplicación.
        </p>
      </LegalSection>

      <LegalSection title="Lo que no usamos">
        <p>
          No instalamos cookies de medición, redes sociales ni publicidad. Por eso no hay una
          opción para rechazar cookies opcionales: no existen en este sitio.
        </p>
      </LegalSection>

      <LegalSection title="Cómo borrarlo">
        <p>
          Puedes borrar el almacenamiento del sitio desde la configuración del navegador. Al
          hacerlo se vacía el carrito de este dispositivo y el aviso puede volver a mostrarse.
        </p>
      </LegalSection>
    </div>
  );
}
