import QRCode from "qrcode";
import { buildVipEscPosTicket, escPosToBase64 } from "./escpos";
import { buildVipOrderQrPayload } from "./scan";
import type { VipOrder } from "./types";

type PdaBridge = {
  isPdaApp?: () => boolean;
  printEscPos?: (base64: string) => boolean | number | void | Promise<boolean | number | void>;
  printTicket?: (base64: string) => boolean | number | void | Promise<boolean | number | void>;
  print?: (payload: string) => boolean | number | void | Promise<boolean | number | void>;
  printHtml?: (html: string) => boolean | void | Promise<boolean | void>;
  scanQr?: () => void;
  startOrderAlert?: () => void;
  stopOrderAlert?: () => void;
};

declare global {
  interface Window {
    Android?: PdaBridge;
    PdaPrinter?: PdaBridge;
    Printer?: PdaBridge;
    printer?: PdaBridge;
    innerPrinter?: PdaBridge;
    H10Printer?: PdaBridge;
    sunmiInnerPrinter?: {
      printText?: (value: string) => void;
      printQRCode?: (value: string) => void;
      cutPaper?: () => void;
    };
    iminPrinter?: PdaBridge;
    lee?: { funAndroid?: (value: string) => void };
    onVipQrScanned?: (code: string) => void;
    __vipPrintDone?: (jobId: number, ok: boolean) => void;
  }
  interface Navigator {
    serial?: {
      getPorts: () => Promise<Array<{
        open: (options: { baudRate: number }) => Promise<void>;
        close: () => Promise<void>;
        writable: { getWriter: () => { write: (data: Uint8Array) => Promise<void>; releaseLock: () => void } };
      }>>;
      requestPort?: () => Promise<unknown>;
    };
  }
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const PRINT_GAP_MS = 3000;

type TicketJob = {
  variant: "kitchen" | "general";
  concessionLabel?: string;
  items: VipOrder["items"];
  includeSignature: boolean;
  includeTotals: boolean;
  includeQr: boolean;
};

let printChain: Promise<void> = Promise.resolve();

function mappedItems(items: VipOrder["items"]) {
  return items.map((item) => ({
    quantity: item.cantidad,
    name: item.producto.nombre,
    extras: (item.opcionesSeleccionadas || []).map((option) => option.opcionNombre).filter(Boolean).join(", "),
    notes: item.instrucciones,
    subtotal: Number(item.subtotal || 0),
  }));
}

function fulfillmentForItem(order: VipOrder, item: VipOrder["items"][number]) {
  const fulfillments = order.fulfillments || [];
  return (
    fulfillments.find(
      (fulfillment) =>
        fulfillment.itemIds?.includes(item.id) || fulfillment.itemIds?.includes(item.producto.id),
    ) || fulfillments.find((fulfillment) => fulfillment.concessionId === item.producto.concesionId)
  );
}

function itemConcessionId(order: VipOrder, item: VipOrder["items"][number]): string {
  const fromProduct = String(item.producto.concesionId || "").trim();
  if (fromProduct) return fromProduct;
  const fromFulfillment = String(fulfillmentForItem(order, item)?.concessionId || "").trim();
  if (fromFulfillment) return fromFulfillment;
  return String(order.restauranteId || "general");
}

function concessionGroups(order: VipOrder): Array<{ id: string; name: string; items: VipOrder["items"] }> {
  const names = new Map(
    (order.fulfillments || [])
      .filter((fulfillment) => fulfillment.concessionId)
      .map((fulfillment) => [fulfillment.concessionId, fulfillment.concessionName || fulfillment.concessionId]),
  );
  const groups = new Map<string, { id: string; name: string; items: VipOrder["items"] }>();
  for (const item of order.items) {
    const id = itemConcessionId(order, item);
    const existing = groups.get(id);
    if (existing) {
      existing.items.push(item);
      continue;
    }
    groups.set(id, {
      id,
      name: names.get(id) || fulfillmentForItem(order, item)?.concessionName || order.restauranteNombre || id,
      items: [item],
    });
  }
  return [...groups.values()];
}

export function buildOrderTicketJobs(order: VipOrder): TicketJob[] {
  const groups = concessionGroups(order);
  const jobs: TicketJob[] = [];
  // Siempre un ticket por concesión (restaurante/cocina) + uno general (cliente).
  for (const group of groups) {
    jobs.push({
      variant: "kitchen",
      concessionLabel: group.name,
      items: group.items,
      includeSignature: false,
      includeTotals: false,
      includeQr: true,
    });
  }
  jobs.push({
    variant: "general",
    items: order.items,
    includeSignature: true,
    includeTotals: true,
    includeQr: true,
  });
  return jobs;
}

function ticketPayload(order: VipOrder, job: TicketJob) {
  const qrPayload = buildVipOrderQrPayload(order.id);
  const bytes = buildVipEscPosTicket({
    orderId: order.id,
    orderNumber: order.numeroPedido,
    palco: order.ubicacion.palco,
    zona: order.ubicacion.zona,
    nivel: order.ubicacion.nivel,
    customerName: order.nombreCliente,
    phone: order.telefonoCliente,
    items: mappedItems(job.items),
    subtotal: Number(order.subtotal || 0),
    cargoServicio: Number(order.cargoServicio || 0),
    descuento: Number(order.descuento || 0),
    propina: Number(order.propina || 0),
    total: Number(order.total || 0),
    qrPayload,
    variant: job.variant,
    concessionLabel: job.concessionLabel,
    includeSignature: job.includeSignature,
    includeTotals: job.includeTotals,
    includeQr: job.includeQr,
  });
  return { qrPayload, bytes };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function printViaNativeBridge(bytes: Uint8Array, qrPayload: string): Promise<boolean> {
  const base64 = escPosToBase64(bytes);
  const android =
    window.Android ||
    window.PdaPrinter ||
    window.H10Printer ||
    window.innerPrinter ||
    window.Printer ||
    window.printer ||
    window.iminPrinter;
  try {
    const inPda = Boolean(android?.isPdaApp?.());
    if (android?.printEscPos) {
      const printed = await waitForNativePrint(() => android.printEscPos!(base64));
      if (printed !== false) return true;
      if (inPda) return false;
    }
    if (android?.printTicket) {
      const printed = await waitForNativePrint(() => android.printTicket!(base64));
      if (printed !== false) return true;
      if (inPda) return false;
    }
    if (android?.print) {
      const printed = await waitForNativePrint(() => android.print!(base64));
      if (printed !== false) return true;
      if (inPda) return false;
    }
    if (window.lee?.funAndroid) {
      window.lee.funAndroid(base64);
      return true;
    }
    const sunmi = window.sunmiInnerPrinter;
    if (sunmi?.printText) {
      sunmi.printText?.("SERVICIO PALCOS - CLUB LEON\n");
      sunmi.printQRCode?.(qrPayload);
      sunmi.cutPaper?.();
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function waitForNativePrint(
  printFn: () => boolean | number | void | Promise<boolean | number | void>,
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      if (window.__vipPrintDone === onDone) window.__vipPrintDone = undefined;
      window.clearTimeout(watchdog);
      resolve(ok);
    };
    const onDone = (_jobId: number, ok: boolean) => {
      finish(ok !== false);
    };
    window.__vipPrintDone = onDone;
    const watchdog = window.setTimeout(() => finish(true), 25000);
    try {
      const result = printFn();
      if (result === false || result === 0) {
        finish(false);
        return;
      }
    } catch {
      finish(false);
    }
  });
}

async function printViaSerial(bytes: Uint8Array): Promise<boolean> {
  const serial = navigator.serial;
  if (!serial?.getPorts) return false;
  try {
    const ports = await serial.getPorts();
    const port = ports[0];
    if (!port) return false;
    for (const baudRate of [115200, 9600]) {
      try {
        await port.open({ baudRate });
        const writer = port.writable.getWriter();
        await writer.write(bytes);
        writer.releaseLock();
        await port.close();
        return true;
      } catch {
        try {
          await port.close();
        } catch {
          // keep trying the next baud
        }
      }
    }
  } catch {
    return false;
  }
  return false;
}

async function ticketHtml(order: VipOrder, job: TicketJob, qrPayload: string): Promise<string> {
  const qrDataUrl = job.includeQr
    ? await QRCode.toDataURL(qrPayload, {
        margin: 2,
        width: 360,
        errorCorrectionLevel: "M",
        color: { dark: "#111614", light: "#ffffff" },
      })
    : "";

  const items = job.items
    .map((item) => {
      const extras = (item.opcionesSeleccionadas || [])
        .map((option) => option.opcionNombre)
        .filter(Boolean)
        .join(", ");
      const note = item.instrucciones ? `<div class="note">* ${escapeHtml(item.instrucciones)}</div>` : "";
      return `<div class="row">
        <div>
          <strong>${item.cantidad}x</strong> ${escapeHtml(item.producto.nombre)}
          ${extras ? `<div class="muted">${escapeHtml(extras)}</div>` : ""}
          ${note}
        </div>
        <div>$${Number(item.subtotal).toFixed(2)}</div>
      </div>`;
    })
    .join("");

  const subtitle =
    job.variant === "kitchen"
      ? `Preparación · ${escapeHtml(job.concessionLabel || "Cocina")}`
      : "Entrega";
  const discountRow =
    Number(order.descuento || 0) > 0
      ? `<div class="row"><span>Descuento</span><span>-$${Number(order.descuento).toFixed(2)}</span></div>`
      : "";
  const tipRow =
    Number(order.propina || 0) > 0
      ? `<div class="row"><span>Propina</span><span>$${Number(order.propina).toFixed(2)}</span></div>`
      : "";
  const totals = job.includeTotals
    ? `<div class="hr"></div>
    <div class="row"><span>Subtotal</span><span>$${Number(order.subtotal || 0).toFixed(2)}</span></div>
    <div class="row"><span>Cargo por servicio</span><span>$${Number(order.cargoServicio || 0).toFixed(2)}</span></div>
    ${discountRow}
    ${tipRow}
    <div class="hr"></div>
    <div class="row"><strong>TOTAL</strong><strong>$${Number(order.total).toFixed(2)} MXN</strong></div>`
    : "";
  const signature = job.includeSignature
    ? `<div class="hr"></div>
    <div class="center"><strong>Recibí conforme</strong></div>
    <div class="sign">Nombre: ________________________</div>
    <div class="sign">Firma:  ________________________</div>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  @page { size: 58mm auto; margin: 2mm; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; }
  .ticket { width: 54mm; margin: 0 auto; font-size: 11px; }
  h1 { font-size: 14px; margin: 0 0 2px; text-align: center; }
  .center { text-align: center; }
  .muted { color: #444; font-size: 10px; }
  .id { font-size: 13px; font-weight: 800; word-break: break-all; }
  .palco {
    text-align: center;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 0.04em;
    margin: 6px 0 2px;
    line-height: 1.1;
  }
  .hr { border-top: 1px dashed #111; margin: 8px 0; }
  .row { display: flex; justify-content: space-between; gap: 8px; margin: 4px 0; }
  .qr { display: flex; justify-content: center; margin: 6px 0; }
  .qr img { width: 42mm; height: 42mm; display: block; }
  .sign { margin: 10px 0 4px; }
</style></head>
<body>
  <div class="ticket">
    <h1>Servicio Palcos · Club León</h1>
    <div class="center muted">${subtitle}</div>
    <div class="hr"></div>
    <div class="center"><strong>${escapeHtml(order.numeroPedido)}</strong></div>
    <div class="center muted">ID de orden</div>
    <div class="center id">${escapeHtml(order.id)}</div>
    <div class="hr"></div>
    ${order.nombreCliente ? `<div><strong>Cliente:</strong> ${escapeHtml(order.nombreCliente)}</div>` : ""}
    <div class="palco">PALCO ${escapeHtml(order.ubicacion.palco)}</div>
    <div class="center"><strong>${escapeHtml(order.ubicacion.zona)}</strong></div>
    ${order.ubicacion.nivel ? `<div class="center muted">${escapeHtml(order.ubicacion.nivel)}</div>` : ""}
    ${order.telefonoCliente ? `<div>Tel. ${escapeHtml(order.telefonoCliente)}</div>` : ""}
    <div class="hr"></div>
    ${items}
    ${totals}
    ${signature}
    ${
      job.includeQr
        ? `<div class="hr"></div>
    <div class="qr"><img alt="QR de la orden" src="${qrDataUrl}" /></div>
    <div class="center muted">Escanea para marcar entregada</div>`
        : ""
    }
  </div>
</body></html>`;
}

async function printViaHtmlBridge(order: VipOrder, job: TicketJob, qrPayload: string): Promise<boolean> {
  const android = window.Android;
  if (!android?.printHtml) return false;
  try {
    const html = await ticketHtml(order, job, qrPayload);
    const printed = await android.printHtml(html);
    return printed !== false;
  } catch {
    return false;
  }
}

async function printViaBrowserDialog(order: VipOrder, job: TicketJob, qrPayload: string): Promise<void> {
  const html = await ticketHtml(order, job, qrPayload);
  const host = document.createElement("div");
  host.dataset.vipH10Ticket = "true";
  host.innerHTML = html;
  document.body.appendChild(host);

  await new Promise<void>((resolve) => {
    const cleanup = () => {
      window.removeEventListener("afterprint", cleanup);
      host.remove();
      resolve();
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    window.setTimeout(cleanup, 4000);
  });
}

async function printOneTicket(order: VipOrder, job: TicketJob): Promise<void> {
  const { qrPayload, bytes } = ticketPayload(order, job);
  if (await printViaNativeBridge(bytes, qrPayload)) return;
  if (window.Android?.isPdaApp?.()) return;
  if (await printViaHtmlBridge(order, job, qrPayload)) return;
  if (await printViaSerial(bytes)) return;
  await printViaBrowserDialog(order, job, qrPayload);
}

async function printOrderTicketsNow(order: VipOrder): Promise<void> {
  const jobs = buildOrderTicketJobs(order);
  const native = Boolean(window.Android?.isPdaApp?.() || window.Android?.printEscPos);
  for (const job of jobs) {
    await printOneTicket(order, job);
    // Native already waits drain + 3s and signals __vipPrintDone. Other paths need the JS gap.
    if (!native) await sleep(PRINT_GAP_MS);
  }
}

export async function printOrderTickets(order: VipOrder): Promise<void> {
  const run = printChain.then(
    () => printOrderTicketsNow(order),
    () => printOrderTicketsNow(order),
  );
  printChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function printVipTicket(order: VipOrder): Promise<void> {
  await printOrderTickets(order);
}

export async function connectUsbPrinter(): Promise<boolean> {
  const serial = navigator.serial;
  if (!serial?.requestPort) return false;
  await serial.requestPort();
  return true;
}

export function canConnectUsbPrinter(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.serial?.requestPort);
}
