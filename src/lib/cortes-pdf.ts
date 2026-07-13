import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPrice } from "@/lib/format";
import type { ReporteCortes } from "@/lib/types";

const money = (value: number) => formatPrice(value);

const dashOrMoney = (value: number) => (value > 0 ? money(value) : "—");

const addHeader = (
  doc: jsPDF,
  title: string,
  subtitle: string,
) => {
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(subtitle, 14, 26);
  doc.setTextColor(0);
};

const getFinalY = (doc: jsPDF) =>
  (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

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
    doc.setFontSize(12);
    doc.text("Desglose de ingresos", 14, startY);
    startY += 4;

    autoTable(doc, {
      startY: startY + 2,
      head: [["Concepto", "Monto"]],
      body: [
        ["Venta neta (efectivo + tarjeta)", money(reporte.ingresos.ventaNeta)],
        ["Efectivo", money(reporte.ingresos.totalEfectivo)],
        ["Tarjeta", money(reporte.ingresos.totalTarjeta)],
        [
          "Puntos canjeados (informativo)",
          `${reporte.ingresos.totalPuntosCanjeados.toLocaleString("es-MX")} pts (${money(reporte.ingresos.totalPuntosMonto)})`,
        ],
        ["Cantidad de ventas", String(reporte.ingresos.cantidadVentas)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 101, 52] },
    });

    startY = getFinalY(doc) + 10;
  }

  if (reporte.tiposVenta && reporte.tiposVenta.length > 0) {
    doc.setFontSize(12);
    doc.text("Tipos de venta", 14, startY);
    startY += 4;

    autoTable(doc, {
      startY: startY + 2,
      head: [
        [
          "Tipo",
          "Trans.",
          "Efectivo",
          "Tarjeta",
          "Puntos ($)",
          "Valor total",
          "Desc. abonado",
        ],
      ],
      body: reporte.tiposVenta.map((row) => [
        row.etiqueta,
        String(row.transacciones),
        dashOrMoney(row.efectivo),
        dashOrMoney(row.tarjeta),
        dashOrMoney(row.puntosMonto),
        dashOrMoney(row.valorTotal),
        dashOrMoney(row.descuentoAbonado),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 101, 52] },
    });

    startY = getFinalY(doc) + 10;
  }

  if (
    reporte.promocionesAbonado &&
    reporte.promocionesAbonado.cantidadTransacciones > 0
  ) {
    doc.setFontSize(12);
    doc.text("Beneficios abonado", 14, startY);
    startY += 4;

    autoTable(doc, {
      startY: startY + 2,
      head: [["Transacciones", "Monto vendido", "Descuento", "Unidades gratis"]],
      body: [
        [
          String(reporte.promocionesAbonado.cantidadTransacciones),
          money(reporte.promocionesAbonado.montoTotal),
          money(reporte.promocionesAbonado.montoDescuento),
          String(reporte.promocionesAbonado.unidadesGratis),
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

    autoTable(doc, {
      startY: startY + 2,
      head: [
        [
          "Producto",
          "Inv. inicial",
          "Cant. vendida",
          "Precio unit.",
          "Inv. final",
          "Cortesías ($0)",
          "Total vendido",
        ],
      ],
      body: reporte.productos.map((row) => [
        row.nombre,
        String(row.inventarioInicial),
        String(row.cantidadVendida),
        money(row.precioUnitario),
        String(row.inventarioFinal),
        String(row.cortesias),
        money(row.totalVendido),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 101, 52] },
    });

    startY = getFinalY(doc) + 10;
  }

  const resumen = reporte.resumen[0];
  if (resumen) {
    doc.setFontSize(12);
    doc.text("Resumen de comisión", 14, startY);

    autoTable(doc, {
      startY: startY + 4,
      head: [["Concesión", "Comisión %", "Venta total", "Comisión", "Total final"]],
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
    head: [["Concesión", "Comisión %", "Venta total", "Comisión", "Total final"]],
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
