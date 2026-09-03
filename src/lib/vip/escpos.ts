import QRCode from "qrcode";

function toPrinterText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "?");
}

const encoder = new TextEncoder();

const concat = (...chunks: Uint8Array[]): Uint8Array => {
  const size = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
};

const cmd = (...bytes: number[]) => new Uint8Array(bytes);
const text = (value: string) => encoder.encode(toPrinterText(value));

const GS = 0x1d;
const ESC = 0x1b;
const PAPER_DOTS = 384;
const COLS = 32;

function money(value: number): string {
  return `$${Number(value || 0).toFixed(2)}`;
}

function pairLine(left: string, right: string, width = COLS): string {
  const l = toPrinterText(left);
  const r = toPrinterText(right);
  if (l.length + 1 + r.length >= width) {
    return `${l.slice(0, Math.max(0, width - r.length - 1))} ${r}\n`;
  }
  return `${l}${" ".repeat(width - l.length - r.length)}${r}\n`;
}

function qrRasterCommand(payload: string): Uint8Array {
  const qr = QRCode.create(payload, { errorCorrectionLevel: "M" });
  const matrix = qr.modules;
  const modules = matrix.size;
  const quietModules = 3;
  const moduleSize = Math.min(10, Math.max(6, Math.floor(PAPER_DOTS / (modules + quietModules * 2))));
  const qrDots = modules * moduleSize;
  const quietDots = quietModules * moduleSize;
  const widthBytes = PAPER_DOTS / 8;
  const height = qrDots + quietDots * 2;
  const leftPad = Math.floor((PAPER_DOTS - qrDots) / 2);
  const data = new Uint8Array(widthBytes * height);

  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      if (!matrix.get(row, col)) continue;
      const y0 = quietDots + row * moduleSize;
      const x0 = leftPad + col * moduleSize;
      for (let dy = 0; dy < moduleSize; dy++) {
        const y = y0 + dy;
        const rowOffset = y * widthBytes;
        for (let dx = 0; dx < moduleSize; dx++) {
          const x = x0 + dx;
          data[rowOffset + (x >> 3)] |= 0x80 >> (x & 7);
        }
      }
    }
  }

  return concat(
    cmd(ESC, 0x61, 0x00),
    cmd(GS, 0x76, 0x30, 0x00, widthBytes & 0xff, (widthBytes >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff),
    data,
  );
}

export type EscPosTicketVariant = "kitchen" | "general";

export function buildVipEscPosTicket(input: {
  orderId: string;
  orderNumber: string;
  palco: string;
  zona: string;
  nivel?: string;
  customerName?: string;
  phone?: string;
  items: Array<{ quantity: number; name: string; extras?: string; notes?: string; subtotal: number }>;
  subtotal: number;
  cargoServicio: number;
  descuento?: number;
  propina?: number;
  total: number;
  qrPayload: string;
  variant?: EscPosTicketVariant;
  concessionLabel?: string;
  includeSignature?: boolean;
  includeQr?: boolean;
  includeTotals?: boolean;
}): Uint8Array {
  const variant = input.variant || "general";
  const includeQr = input.includeQr !== false;
  const includeTotals = input.includeTotals ?? variant === "general";
  const includeSignature = input.includeSignature ?? variant === "general";
  const subtitle =
    variant === "kitchen"
      ? `PREPARACION - ${toPrinterText(input.concessionLabel || "COCINA")}`
      : "ENTREGA";

  const lines: Uint8Array[] = [
    cmd(ESC, 0x40),
    cmd(ESC, 0x61, 0x01),
    cmd(ESC, 0x45, 0x01),
    text("SERVICIO PALCOS\n"),
    text("CLUB LEON\n"),
    cmd(ESC, 0x45, 0x00),
    text(`${subtitle}\n`),
    text("--------------------------------\n"),
    cmd(ESC, 0x45, 0x01),
    text(`${input.orderNumber}\n`),
    cmd(ESC, 0x45, 0x00),
    text("ID de orden\n"),
    text(`${input.orderId}\n`),
    text("--------------------------------\n"),
    cmd(ESC, 0x61, 0x00),
  ];

  if (input.customerName) lines.push(text(`Cliente: ${input.customerName}\n`));
  lines.push(
    text("--------------------------------\n"),
    cmd(ESC, 0x61, 0x01),
    cmd(ESC, 0x45, 0x01),
    cmd(GS, 0x21, 0x11),
    text(`PALCO ${input.palco}\n`),
    cmd(GS, 0x21, 0x00),
    cmd(ESC, 0x45, 0x00),
    text(`${input.zona}\n`),
  );
  if (input.nivel) lines.push(text(`${input.nivel}\n`));
  lines.push(
    cmd(ESC, 0x61, 0x00),
    text("--------------------------------\n"),
  );
  if (input.phone) lines.push(text(`Tel. ${input.phone}\n`));
  lines.push(text("--------------------------------\n"));

  for (const item of input.items) {
    lines.push(text(pairLine(`${item.quantity}x ${item.name}`, money(item.subtotal))));
    if (item.extras) lines.push(text(`  ${item.extras}\n`));
    if (item.notes) lines.push(text(`  * ${item.notes}\n`));
  }

  if (includeTotals) {
    const breakdown = [
      text("--------------------------------\n"),
      text(pairLine("Subtotal", money(input.subtotal))),
      text(pairLine("Cargo por servicio", money(input.cargoServicio))),
    ];
    if (Number(input.descuento || 0) > 0) {
      breakdown.push(text(pairLine("Descuento", `-${money(input.descuento || 0)}`)));
    }
    if (Number(input.propina || 0) > 0) {
      breakdown.push(text(pairLine("Propina", money(input.propina || 0))));
    }
    lines.push(...breakdown);
    lines.push(
      text("--------------------------------\n"),
      cmd(ESC, 0x45, 0x01),
      text(pairLine("TOTAL", `${money(input.total)} MXN`)),
      cmd(ESC, 0x45, 0x00),
    );
  }

  if (includeSignature) {
    lines.push(
      text("--------------------------------\n"),
      cmd(ESC, 0x61, 0x01),
      text("Recibi conforme\n"),
      cmd(ESC, 0x61, 0x00),
      text("\n\n"),
      text("Nombre: ________________________\n"),
      text("\n"),
      text("Firma:  ________________________\n"),
    );
  }

  if (includeQr) {
    lines.push(
      text("--------------------------------\n"),
      qrRasterCommand(input.qrPayload),
      cmd(ESC, 0x61, 0x01),
      text("\n"),
      text("Escanea para marcar entregada\n"),
    );
  }

  lines.push(
    cmd(ESC, 0x64, 0x08),
    cmd(GS, 0x56, 0x00),
    cmd(ESC, 0x64, 0x02),
  );
  return concat(...lines);
}

export function escPosToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}
