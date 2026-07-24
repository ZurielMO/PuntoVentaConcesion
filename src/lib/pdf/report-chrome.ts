import type { jsPDF } from "jspdf";
import type { CellHookData, UserOptions } from "jspdf-autotable";
import { CLUB_LEON_LOGO_MM, CLUB_LEON_LOGO_PNG } from "@/lib/brand/club-leon-logo";

type Rgb = [number, number, number];

/** Paleta de marca del POS (misma que `src/styles/wizard-alta.css`). */
export const PDF_BRAND: Record<
  | "green"
  | "gold"
  | "ink"
  | "inkSoft"
  | "zebra"
  | "hairline"
  | "white"
  | "onGreen"
  | "highlight",
  Rgb
> = {
  green: [0, 106, 84],
  gold: [243, 194, 75],
  ink: [5, 46, 22],
  inkSoft: [104, 128, 116],
  zebra: [240, 253, 244],
  hairline: [216, 230, 222],
  white: [255, 255, 255],
  onGreen: [173, 214, 200],
  highlight: [220, 252, 231],
};

const MARGIN_X = 12;
const BAND_HEIGHT = 26;
const GOLD_HEIGHT = 1.6;

/** Y donde puede empezar el contenido de la primera pagina (banda + tira meta). */
export const CONTENT_TOP = 50;
/** Y donde arranca el contenido en paginas 2+, solo debajo de la banda. */
export const REPEAT_TOP = 34;
/** Espacio reservado abajo para el pie. */
export const FOOTER_SPACE = 18;

export interface ReportHeaderInfo {
  title: string;
  subtitle: string;
}

export interface MetaItem {
  label: string;
  value: string;
}

/**
 * Banda superior de marca: escudo sobre chip blanco, titulo, bloque
 * institucional a la derecha y regla dorada de cierre.
 *
 * Es idempotente, asi que puede llamarse desde `didDrawPage` para repetirla en
 * cada pagina sin pisar el contenido (que empieza en `REPEAT_TOP`).
 */
export const drawReportHeader = (
  doc: jsPDF,
  { title, subtitle }: ReportHeaderInfo,
): void => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...PDF_BRAND.green);
  doc.rect(0, 0, pageWidth, BAND_HEIGHT, "F");

  doc.setFillColor(...PDF_BRAND.gold);
  doc.rect(0, BAND_HEIGHT, pageWidth, GOLD_HEIGHT, "F");

  // El escudo lleva verde propio, asi que necesita un fondo claro para leerse
  // sobre la banda.
  const chipWidth = 16.5;
  const chipHeight = 17.5;
  const chipY = (BAND_HEIGHT - chipHeight) / 2;
  doc.setFillColor(...PDF_BRAND.white);
  doc.roundedRect(MARGIN_X, chipY, chipWidth, chipHeight, 2.2, 2.2, "F");
  doc.addImage(
    CLUB_LEON_LOGO_PNG,
    "PNG",
    MARGIN_X + (chipWidth - CLUB_LEON_LOGO_MM.width) / 2,
    chipY + (chipHeight - CLUB_LEON_LOGO_MM.height) / 2,
    CLUB_LEON_LOGO_MM.width,
    CLUB_LEON_LOGO_MM.height,
    "clubLeonCrest",
    "FAST",
  );

  const textX = MARGIN_X + chipWidth + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...PDF_BRAND.white);
  doc.text(title, textX, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_BRAND.onGreen);
  doc.text(subtitle, textX, 19);

  const rightX = pageWidth - MARGIN_X;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF_BRAND.white);
  doc.text("CLUB LEÓN FC", rightX, 13, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...PDF_BRAND.onGreen);
  doc.text("Punto de Venta · Concesiones", rightX, 18.5, { align: "right" });

  doc.setTextColor(...PDF_BRAND.ink);
};

/** Tira de metadatos en columnas (jornada, fecha, generado). Devuelve su borde inferior. */
export const drawMetaStrip = (
  doc: jsPDF,
  y: number,
  items: MetaItem[],
): number => {
  if (items.length === 0) return y;

  const pageWidth = doc.internal.pageSize.getWidth();
  const width = pageWidth - MARGIN_X * 2;
  const height = 13;

  doc.setFillColor(...PDF_BRAND.zebra);
  doc.setDrawColor(...PDF_BRAND.hairline);
  doc.setLineWidth(0.2);
  doc.roundedRect(MARGIN_X, y, width, height, 1.8, 1.8, "FD");

  const columnWidth = width / items.length;
  items.forEach((item, index) => {
    const columnX = MARGIN_X + columnWidth * index;

    if (index > 0) {
      doc.setDrawColor(...PDF_BRAND.hairline);
      doc.setLineWidth(0.2);
      doc.line(columnX, y + 2.5, columnX, y + height - 2.5);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...PDF_BRAND.inkSoft);
    doc.text(item.label.toUpperCase(), columnX + 5, y + 5.2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_BRAND.ink);
    doc.text(item.value, columnX + 5, y + 10.3);
  });

  return y + height;
};

/** Titulo de seccion con viñeta dorada y hairline. Devuelve su borde inferior. */
export const drawSectionTitle = (
  doc: jsPDF,
  y: number,
  text: string,
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...PDF_BRAND.gold);
  doc.rect(MARGIN_X, y - 2.6, 2.2, 2.6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_BRAND.ink);
  doc.text(text.toUpperCase(), MARGIN_X + 4.6, y);

  doc.setDrawColor(...PDF_BRAND.hairline);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, y + 2, pageWidth - MARGIN_X, y + 2);

  return y + 2;
};

/**
 * Pie con paginacion en todas las paginas.
 *
 * Debe correr al final, cuando el total de paginas ya es definitivo.
 */
export const stampFooters = (doc: jsPDF): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalPages = doc.getNumberOfPages();
  const baseline = pageHeight - 8;

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);

    doc.setDrawColor(...PDF_BRAND.hairline);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_X, baseline - 4.5, pageWidth - MARGIN_X, baseline - 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_BRAND.inkSoft);
    doc.text("Club León FC · Punto de Venta Concesiones", MARGIN_X, baseline);
    doc.text(`Página ${page} de ${totalPages}`, pageWidth - MARGIN_X, baseline, {
      align: "right",
    });
  }
};

/**
 * Salta de pagina si no caben `needed` mm antes del pie, para que un titulo de
 * seccion nunca quede huerfano al final de la hoja.
 */
export const ensureSpace = (
  doc: jsPDF,
  y: number,
  needed: number,
  header: ReportHeaderInfo,
): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed <= pageHeight - FOOTER_SPACE) return y;

  doc.addPage();
  drawReportHeader(doc, header);
  return REPEAT_TOP;
};

/** Estilos compartidos por todas las tablas del reporte. */
export const tableTheme = (
  fontSize: number,
): Pick<
  UserOptions,
  "theme" | "styles" | "headStyles" | "alternateRowStyles" | "margin"
> => ({
  theme: "grid",
  styles: {
    fontSize,
    cellPadding: { top: 1.8, right: 2, bottom: 1.8, left: 2 },
    lineColor: PDF_BRAND.hairline,
    lineWidth: 0.1,
    textColor: PDF_BRAND.ink,
    valign: "middle",
  },
  headStyles: {
    fillColor: PDF_BRAND.green,
    textColor: PDF_BRAND.white,
    fontStyle: "bold",
    fontSize: fontSize + 0.5,
    cellPadding: { top: 2.2, right: 2, bottom: 2.2, left: 2 },
  },
  alternateRowStyles: { fillColor: PDF_BRAND.zebra },
  margin: {
    top: REPEAT_TOP,
    left: MARGIN_X,
    right: MARGIN_X,
    bottom: FOOTER_SPACE,
  },
});

/** Primera columna a la izquierda y el resto a la derecha (cifras y dinero). */
export const alignNumericColumns = (
  totalColumns: number,
): NonNullable<UserOptions["columnStyles"]> => {
  const columnStyles: NonNullable<UserOptions["columnStyles"]> = {
    0: { halign: "left" },
  };
  for (let index = 1; index < totalColumns; index += 1) {
    columnStyles[index] = { halign: "right" };
  }
  return columnStyles;
};

/**
 * autotable solo aplica `columnStyles` al cuerpo (`section === 'body'`), asi
 * que el encabezado se alinea aparte para que no quede desfasado de sus cifras.
 */
export const alignNumericHead = (data: CellHookData): void => {
  if (data.section !== "head") return;
  data.cell.styles.halign = data.column.index === 0 ? "left" : "right";
};
