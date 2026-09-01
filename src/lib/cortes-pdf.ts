import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPrice } from "@/lib/format";
import { parseJornadaId, ramaLabel } from "@/lib/jornada";
import {
  alignNumericColumns,
  alignNumericHead,
  CONTENT_TOP,
  drawMetaStrip,
  drawReportHeader,
  drawSectionTitle,
  ensureSpace,
  PDF_BRAND,
  stampFooters,
  tableTheme,
  type ReportHeaderInfo,
} from "@/lib/pdf/report-chrome";
import {
  precioEfectivoDivergente,
  toDesgloseGeneralRow,
  toDesgloseGeneralTotales,
} from "@/lib/cortes-desglose-general";
import type { ConcessionTipo, ReporteCortes } from "@/lib/types";

const money = (value: number) => formatPrice(value);
const dashOrMoney = (value: number) => (value > 0 ? money(value) : "—");
const dashOrQty = (value: number) =>
  value > 0 ? value.toLocaleString("es-MX") : "—";

/** Venta total (comisión): monto + nota de que incluye POS y palcos. */
const moneyTotalIncluyePosPalcos = (value: number) =>
  `${money(value)}\nIncluye POS y palcos`;

/** Venta palcos (comisión): monto + qty o “Sin ventas palcos”. */
const moneyVentaPalcosComision = (monto: number, qty: number) => {
  const line = money(monto);
  if (qty > 0) {
    return `${line}\n${qty} venta${qty === 1 ? "" : "s"} · incluido en total`;
  }
  return `${line}\nSin ventas palcos`;
};

/** Venta palcos por producto: monto con nota, o guión si es 0. */
const moneyProductoPalcos = (value: number) =>
  value > 0 ? `${money(value)}\nincluido en total` : "—";

/** V. totales por producto: monto + nota de inclusión. */
const moneyTotalesIncluyePosPalcos = (value: number) =>
  value > 0 ? `${money(value)}\nIncluye POS y palcos` : "—";

const getFinalY = (doc: jsPDF) =>
  (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

/** Espacio minimo para no dejar un titulo de seccion solo al pie de la hoja. */
const SECTION_MIN_SPACE = 30;

const metaItems = (reporte: ReporteCortes) => {
  const rama =
    reporte.jornada.rama ??
    parseJornadaId(reporte.jornada.jornadaId)?.rama ??
    "varonil";
  return [
    { label: "Jornada", value: `Jornada ${reporte.jornada.numero}` },
    { label: "Rama", value: ramaLabel(rama) },
    { label: "Fecha", value: reporte.jornada.fecha },
    { label: "Generado", value: new Date().toLocaleString("es-MX") },
  ];
};

/** Precio único compartido por todos los productos (para encabezado del PDF). */
const sharedUnitPrice = (
  productos: NonNullable<ReporteCortes["productos"]>,
  getPrice: (row: NonNullable<ReporteCortes["productos"]>[number]) => number,
): number | null => {
  const prices = new Set<number>();
  for (const row of productos) {
    const price = getPrice(row);
    if (price > 0) prices.add(Math.round(price * 100) / 100);
  }
  if (prices.size !== 1) return null;
  return [...prices][0];
};

const abonadoUnitPrice = (
  row: NonNullable<ReporteCortes["productos"]>[number],
): number => {
  if (
    row.precioActual != null &&
    row.precioActual > 0 &&
    row.descuentoAbonado != null &&
    row.descuentoAbonado > 0
  ) {
    return Math.round((row.precioActual - row.descuentoAbonado) * 100) / 100;
  }
  if (row.cantidadAbonado > 0 && row.ventasAbonado > 0) {
    return Math.round((row.ventasAbonado / row.cantidadAbonado) * 100) / 100;
  }
  return 0;
};

/** Tabla de desglose lista para autotable, con cuantas filas finales son totales. */
type ProductosTable = {
  head: string[];
  body: string[][];
  footerCount: number;
};

/** Fila de pie con la etiqueta a la izquierda y un unico monto a la derecha. */
const footerRow = (label: string, value: string, columns: number): string[] => [
  label,
  ...Array<string>(columns - 2).fill(""),
  value,
];

/** Cervecería: separa venta regular de venta de abonado y su precio especial. */
const productosTableCerveceria = (reporte: ReporteCortes): ProductosTable => {
  const productos = reporte.productos ?? [];
  const precioRegularShared = sharedUnitPrice(productos, (row) =>
    Number(row.precioActual ?? 0),
  );
  const precioAbonadoShared = sharedUnitPrice(productos, abonadoUnitPrice);

  const head = [
    "Producto",
    "Inv. ini.",
    "Inv. fin.",
    "Venta reg.",
    precioRegularShared != null
      ? `Precio regular (${money(precioRegularShared)})`
      : "Precio regular",
    "Venta. abon.",
    precioAbonadoShared != null
      ? `Precio abonado (${money(precioAbonadoShared)})`
      : "Precio abonado",
    "Cortesías",
    "Puntos ($)",
    "Venta palcos",
    "V. totales",
  ];

  const body = productos.map((row) => [
    row.nombre,
    String(row.inventarioInicial),
    String(row.inventarioFinal),
    dashOrQty(row.cantidadRegular),
    dashOrMoney(row.ventasRegular),
    dashOrQty(row.cantidadAbonado),
    dashOrMoney(row.ventasAbonado),
    dashOrQty(row.cortesias),
    dashOrMoney(row.puntosCanjeados),
    moneyProductoPalcos(Number(row.ventaPalcos ?? 0)),
    moneyTotalesIncluyePosPalcos(row.ventasTotales),
  ]);

  const t = reporte.productoTotales;
  if (!t) return { head, body, footerCount: 0 };

  body.push([
    "Totales",
    "—",
    "—",
    dashOrQty(t.cantidadRegular),
    dashOrMoney(t.ventasRegular),
    dashOrQty(t.cantidadAbonado),
    dashOrMoney(t.ventasAbonado),
    dashOrQty(t.cortesias),
    dashOrMoney(t.puntosCanjeados),
    moneyProductoPalcos(Number(t.ventaPalcos ?? 0)),
    moneyTotalesIncluyePosPalcos(t.ventasTotales),
  ]);
  body.push(
    footerRow(
      "Menos puntos canjeados",
      t.puntosCanjeados > 0 ? `-${money(t.puntosCanjeados)}` : "—",
      head.length,
    ),
  );
  body.push(footerRow("Dinero real", money(t.dineroReal), head.length));

  return { head, body, footerCount: 3 };
};

/**
 * Concesiones GENERAL: el 2x1 deja la unidad pagada y la gratis en la misma
 * venta, así que se resume en unidades vendidas x precio unitario.
 */
const productosTableGeneral = (reporte: ReporteCortes): ProductosTable => {
  const productos = reporte.productos ?? [];
  const rows = productos.map(toDesgloseGeneralRow);
  const precioShared = sharedUnitPrice(productos, (row) =>
    Number(row.precioActual ?? 0),
  );

  const head = [
    "Producto",
    "Inv. ini.",
    "Inv. fin.",
    "Ventas",
    precioShared != null
      ? `Precio unit. (${money(precioShared)})`
      : "Precio unit.",
    "Cortesías",
    "Venta palcos",
    "V. totales",
  ];

  const body = rows.map((row) => {
    const divergente = precioEfectivoDivergente(row);
    return [
      row.nombre,
      String(row.inventarioInicial),
      String(row.inventarioFinal),
      dashOrQty(row.ventas),
      divergente != null
        ? `${dashOrMoney(row.precioUnitario)} (cobrado ${money(divergente)})`
        : dashOrMoney(row.precioUnitario),
      dashOrQty(row.cortesias),
      moneyProductoPalcos(row.ventaPalcos),
      moneyTotalesIncluyePosPalcos(row.ventasTotales),
    ];
  });

  if (!reporte.productoTotales) return { head, body, footerCount: 0 };

  const t = toDesgloseGeneralTotales(reporte.productoTotales);
  const puntos = reporte.ingresos?.totalPuntosCanjeados ?? 0;

  body.push([
    "Totales",
    "—",
    "—",
    dashOrQty(t.ventas),
    "—",
    dashOrQty(t.cortesias),
    moneyProductoPalcos(t.ventaPalcos),
    moneyTotalesIncluyePosPalcos(t.ventasTotales),
  ]);

  let footerCount = 2;
  if (t.puntosCanjeadosMonto > 0) {
    body.push(
      footerRow(
        puntos > 0
          ? `Menos puntos canjeados (${puntos.toLocaleString("es-MX")} pts)`
          : "Menos puntos canjeados",
        `-${money(t.puntosCanjeadosMonto)}`,
        head.length,
      ),
    );
    footerCount = 3;
  }

  body.push(footerRow("Dinero real", money(t.dineroReal), head.length));

  return { head, body, footerCount };
};

const productosTable = (
  reporte: ReporteCortes,
  tipo: ConcessionTipo,
): ProductosTable =>
  tipo === "CERVECERIA"
    ? productosTableCerveceria(reporte)
    : productosTableGeneral(reporte);

export function buildReporteConcesionDoc(
  reporte: ReporteCortes,
  concesionNombre: string,
  tipo: ConcessionTipo = reporte.concesion?.tipo ?? "GENERAL",
): jsPDF {
  const doc = new jsPDF({ orientation: "landscape" });
  const header: ReportHeaderInfo = {
    title: "Reporte de corte",
    subtitle: concesionNombre,
  };

  drawReportHeader(doc, header);
  drawMetaStrip(doc, 31, metaItems(reporte));

  let cursorY = CONTENT_TOP;

  if (reporte.ingresos) {
    cursorY = drawSectionTitle(doc, cursorY, "Resumen de ingresos") + 3;

    autoTable(doc, {
      ...tableTheme(9),
      startY: cursorY,
      head: [["Concepto", "Monto"]],
      body: [
        ["Venta neta", money(reporte.ingresos.ventaNeta)],
        ["Efectivo", money(reporte.ingresos.totalEfectivo)],
        ["Tarjeta", money(reporte.ingresos.totalTarjeta)],
        [
          "Puntos canjeados",
          `${reporte.ingresos.totalPuntosCanjeados.toLocaleString("es-MX")} pts (${money(reporte.ingresos.totalPuntosMonto)})`,
        ],
      ],
      tableWidth: "wrap",
      columnStyles: {
        0: { halign: "left", cellWidth: 72 },
        1: { halign: "right", cellWidth: 52 },
      },
      didParseCell: alignNumericHead,
      didDrawPage: () => drawReportHeader(doc, header),
    });

    cursorY = getFinalY(doc) + 12;
  }

  if (reporte.productos && reporte.productos.length > 0) {
    cursorY = ensureSpace(doc, cursorY, SECTION_MIN_SPACE, header);
    cursorY = drawSectionTitle(doc, cursorY, "Desglose por producto") + 3;

    const { head, body, footerCount } = productosTable(reporte, tipo);
    const footerStart = body.length - footerCount;

    autoTable(doc, {
      ...tableTheme(7),
      startY: cursorY,
      head: [head],
      body,
      columnStyles: alignNumericColumns(head.length),
      didParseCell: (data) => {
        alignNumericHead(data);
        if (data.section === "body" && data.row.index >= footerStart) {
          data.cell.styles.fontStyle = "bold";
          // Los totales se leen como un bloque, sin el zebrado del cuerpo.
          data.cell.styles.fillColor = PDF_BRAND.white;
          if (data.row.index === body.length - 1) {
            data.cell.styles.fillColor = PDF_BRAND.highlight;
          }
        }
      },
      didDrawPage: () => drawReportHeader(doc, header),
    });

    cursorY = getFinalY(doc) + 12;
  }

  const resumen = reporte.resumen[0];
  if (resumen) {
    cursorY = ensureSpace(doc, cursorY, SECTION_MIN_SPACE, header);
    cursorY = drawSectionTitle(doc, cursorY, "Resumen de comisión") + 3;

    autoTable(doc, {
      ...tableTheme(9),
      startY: cursorY,
      head: [
        [
          "Concesión",
          "Comisión %",
          "Venta total",
          "Venta Palcos",
          "Comisión",
          "Total final",
        ],
      ],
      body: [
        [
          resumen.nombre,
          `${resumen.porcentajeComision}%`,
          moneyTotalIncluyePosPalcos(resumen.totalVenta),
          moneyVentaPalcosComision(
            Number(resumen.ventaPalcos ?? 0),
            Number(resumen.cantidadVentasPalcos ?? 0),
          ),
          money(resumen.comision),
          money(resumen.gananciaConcesion),
        ],
      ],
      columnStyles: alignNumericColumns(6),
      didParseCell: alignNumericHead,
      didDrawPage: () => drawReportHeader(doc, header),
    });
  }

  stampFooters(doc);
  return doc;
}

export function buildReporteConsolidadoDoc(reporte: ReporteCortes): jsPDF {
  const doc = new jsPDF({ orientation: "landscape" });
  const header: ReportHeaderInfo = {
    title: "Reporte consolidado de cortes",
    subtitle: "Todas las concesiones",
  };

  drawReportHeader(doc, header);
  drawMetaStrip(doc, 31, metaItems(reporte));

  const totals = reporte.resumen.reduce(
    (acc, row) => ({
      totalVenta: acc.totalVenta + row.totalVenta,
      ventaPalcos: acc.ventaPalcos + Number(row.ventaPalcos ?? 0),
      cantidadVentasPalcos:
        acc.cantidadVentasPalcos + Number(row.cantidadVentasPalcos ?? 0),
      comision: acc.comision + row.comision,
      gananciaConcesion: acc.gananciaConcesion + row.gananciaConcesion,
    }),
    {
      totalVenta: 0,
      ventaPalcos: 0,
      cantidadVentasPalcos: 0,
      comision: 0,
      gananciaConcesion: 0,
    },
  );

  const body = reporte.resumen.map((row) => [
    row.nombre,
    `${row.porcentajeComision}%`,
    moneyTotalIncluyePosPalcos(row.totalVenta),
    moneyVentaPalcosComision(
      Number(row.ventaPalcos ?? 0),
      Number(row.cantidadVentasPalcos ?? 0),
    ),
    money(row.comision),
    money(row.gananciaConcesion),
  ]);

  if (reporte.resumen.length > 1) {
    body.push([
      "TOTAL",
      "—",
      moneyTotalIncluyePosPalcos(totals.totalVenta),
      moneyVentaPalcosComision(totals.ventaPalcos, totals.cantidadVentasPalcos),
      money(totals.comision),
      money(totals.gananciaConcesion),
    ]);
  }

  const cursorY = drawSectionTitle(doc, CONTENT_TOP, "Resumen por concesión") + 3;

  autoTable(doc, {
    ...tableTheme(9),
    startY: cursorY,
    head: [
      [
        "Concesión",
        "Comisión %",
        "Venta total",
        "Venta Palcos",
        "Comisión",
        "Total final",
      ],
    ],
    body,
    columnStyles: alignNumericColumns(6),
    didParseCell: (data) => {
      alignNumericHead(data);
      if (
        data.section === "body" &&
        data.row.index === body.length - 1 &&
        reporte.resumen.length > 1
      ) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = PDF_BRAND.highlight;
      }
    },
    didDrawPage: () => drawReportHeader(doc, header),
  });

  stampFooters(doc);
  return doc;
}

export function downloadReporteConcesionPdf(
  reporte: ReporteCortes,
  concesionNombre: string,
  tipo?: ConcessionTipo,
) {
  const doc = buildReporteConcesionDoc(reporte, concesionNombre, tipo);
  const safeName = concesionNombre.replace(/[^\w\s-]/g, "").trim() || "concesion";
  doc.save(`corte-${safeName}-${reporte.jornada.fecha}.pdf`);
}

export function downloadReporteConsolidadoPdf(reporte: ReporteCortes) {
  const doc = buildReporteConsolidadoDoc(reporte);
  doc.save(`corte-consolidado-${reporte.jornada.fecha}.pdf`);
}
