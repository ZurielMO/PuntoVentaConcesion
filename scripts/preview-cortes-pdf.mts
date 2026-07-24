/**
 * Genera PDFs de muestra de cortes en `tmp/` para revisar el diseño sin tener
 * que levantar la app ni cerrar una jornada real.
 *
 *   npm run pdf:preview
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildReporteConcesionDoc,
  buildReporteConsolidadoDoc,
} from "@/lib/cortes-pdf";
import type { ReporteCortes, ReporteProductoRow } from "@/lib/types";

const PRECIO_REGULAR = 75;
const DESCUENTO_ABONADO = 15;

const NOMBRES = [
  "Cerveza Victoria 355ml",
  "Cerveza Modelo Especial 355ml",
  "Refresco Coca-Cola 600ml",
  "Agua Ciel 1L",
  "Palomitas grandes",
  "Nachos con queso",
  "Hot dog sencillo",
  "Hamburguesa clásica",
  "Papas fritas",
  "Café americano",
  "Chocolate caliente",
  "Gomitas surtidas",
  "Cacahuates japoneses",
  "Michelada preparada",
  "Elote en vaso",
  "Torta de jamón",
  "Pizza rebanada",
  "Churros con azúcar",
  "Malteada de vainilla",
  "Té helado",
  "Boneless BBQ",
  "Alitas buffalo",
  "Esquites con queso",
  "Paleta helada",
];

const buildProducto = (nombre: string, index: number): ReporteProductoRow => {
  const inventarioInicial = 120 + index * 7;
  const cantidadRegular = 18 + ((index * 5) % 40);
  const cantidadAbonado = index % 4 === 0 ? 0 : 4 + (index % 9);
  const cortesias = index % 5 === 0 ? 2 : 0;
  const puntosCanjeados = index % 3 === 0 ? 0 : (index % 6) * 12.5;
  const ventasRegular = cantidadRegular * PRECIO_REGULAR;
  const ventasAbonado = cantidadAbonado * (PRECIO_REGULAR - DESCUENTO_ABONADO);

  return {
    productoId: `p-${index}`,
    nombre,
    inventarioInicial,
    inventarioFinal:
      inventarioInicial - cantidadRegular - cantidadAbonado - cortesias,
    cantidadRegular,
    cantidadAbonado,
    ventasRegular,
    ventasAbonado,
    cortesias,
    puntosCanjeados,
    ventasTotales: ventasRegular + ventasAbonado,
    precioActual: PRECIO_REGULAR,
    descuentoAbonado: DESCUENTO_ABONADO,
  };
};

const buildReporteConcesion = (totalProductos: number): ReporteCortes => {
  const productos = NOMBRES.slice(0, totalProductos).map(buildProducto);
  const sum = (pick: (row: ReporteProductoRow) => number) =>
    productos.reduce((total, row) => total + pick(row), 0);

  const ventasTotales = sum((row) => row.ventasTotales);
  const puntosCanjeados = sum((row) => row.puntosCanjeados);

  return {
    jornada: { fecha: "2026-07-14", numero: 11, jornadaId: "2026-07-14__J11" },
    productos,
    productoTotales: {
      cantidadRegular: sum((row) => row.cantidadRegular),
      cantidadAbonado: sum((row) => row.cantidadAbonado),
      ventasRegular: sum((row) => row.ventasRegular),
      ventasAbonado: sum((row) => row.ventasAbonado),
      cortesias: sum((row) => row.cortesias),
      puntosCanjeados,
      ventasTotales,
      dineroReal: ventasTotales - puntosCanjeados,
    },
    resumen: [
      {
        concesionId: "con-norte",
        nombre: "Concesión Norte",
        porcentajeComision: 18,
        totalVenta: ventasTotales,
        comision: Math.round(ventasTotales * 0.18 * 100) / 100,
        gananciaConcesion: Math.round(ventasTotales * 0.82 * 100) / 100,
      },
    ],
    ingresos: {
      ventaNeta: ventasTotales,
      totalEfectivo: Math.round(ventasTotales * 0.62 * 100) / 100,
      totalTarjeta: Math.round(ventasTotales * 0.38 * 100) / 100,
      totalPuntosMonto: puntosCanjeados,
      totalPuntosCanjeados: Math.round(puntosCanjeados * 10),
      ventasConPuntos: 14,
      cantidadVentas: 268,
    },
  };
};

const reporteConsolidado: ReporteCortes = {
  jornada: { fecha: "2026-07-14", numero: 11, jornadaId: "2026-07-14__J11" },
  productos: null,
  productoTotales: null,
  ingresos: null,
  resumen: [
    {
      concesionId: "con-norte",
      nombre: "Concesión Norte",
      porcentajeComision: 18,
      totalVenta: 184320,
      comision: 33177.6,
      gananciaConcesion: 151142.4,
    },
    {
      concesionId: "con-sur",
      nombre: "Concesión Sur",
      porcentajeComision: 15,
      totalVenta: 143890,
      comision: 21583.5,
      gananciaConcesion: 122306.5,
    },
    {
      concesionId: "con-oriente",
      nombre: "Concesión Oriente",
      porcentajeComision: 20,
      totalVenta: 98640,
      comision: 19728,
      gananciaConcesion: 78912,
    },
    {
      concesionId: "con-poniente",
      nombre: "Concesión Poniente Palcos",
      porcentajeComision: 12,
      totalVenta: 76210,
      comision: 9145.2,
      gananciaConcesion: 67064.8,
    },
  ],
};

const outDir = join(process.cwd(), "tmp");
mkdirSync(outDir, { recursive: true });

const write = (name: string, doc: { output: (type: "arraybuffer") => ArrayBuffer }) => {
  const target = join(outDir, name);
  writeFileSync(target, Buffer.from(doc.output("arraybuffer")));
  console.log(`escrito: ${target}`);
};

// Largo para revisar el salto de pagina y el encabezado repetido; corto para
// ver totales y comision en una sola hoja.
write(
  "corte-preview.pdf",
  buildReporteConcesionDoc(buildReporteConcesion(NOMBRES.length), "Concesión Norte"),
);
write(
  "corte-preview-corto.pdf",
  buildReporteConcesionDoc(buildReporteConcesion(6), "Concesión Norte"),
);
write("corte-consolidado-preview.pdf", buildReporteConsolidadoDoc(reporteConsolidado));
