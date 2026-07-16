import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPrice } from "@/lib/format";
import type { ReporteCortes } from "@/lib/types";

const money = (value: number) => formatPrice(value);
const dashOrMoney = (value: number) => (value > 0 ? money(value) : "—");
const dashOrQty = (value: number) =>
  value > 0 ? value.toLocaleString("es-MX") : "—";

const addHeader = (doc: jsPDF, title: string, subtitle: string) => {
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(subtitle, 14, 26);
  doc.setTextColor(0);
};

const getFinalY = (doc: jsPDF) =>
  (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

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

const productosTableBody = (reporte: ReporteCortes) => {
  const rows =
    reporte.productos?.map((row) => [
      row.nombre,
      String(row.inventarioInicial),
      String(row.inventarioFinal),
      dashOrQty(row.cantidadRegular),
      dashOrQty(row.cantidadAbonado),
      dashOrMoney(row.ventasRegular),
      dashOrMoney(row.ventasAbonado),
      dashOrQty(row.cortesias),
      dashOrMoney(row.puntosCanjeados),
      dashOrMoney(row.ventasTotales),
    ]) ?? [];

  const t = reporte.productoTotales;
  if (t) {
    rows.push([
      "Totales",
      "—",
      "—",
      dashOrQty(t.cantidadRegular),
      dashOrQty(t.cantidadAbonado),
      dashOrMoney(t.ventasRegular),
      dashOrMoney(t.ventasAbonado),
      dashOrQty(t.cortesias),
      dashOrMoney(t.puntosCanjeados),
      dashOrMoney(t.ventasTotales),
    ]);
    rows.push([
      "Menos puntos canjeados",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      t.puntosCanjeados > 0 ? `-${money(t.puntosCanjeados)}` : "—",
    ]);
    rows.push([
      "Dinero real",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      money(t.dineroReal),
    ]);
  }

  return rows;
};

export function downloadReporteConcesionPdf(
  reporte: ReporteCortes,
  concesionNombre: string,
) {
  const doc = new jsPDF({ orientation: "landscape" });
  const generado = new Date().toLocaleString("es-MX");
  const jornadaLabel = `Jornada ${reporte.jornada.numero} · ${reporte.jornada.fecha}`;

  addHeader(
    doc,
    `Reporte de corte — ${concesionNombre}`,
    `${jornadaLabel} · Generado: ${generado}`,
  );

  let startY = 34;

  if (reporte.ingresos) {
    autoTable(doc, {
      startY,
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
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 101, 52] },
    });
    startY = getFinalY(doc) + 10;
  }

  if (reporte.productos && reporte.productos.length > 0) {
    doc.setFontSize(12);
    doc.text("Desglose por producto", 14, startY);
    startY += 4;

    const body = productosTableBody(reporte);
    const footerStart = reporte.productoTotales
      ? body.length - 3
      : body.length;

    const productos = reporte.productos;
    const precioRegularShared = sharedUnitPrice(
      productos,
      (row) => Number(row.precioActual ?? 0),
    );
    const precioAbonadoShared = sharedUnitPrice(productos, abonadoUnitPrice);
    const headPrecioRegular =
      precioRegularShared != null
        ? `Precio regular (${money(precioRegularShared)})`
        : "Precio regular";
    const headPrecioAbonado =
      precioAbonadoShared != null
        ? `Precio abonado (${money(precioAbonadoShared)})`
        : "Precio abonado";

    autoTable(doc, {
      startY: startY + 2,
      head: [
        [
          "Producto",
          "Inv. ini.",
          "Inv. fin.",
          "Venta reg.",
          "Venta. abon.",
          headPrecioRegular,
          headPrecioAbonado,
          "Cortesías",
          "Puntos ($)",
          "V. totales",
        ],
      ],
      body,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [22, 101, 52] },
      didParseCell: (data) => {
        if (data.section === "body" && data.row.index >= footerStart) {
          data.cell.styles.fontStyle = "bold";
          if (data.row.index === body.length - 1) {
            data.cell.styles.fillColor = [220, 252, 231];
          }
        }
      },
    });

    startY = getFinalY(doc) + 10;
  }

  const resumen = reporte.resumen[0];
  if (resumen) {
    doc.setFontSize(12);
    doc.text("Resumen de comisión", 14, startY);

    autoTable(doc, {
      startY: startY + 4,
      head: [
        ["Concesión", "Comisión %", "Venta total", "Comisión", "Total final"],
      ],
      body: [
        [
          resumen.nombre,
          `${resumen.porcentajeComision}%`,
          money(resumen.totalVenta),
          money(resumen.comision),
          money(resumen.gananciaConcesion),
        ],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 101, 52] },
    });
  }

  const safeName = concesionNombre.replace(/[^\w\s-]/g, "").trim() || "concesion";
  doc.save(`corte-${safeName}-${reporte.jornada.fecha}.pdf`);
}

export function downloadReporteConsolidadoPdf(reporte: ReporteCortes) {
  const doc = new jsPDF({ orientation: "landscape" });
  const generado = new Date().toLocaleString("es-MX");
  const jornadaLabel = `Jornada ${reporte.jornada.numero} · ${reporte.jornada.fecha}`;

  addHeader(
    doc,
    "Reporte consolidado de cortes",
    `${jornadaLabel} · Generado: ${generado}`,
  );

  const totals = reporte.resumen.reduce(
    (acc, row) => ({
      totalVenta: acc.totalVenta + row.totalVenta,
      comision: acc.comision + row.comision,
      gananciaConcesion: acc.gananciaConcesion + row.gananciaConcesion,
    }),
    { totalVenta: 0, comision: 0, gananciaConcesion: 0 },
  );

  const body = reporte.resumen.map((row) => [
    row.nombre,
    `${row.porcentajeComision}%`,
    money(row.totalVenta),
    money(row.comision),
    money(row.gananciaConcesion),
  ]);

  if (reporte.resumen.length > 1) {
    body.push([
      "TOTAL",
      "—",
      money(totals.totalVenta),
      money(totals.comision),
      money(totals.gananciaConcesion),
    ]);
  }

  autoTable(doc, {
    startY: 34,
    head: [
      ["Concesión", "Comisión %", "Venta total", "Comisión", "Total final"],
    ],
    body,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [22, 101, 52] },
    didParseCell: (data) => {
      if (
        data.section === "body" &&
        data.row.index === body.length - 1 &&
        reporte.resumen.length > 1
      ) {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  doc.save(`corte-consolidado-${reporte.jornada.fecha}.pdf`);
}
