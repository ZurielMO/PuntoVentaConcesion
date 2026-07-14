import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CorteHistoryItem, CorteReport } from "@/features/cortes/contracts";
import {
  buildCortePdfPageLabels,
  buildCortePdfPrintModel,
  buildCortePdfSmartSummary,
  buildHistoricalCortePdfPayload,
  buildReportCortePdfPayload,
  getCortePdfContinuationHeader,
  getCortePdfProductPointPresentation,
  normalizeCortePdfPaymentMethods,
  normalizeCortePdfScopeLabels,
  type CortePdfMetric,
  type CortePdfPayloadV1,
  type CortePdfGenerationOptions,
  type CortePdfSummaryStatus,
  type ScopeLabels,
} from "@/features/cortes/pdf-payload";
import { formatPrice } from "@/lib/format";

export type CortePdfExtraTable = {
  title: string;
  head: string[];
  body: string[][];
};

type Rgb = [number, number, number];

const COLORS = {
  greenDark: [12, 59, 36] as Rgb,
  green: [22, 101, 52] as Rgb,
  greenSoft: [232, 245, 236] as Rgb,
  ink: [21, 39, 30] as Rgb,
  muted: [92, 112, 101] as Rgb,
  line: [215, 225, 219] as Rgb,
  surface: [246, 249, 247] as Rgb,
  white: [255, 255, 255] as Rgb,
  warning: [157, 94, 9] as Rgb,
  warningSoft: [255, 247, 224] as Rgb,
  danger: [153, 27, 27] as Rgb,
  dangerSoft: [254, 235, 235] as Rgb,
  incomplete: [79, 89, 84] as Rgb,
  incompleteSoft: [239, 242, 240] as Rgb,
};

const PAGE = { left: 14, right: 14, top: 22, bottom: 18 };

const setText = (doc: jsPDF, color: Rgb) => doc.setTextColor(color[0], color[1], color[2]);
const setFill = (doc: jsPDF, color: Rgb) => doc.setFillColor(color[0], color[1], color[2]);
const setDraw = (doc: jsPDF, color: Rgb) => doc.setDrawColor(color[0], color[1], color[2]);

const metricMoney = (entry: CortePdfMetric<number>): string =>
  entry.available && entry.value !== null ? formatPrice(entry.value) : "N/D";

const metricValue = (entry: CortePdfMetric<number>): number | null =>
  entry.available && entry.value !== null ? entry.value : null;

const normalize = (value: string): string =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const paymentKind = (name: string): "cash" | "card" | "points" | "other" => {
  const key = normalize(name);
  if (key.includes("punto")) return "points";
  if (key.includes("efectivo") || key === "cash") return "cash";
  if (key.includes("tarjeta") || key.includes("credito") || key.includes("debito") || key === "card") return "card";
  return "other";
};

const titleCase = (value: string): string =>
  value ? `${value.charAt(0).toLocaleUpperCase("es-MX")}${value.slice(1)}` : value;

const getFinalY = (doc: jsPDF): number =>
  (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 30;

const ensureSpace = (doc: jsPDF, y: number, needed: number): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed <= pageHeight - PAGE.bottom) return y;
  doc.addPage();
  return PAGE.top;
};

const statusStyle = (status: CortePdfSummaryStatus): { ink: Rgb; fill: Rgb; label: string } => {
  if (status === "critico") return { ink: COLORS.danger, fill: COLORS.dangerSoft, label: "CRÍTICO" };
  if (status === "revisar") return { ink: COLORS.warning, fill: COLORS.warningSoft, label: "REVISAR" };
  if (status === "incompleto") return { ink: COLORS.incomplete, fill: COLORS.incompleteSoft, label: "INCOMPLETO" };
  return { ink: COLORS.green, fill: COLORS.greenSoft, label: "CORRECTO" };
};

const drawExecutiveHeader = (doc: jsPDF, payload: CortePdfPayloadV1): number => {
  const width = doc.internal.pageSize.getWidth();
  setFill(doc, COLORS.greenDark);
  doc.rect(0, 0, width, 42, "F");
  setText(doc, COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("CLUB LEÓN · OPERACIÓN DE CONCESIONES", PAGE.left, 10);
  doc.setFontSize(18);
  doc.text(payload.document.visibleTypeLabel ?? "Reporte de jornada por concesión", PAGE.left, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.text(
    `${payload.document.documentStatus ?? "PRELIMINAR"} · Cálculo ${payload.document.calculationVersion ?? "N/D"} · Exportado ${payload.timing.exportedAtFormatted ?? payload.timing.exportedAt}`,
    PAGE.left,
    30,
    { maxWidth: 125 },
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("FOLIO", width - PAGE.right, 13, { align: "right" });
  doc.setFontSize(10);
  doc.text(payload.document.readableFolio ?? payload.document.folio, width - PAGE.right, 20, { align: "right", maxWidth: 68 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(payload.timing.businessDateFormatted, width - PAGE.right, 31, { align: "right" });

  const meta = [
    ["CONCESIÓN", payload.scope.concesion],
    ["CAJA", payload.scope.caja],
    ["VENDEDOR", payload.scope.vendedor],
    ["GENERADO POR", payload.audit?.generatedBy.value ?? "N/D"],
  ];
  const columnWidth = (width - PAGE.left - PAGE.right) / meta.length;
  meta.forEach(([label, value], index) => {
    const x = PAGE.left + (index * columnWidth);
    setText(doc, COLORS.muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.text(label, x, 51);
    setText(doc, COLORS.ink);
    doc.setFontSize(8.6);
    const line = doc.splitTextToSize(value || "N/D", columnWidth - 5)[0] ?? "N/D";
    doc.text(line, x, 57);
  });
  setDraw(doc, COLORS.line);
  doc.setLineWidth(0.35);
  doc.line(PAGE.left, 62, width - PAGE.right, 62);
  return 70;
};

const drawSectionHeading = (doc: jsPDF, y: number, title: string, subtitle?: string): number => {
  y = ensureSpace(doc, y, subtitle ? 14 : 9);
  setText(doc, COLORS.greenDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, PAGE.left, y);
  if (subtitle) {
    setText(doc, COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(subtitle, PAGE.left, y + 5, { maxWidth: 178 });
    return y + 10;
  }
  return y + 5;
};

const drawSmartSummary = (doc: jsPDF, payload: CortePdfPayloadV1, y: number): number => {
  if (payload.rollup?.available && !payload.reconciliation?.applicable) {
    y = drawSectionHeading(doc, y, "Resumen ejecutivo", "Resumen presentacional construido exclusivamente con los importes existentes por concesión.");
    y = ensureSpace(doc, y, 20);
    setFill(doc, COLORS.greenSoft);
    doc.roundedRect(PAGE.left, y, 182, 17, 2, 2, "F");
    setText(doc, COLORS.greenDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${payload.rollup.concessions.value ?? 0} concesión(es) en el alcance`, PAGE.left + 5, y + 7);
    setText(doc, COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Los puntos y descuentos se consolidan desde cada concesión; los cobros y ventas brutas siguen sin desglose en esta vista.", PAGE.left + 5, y + 12, { maxWidth: 171 });
    return y + 24;
  }
  const summary = buildCortePdfSmartSummary(payload);
  const style = statusStyle(summary.status);
  y = drawSectionHeading(
    doc,
    y,
    "Resumen ejecutivo",
    "Hallazgos explicables del alcance documentado; los datos ausentes permanecen como N/D.",
  );
  y = ensureSpace(doc, y, 25);
  setFill(doc, style.fill);
  doc.roundedRect(PAGE.left, y, 182, 20, 2, 2, "F");
  setFill(doc, style.ink);
  doc.roundedRect(PAGE.left + 4, y + 4.5, 26, 7.5, 3.5, 3.5, "F");
  setText(doc, COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(style.label, PAGE.left + 17, y + 9.5, { align: "center" });
  setText(doc, COLORS.ink);
  doc.setFontSize(11);
  doc.text(summary.headline, PAGE.left + 35, y + 8);
  setText(doc, COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.7);
  doc.text(summary.explanation, PAGE.left + 35, y + 13, { maxWidth: 141 });

  autoTable(doc, {
    startY: y + 24,
    head: [["Estado", "Hallazgo", "Lectura y evidencia"]],
    body: summary.findings.map((item) => [statusStyle(item.status).label, item.title, item.detail]),
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 7.4,
      textColor: COLORS.ink,
      cellPadding: { top: 2.4, right: 2.5, bottom: 2.4, left: 2.5 },
      lineColor: COLORS.line,
      lineWidth: { bottom: 0.2 },
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: { fillColor: COLORS.greenDark, textColor: COLORS.white, fontStyle: "bold", lineWidth: 0 },
    alternateRowStyles: { fillColor: COLORS.surface },
    columnStyles: {
      0: { cellWidth: 23, fontStyle: "bold" },
      1: { cellWidth: 47, fontStyle: "bold" },
      2: { cellWidth: 112 },
    },
    margin: { left: PAGE.left, right: PAGE.right, top: PAGE.top, bottom: PAGE.bottom },
    rowPageBreak: "avoid",
    showHead: "everyPage",
  });
  return getFinalY(doc) + 8;
};

const drawKpis = (doc: jsPDF, payload: CortePdfPayloadV1, y: number): number => {
  y = drawSectionHeading(doc, y, "Indicadores clave");
  y = ensureSpace(doc, y, 28);
  const items = payload.rollup?.available
    ? [
        ["BASE COMISIONABLE", metricMoney(payload.rollup.baseComisionable)],
        ["COMISIÓN", metricMoney(payload.rollup.commission)],
        ["NETO POSTERIOR", metricMoney(payload.rollup.netAfterCommission)],
        ["CONCESIONES", payload.rollup.concessions.value?.toLocaleString("es-MX") ?? "0"],
      ]
    : [
        ["VENTAS NETAS", metricMoney(payload.financial.ventasNetas)],
        ["DINERO REAL", metricMoney(payload.payments.dineroReal)],
        ["DIFERENCIA DE CAJA", metricMoney(payload.cash.diferencia)],
        ["COMISIÓN", metricMoney(payload.commission.amount)],
      ];
  const gap = 3;
  const cardWidth = (182 - (gap * 3)) / 4;
  items.forEach(([label, value], index) => {
    const x = PAGE.left + (index * (cardWidth + gap));
    setFill(doc, index === 0 ? COLORS.greenSoft : COLORS.surface);
    doc.roundedRect(x, y, cardWidth, 22, 2, 2, "F");
    setText(doc, COLORS.muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(label, x + 3, y + 6);
    setText(doc, index === 0 ? COLORS.greenDark : COLORS.ink);
    doc.setFontSize(value === "N/D" ? 12 : 11);
    doc.text(value, x + 3, y + 15.5, { maxWidth: cardWidth - 6 });
  });
  return y + 29;
};

const drawRollupBenefits = (doc: jsPDF, payload: CortePdfPayloadV1, y: number): number => {
  if (!payload.rollup?.available) return y;
  y = drawSectionHeading(
    doc,
    y,
    "Puntos y descuentos consolidados",
    "Los puntos se informan por separado y no forman parte del dinero real.",
  );
  autoTable(doc, {
    startY: y,
    head: [["Métrica", "Total consolidado", "Lectura"]],
    body: [
      ["Puntos canjeados", payload.rollup.redeemedPoints.available ? (payload.rollup.redeemedPoints.value ?? 0).toLocaleString("es-MX") : "N/D", "Cantidad; no es dinero real"],
      ["Valor cubierto con puntos", metricMoney(payload.rollup.coveredPointValue), "MXN informado por concesión"],
      ["Descuentos aplicados", metricMoney(payload.rollup.discounts), "Promociones + beneficios de abonado"],
    ],
    theme: "plain",
    styles: { font: "helvetica", fontSize: 7.5, textColor: COLORS.ink, cellPadding: 2.2, lineColor: COLORS.line, lineWidth: { bottom: 0.2 } },
    headStyles: { fillColor: COLORS.greenSoft, textColor: COLORS.greenDark, fontStyle: "bold", lineWidth: 0 },
    alternateRowStyles: { fillColor: COLORS.surface },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" }, 2: { textColor: COLORS.muted } },
    margin: { left: PAGE.left, right: PAGE.right, top: PAGE.top, bottom: PAGE.bottom },
    rowPageBreak: "avoid",
  });
  return getFinalY(doc) + 6;
};

const drawPayments = (doc: jsPDF, payload: CortePdfPayloadV1, y: number): number => {
  const methods = normalizeCortePdfPaymentMethods(payload.payments.methods);
  const moneyRows = Object.entries(methods)
    .filter(([name, entry]) => paymentKind(name) !== "points" && entry.available && entry.value !== null)
    .map(([name, entry]) => [titleCase(name), metricMoney(entry)]);
  const pointMethod = Object.entries(methods)
    .find(([name, entry]) => paymentKind(name) === "points" && entry.available && entry.value !== null)?.[1];
  const points = payload.points.value.available ? payload.points.value : pointMethod;
  const hasPointValue = Boolean(points?.available && points.value !== null);
  const hasPointDetails = hasPointValue || payload.points.redeemed.available || Boolean(payload.points.rule?.available);
  if (!moneyRows.length && !hasPointDetails) return y;

  y = drawSectionHeading(
    doc,
    y,
    "Distribución de cobro",
    "Los cobros monetarios se muestran por método; el valor con puntos queda separado.",
  );
  if (moneyRows.length) {
    autoTable(doc, {
      startY: y,
      head: [["Método monetario", "Importe"]],
      body: moneyRows,
      theme: "plain",
      styles: { font: "helvetica", fontSize: 8, textColor: COLORS.ink, cellPadding: 2.4, lineColor: COLORS.line, lineWidth: { bottom: 0.2 } },
      headStyles: { fillColor: COLORS.green, textColor: COLORS.white, fontStyle: "bold", lineWidth: 0 },
      alternateRowStyles: { fillColor: COLORS.surface },
      columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
      margin: { left: PAGE.left, right: PAGE.right, top: PAGE.top, bottom: PAGE.bottom },
      rowPageBreak: "avoid",
    });
    y = getFinalY(doc) + 3;
  }
  if (hasPointDetails) {
    y = ensureSpace(doc, y, 17);
    setFill(doc, COLORS.incompleteSoft);
    doc.roundedRect(PAGE.left, y, 182, 15, 2, 2, "F");
    setText(doc, COLORS.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Valor cubierto con puntos", PAGE.left + 4, y + 5);
    doc.text(points ? metricMoney(points) : "N/D", PAGE.left + 178, y + 5, { align: "right" });
    setText(doc, COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(
      `Puntos canjeados: ${payload.points.redeemed.available && payload.points.redeemed.value !== null ? payload.points.redeemed.value.toLocaleString("es-MX") : "N/D"} · Regla aplicada: ${payload.points.rule?.value ?? "N/D"}`,
      PAGE.left + 4,
      y + 9.5,
    );
    doc.text("El valor se presenta separado; la consistencia monetaria se valida abajo.", PAGE.left + 4, y + 13);
    y += 20;
  }
  return y + 3;
};

const drawReconciliation = (doc: jsPDF, payload: CortePdfPayloadV1, y: number): number => {
  const reconciliation = payload.reconciliation;
  const cashRows = [
    ["Fondo inicial", metricMoney(payload.cash.fondoInicial)],
    ["Entradas", metricMoney(payload.cash.movimientosEntradas)],
    ["Salidas", metricMoney(payload.cash.movimientosSalidas)],
    ["Efectivo esperado", metricMoney(payload.cash.efectivoEsperado)],
    ["Efectivo contado", metricMoney(payload.cash.efectivoContado)],
    ["Diferencia", metricMoney(payload.cash.diferencia)],
  ];
  const inventoryRows = payload.inventory.rows;
  y = drawSectionHeading(doc, y, "Estado de conciliación", `Tolerancia monetaria: ±$0.01 · Estado: ${reconciliation?.status?.toLocaleUpperCase("es-MX") ?? "INCOMPLETO"}.`);

  if (!reconciliation?.applicable) {
    y = ensureSpace(doc, y, 14);
    setFill(doc, COLORS.incompleteSoft);
    doc.roundedRect(PAGE.left, y, 182, 12, 2, 2, "F");
    setText(doc, COLORS.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Conciliación monetaria y arqueo: N/A", PAGE.left + 4, y + 5);
    setText(doc, COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(reconciliation?.reason ?? "No aplica para este tipo de reporte.", PAGE.left + 4, y + 9.5, { maxWidth: 174 });
    y += 17;
  } else {
    const salesDelta = metricValue(reconciliation.salesDelta);
    const equationRows = [
      [
        "Ventas brutas - descuentos = ventas netas",
        `${metricMoney(payload.financial.ventasBrutas)} - ${metricMoney(payload.financial.descuentos)} = ${metricMoney(reconciliation.grossMinusDiscounts)}`,
        `Venta neta fuente ${metricMoney(payload.financial.ventasNetas)}`,
        metricMoney(reconciliation.salesDelta),
      ],
      [
        "Efectivo + tarjeta = dinero real",
        `${metricMoney(normalizeCortePdfPaymentMethods(payload.payments.methods).efectivo ?? { available: false, value: null })} + ${metricMoney(normalizeCortePdfPaymentMethods(payload.payments.methods).tarjeta ?? { available: false, value: null })}`,
        `Dinero real fuente ${metricMoney(payload.payments.dineroReal)}`,
        metricMoney(reconciliation.realMoneyDelta),
      ],
      [
        "Dinero real + valor con puntos",
        `${metricMoney(payload.payments.dineroReal)} + ${metricMoney(payload.points.value)}`,
        `Total conciliado ${metricMoney(reconciliation.reconciledTotal)}`,
        "-",
      ],
      [
        "Total conciliado - ventas netas",
        `${metricMoney(reconciliation.reconciledTotal)} - ${metricMoney(payload.financial.ventasNetas)}`,
        "Diferencia final",
        metricMoney(reconciliation.finalDifference),
      ],
    ];
    autoTable(doc, {
      startY: y,
      head: [["Comprobación", "Valores fuente / operación", "Comparación", "Delta"]],
      body: equationRows,
      theme: "plain",
      styles: { font: "helvetica", fontSize: 7, textColor: COLORS.ink, cellPadding: 2.2, lineColor: COLORS.line, lineWidth: { bottom: 0.2 }, overflow: "linebreak" },
      headStyles: { fillColor: COLORS.green, textColor: COLORS.white, fontStyle: "bold", lineWidth: 0 },
      alternateRowStyles: { fillColor: COLORS.surface },
      columnStyles: { 0: { cellWidth: 48, fontStyle: "bold" }, 1: { cellWidth: 55 }, 2: { cellWidth: 48 }, 3: { cellWidth: 31, halign: "right", fontStyle: "bold" } },
      margin: { left: PAGE.left, right: PAGE.right, top: PAGE.top, bottom: PAGE.bottom },
      rowPageBreak: "avoid",
    });
    y = getFinalY(doc) + 5;
    if (salesDelta !== null && Math.abs(salesDelta) > 0.01) {
      y = ensureSpace(doc, y, 12);
      setFill(doc, COLORS.warningSoft);
      doc.roundedRect(PAGE.left, y, 182, 10, 2, 2, "F");
      setText(doc, COLORS.warning);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.text("La venta neta fuente puede incluir cancelaciones, reembolsos o ajustes. Se muestra el delta sin recalcularla.", PAGE.left + 4, y + 6, { maxWidth: 174 });
      y += 14;
    }
    if ((payload.missingData ?? []).length) {
      autoTable(doc, {
        startY: y,
        head: [["Dato faltante", "Impacto exacto"]],
        body: (payload.missingData ?? []).map((item) => [item.label, item.impact]),
        theme: "plain",
        styles: { font: "helvetica", fontSize: 7.2, textColor: COLORS.ink, cellPadding: 2.1, lineColor: COLORS.line, lineWidth: { bottom: 0.2 } },
        headStyles: { fillColor: COLORS.warning, textColor: COLORS.white, fontStyle: "bold", lineWidth: 0 },
        alternateRowStyles: { fillColor: COLORS.warningSoft },
        columnStyles: { 0: { cellWidth: 55, fontStyle: "bold" }, 1: { cellWidth: 127 } },
        margin: { left: PAGE.left, right: PAGE.right, top: PAGE.top, bottom: PAGE.bottom },
        rowPageBreak: "avoid",
      });
      y = getFinalY(doc) + 5;
    }
  }

  if (payload.document.visibleType === "cash-cut") {
    autoTable(doc, {
      startY: y,
      head: [["Arqueo de caja", "Valor fuente"]],
      body: cashRows,
      theme: "plain",
      styles: { font: "helvetica", fontSize: 7.5, textColor: COLORS.ink, cellPadding: 2.2, lineColor: COLORS.line, lineWidth: { bottom: 0.2 } },
      headStyles: { fillColor: COLORS.greenDark, textColor: COLORS.white, fontStyle: "bold", lineWidth: 0 },
      alternateRowStyles: { fillColor: COLORS.surface },
      columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
      margin: { left: PAGE.left, right: PAGE.right, top: PAGE.top, bottom: PAGE.bottom },
      rowPageBreak: "avoid",
    });
    y = getFinalY(doc) + 5;
  } else if (reconciliation?.applicable) {
    y = ensureSpace(doc, y, 10);
    setText(doc, COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.4);
    doc.text("Arqueo de caja: N/A para este reporte conservador.", PAGE.left, y + 4);
    y += 9;
  }
  if (payload.inventory.available) {
    y = ensureSpace(doc, y, 18);
    const reconciled = inventoryRows.filter((row) => row.diferencia.available && row.diferencia.value !== null);
    const mismatches = reconciled.filter((row) => row.diferencia.value !== 0);
    const units = inventoryRows.reduce((total, row) => total + (metricValue(row.vendidas) ?? 0), 0);
    autoTable(doc, {
      startY: y,
      head: [["Inventario", "Productos", "Conciliados", "Con diferencia", "Unidades vendidas"]],
      body: [["Resumen físico", String(inventoryRows.length), String(reconciled.length), String(mismatches.length), units.toLocaleString("es-MX")]],
      theme: "plain",
      styles: { font: "helvetica", fontSize: 8, textColor: COLORS.ink, cellPadding: 2.5, halign: "center" },
      headStyles: { fillColor: COLORS.greenSoft, textColor: COLORS.greenDark, fontStyle: "bold" },
      margin: { left: PAGE.left, right: PAGE.right, top: PAGE.top, bottom: PAGE.bottom },
      rowPageBreak: "avoid",
    });
    y = getFinalY(doc) + 7;
  }
  return y;
};

const addAppendix = (
  doc: jsPDF,
  payload: CortePdfPayloadV1,
  extraTables: CortePdfExtraTable[],
  startY: number,
) => {
  const model = buildCortePdfPrintModel(payload);
  let y = ensureSpace(doc, startY, 32);
  y = drawSectionHeading(
    doc,
    y,
    "Apéndice · Detalle y auditoría",
    "Valores fuente del snapshot. N/D significa que el dato no fue expuesto; cero es un valor válido.",
  );

  for (const section of model.sections) {
    const body = section.rows
      .filter((row) => row.value !== "N/D")
      .map((row) => [row.label, row.value]);
    const onlyNonAdditiveNote = section.title === "Beneficios (no aditivos)" &&
      body.every((row) => row[0] === "Criterio");
    const alreadyShownAsKpis = section.title === "Resumen por concesión" && payload.rollup?.available;
    if (!body.length || onlyNonAdditiveNote || alreadyShownAsKpis) continue;
    autoTable(doc, {
      startY: y,
      head: [[section.title, "Valor"]],
      body,
      theme: "plain",
      styles: { font: "helvetica", fontSize: 7.6, textColor: COLORS.ink, cellPadding: 2.2, lineColor: COLORS.line, lineWidth: { bottom: 0.2 } },
      headStyles: { fillColor: COLORS.greenDark, textColor: COLORS.white, fontStyle: "bold", lineWidth: 0 },
      alternateRowStyles: { fillColor: COLORS.surface },
      columnStyles: { 0: { cellWidth: 70, fontStyle: "bold" }, 1: { cellWidth: 112 } },
      margin: { left: PAGE.left, right: PAGE.right, top: PAGE.top, bottom: PAGE.bottom },
      rowPageBreak: "avoid",
      showHead: "everyPage",
    });
    y = getFinalY(doc) + 7;
  }

  if (model.inventoryRows.length) {
    autoTable(doc, {
      startY: y,
      head: [["ID", "Producto", "Inicial", "Entradas", "Vendido", "Abonado", "Cortesías", "Merma", "Esperado", "Físico", "Diferencia", "Estado"]],
      body: model.inventoryRows,
      theme: "plain",
      styles: { font: "helvetica", fontSize: 5.5, textColor: COLORS.ink, cellPadding: 1.25, lineColor: COLORS.line, lineWidth: { bottom: 0.15 }, overflow: "linebreak" },
      headStyles: { fillColor: COLORS.green, textColor: COLORS.white, fontStyle: "bold", lineWidth: 0 },
      alternateRowStyles: { fillColor: COLORS.surface },
      margin: { left: PAGE.left, right: PAGE.right, top: PAGE.top, bottom: PAGE.bottom },
      rowPageBreak: "avoid",
      showHead: "everyPage",
    });
    y = getFinalY(doc) + 7;
  }

  if (model.incidentRows.length) {
    autoTable(doc, {
      startY: y,
      head: [["Incidencia", "Detalle"]],
      body: model.incidentRows,
      theme: "plain",
      styles: { font: "helvetica", fontSize: 7.4, textColor: COLORS.ink, cellPadding: 2.2, lineColor: COLORS.line, lineWidth: { bottom: 0.2 } },
      headStyles: { fillColor: COLORS.danger, textColor: COLORS.white, fontStyle: "bold", lineWidth: 0 },
      alternateRowStyles: { fillColor: COLORS.surface },
      columnStyles: { 0: { cellWidth: 62, fontStyle: "bold" }, 1: { cellWidth: 120 } },
      margin: { left: PAGE.left, right: PAGE.right, top: PAGE.top, bottom: PAGE.bottom },
      rowPageBreak: "avoid",
      showHead: "everyPage",
    });
    y = getFinalY(doc) + 7;
  }

  for (const table of extraTables.filter((item) => item.body.length)) {
    y = drawSectionHeading(doc, y, table.title);
    autoTable(doc, {
      startY: y,
      head: [table.head],
      body: table.body,
      theme: "plain",
      styles: { font: "helvetica", fontSize: 6.8, textColor: COLORS.ink, cellPadding: 1.8, lineColor: COLORS.line, lineWidth: { bottom: 0.15 }, overflow: "linebreak" },
      headStyles: { fillColor: COLORS.greenDark, textColor: COLORS.white, fontStyle: "bold", lineWidth: 0 },
      alternateRowStyles: { fillColor: COLORS.surface },
      margin: { left: PAGE.left, right: PAGE.right, top: PAGE.top, bottom: PAGE.bottom },
      rowPageBreak: "avoid",
      showHead: "everyPage",
    });
    y = getFinalY(doc) + 7;
  }
};

const addPageChrome = (doc: jsPDF, payload: CortePdfPayloadV1) => {
  const total = doc.getNumberOfPages();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  for (const [index, label] of buildCortePdfPageLabels(total).entries()) {
    const page = index + 1;
    doc.setPage(page);
    if (page > 1) {
      setFill(doc, COLORS.greenDark);
      doc.rect(0, 0, width, 12, "F");
      setText(doc, COLORS.white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(getCortePdfContinuationHeader(payload).toLocaleUpperCase("es-MX"), PAGE.left, 8);
      doc.setFont("helvetica", "normal");
      doc.text(payload.document.readableFolio ?? payload.document.folio, width - PAGE.right, 8, { align: "right", maxWidth: 82 });
    }
    setDraw(doc, COLORS.line);
    doc.setLineWidth(0.25);
    doc.line(PAGE.left, height - 13, width - PAGE.right, height - 13);
    setText(doc, COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Resumen determinista · El valor con puntos se presenta por separado", PAGE.left, height - 8);
    doc.text(label, width - PAGE.right, height - 8, { align: "right" });
  }
};

export function createCortePdfDocument(
  payload: CortePdfPayloadV1,
  extraTables: CortePdfExtraTable[] = [],
): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  doc.setProperties({
    title: `${payload.document.visibleTypeLabel ?? "Reporte de jornada"} ${payload.document.readableFolio ?? payload.document.folio}`,
    subject: "Resumen operativo determinista de corte",
    author: "Club León",
    creator: "Punto de venta de concesiones",
    keywords: "corte, caja, inventario, conciliación",
  });
  let y = drawExecutiveHeader(doc, payload);
  y = drawSmartSummary(doc, payload, y);
  y = drawKpis(doc, payload, y);
  y = drawRollupBenefits(doc, payload, y);
  y = drawPayments(doc, payload, y);
  y = drawReconciliation(doc, payload, y);
  addAppendix(doc, payload, extraTables, y + 3);
  addPageChrome(doc, payload);
  return doc;
}

export function saveCortePdfDocument(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

const renderPayload = (
  payload: CortePdfPayloadV1,
  filename: string,
  extraTables: CortePdfExtraTable[] = [],
) => saveCortePdfDocument(createCortePdfDocument(payload, extraTables), filename);

const reportExtraTables = (report: CorteReport): CortePdfExtraTable[] => [
  {
    title: "Puntos y descuentos por concesión",
    head: ["Concesión", "Puntos canjeados", "Valor cubierto con puntos", "Descuentos aplicados"],
    body: report.resumen.map((row) => [
      row.nombre,
      row.totalPuntosCanjeados === undefined ? "N/D" : row.totalPuntosCanjeados.toLocaleString("es-MX"),
      row.valorPuntosCanjeados === undefined ? "N/D" : formatPrice(row.valorPuntosCanjeados),
      row.descuentos === undefined ? "N/D" : formatPrice(row.descuentos),
    ]),
  },
  {
    title: "Detalle por producto",
    head: ["Producto", "Vendido", "Abonado", "Cortesías", "Puntos canjeados", "Valor cubierto con puntos", "Venta total"],
    body: (report.productos ?? []).map((row) => {
      const points = getCortePdfProductPointPresentation(row.puntosCanjeados);
      return [
        row.nombre,
        row.cantidadRegular.toLocaleString("es-MX"),
        row.cantidadAbonado.toLocaleString("es-MX"),
        row.cortesias.toLocaleString("es-MX"),
        points.redeemedPoints.available && points.redeemedPoints.value !== null
          ? points.redeemedPoints.value.toLocaleString("es-MX")
          : "N/D",
        points.coveredValue.available && points.coveredValue.value !== null
          ? formatPrice(points.coveredValue.value)
          : "N/D",
        formatPrice(row.ventasTotales),
      ];
    }),
  },
  {
    title: "Detalle por concesión",
    head: ["Concesión", "Comisión %", "Base comisionable", "Comisión", "Neto posterior a comisión"],
    body: report.resumen.map((row) => [
      row.nombre,
      `${row.porcentajeComision}%`,
      formatPrice(row.totalVenta),
      formatPrice(row.comision),
      formatPrice(row.gananciaConcesion),
    ]),
  },
];

export function downloadReporteConcesionPdf(report: CorteReport, labels: ScopeLabels): void;
export function downloadReporteConcesionPdf(report: CorteReport, concessionName: string): void;
export function downloadReporteConcesionPdf(report: CorteReport, labels: ScopeLabels, options: CortePdfGenerationOptions): void;
export function downloadReporteConcesionPdf(report: CorteReport, concessionName: string, options: CortePdfGenerationOptions): void;
export function downloadReporteConcesionPdf(
  report: CorteReport,
  labelsOrConcession: ScopeLabels | string,
  options: CortePdfGenerationOptions = {},
): void {
  const labels = normalizeCortePdfScopeLabels(labelsOrConcession);
  const payload = buildReportCortePdfPayload(report, labels, options);
  const concessionName = labels.concesion ?? "sin-concesion";
  renderPayload(
    payload,
    `corte-${report.jornada.fecha}-${concessionName.replace(/[^\w-]+/g, "-")}.pdf`,
    reportExtraTables(report),
  );
}

export function downloadReporteConsolidadoPdf(report: CorteReport, options: CortePdfGenerationOptions = {}) {
  const payload = buildReportCortePdfPayload(report, {}, options);
  renderPayload(
    payload,
    `corte-consolidado-${report.jornada.fecha}.pdf`,
    reportExtraTables(report),
  );
}

export function downloadCorteHistoricoPdf(
  corte: CorteHistoryItem,
  labels: ScopeLabels = {},
  documentType: "historical-cut" | "close-snapshot" = "historical-cut",
  options: CortePdfGenerationOptions = {},
) {
  const payload = buildHistoricalCortePdfPayload(corte, labels, documentType, options);
  const safeId = corte.id.replace(/[^\w-]/g, "-") || "sin-folio";
  renderPayload(payload, `corte-${safeId}.pdf`);
}
