export enum UserRole {
  SUPERADMIN = "SUPERADMIN",
  ADMIN = "ADMIN",
  VENDEDOR = "VENDEDOR",
}

export interface PosUser {
  uid?: string;
  email?: string;
  nombre?: string;
  /** Rol interno del POS (SUPERADMIN | ADMIN | VENDEDOR). */
  rol?: string;
  /** Rol persistido en app-oficial-leon (CONCESION_*). */
  rolOriginal?: string;
  from_concesion?: boolean;
  activo?: boolean;
  concesionId?: string | null;
  sucursalId?: string | null;
  cajaId?: string | null;
  admin?: boolean;
  isAdmin?: boolean;
  [key: string]: unknown;
}

export interface Concession {
  id: string;
  nombre: string;
  activo: boolean;
  imagenes?: string[];
  idUser?: string | null;
  porcentajeComision?: number | null;
}

export interface User {
  id: string;
  uid?: string;
  nombre: string;
  email: string;
  rol: UserRole | string;
  activo: boolean;
  concesionId?: string | null;
  sucursalId?: string | null;
  cajaId?: string | null;
  fecha_nacimiento?: string;
}

export interface Caja {
  id: string;
  nombre: string;
  activo: boolean;
  orden?: number;
}

export interface AsignacionCajaJornada {
  id: string;
  jornadaId: string;
  concesionId: string;
  sucursalId: string;
  cajaId: string;
  cajaNombre: string;
  vendedorUid: string;
  vendedorNombre: string;
  activo: boolean;
}

export interface Zona {
  id: string;
  zona: string;
  activo: boolean;
}

export interface Sucursal {
  id: string;
  concesion_id: string;
  zona_id: string;
  nombre: string | null;
  activo: boolean;
  cajas?: Caja[];
}

export interface Product {
  id: string;
  concesion_id: string;
  nombre: string;
  unidad_medida: string;
  precio: number;
  imagenes?: string[];
  activo: boolean;
}

export interface Inventario {
  id: string;
  jornada_fecha: string;
  jornada_numero: number;
  /** Legacy: inventarios viejos por sucursal */
  sucursal_id?: string | null;
  concesion_id: string;
  activo: boolean;
  productos?: InventarioProducto[];
}

export interface InventarioProducto {
  id: string;
  producto_id: string;
  cantidad_inicial?: number;
  cantidad_final?: number;
  precio_jornada?: number;
  /** Calculado: cantidad_inicial - cantidad_final */
  cantidad_vendida?: number;
}

export type InventarioMovimientoTipo = "CARGA_INICIAL" | "AJUSTE" | "VENTA";

export interface InventarioMovimiento {
  id: string;
  tipo: InventarioMovimientoTipo;
  producto_id: string;
  cantidad: number;
  cantidad_anterior: number;
  cantidad_nueva: number;
  sucursal_id?: string | null;
  cajaId?: string | null;
  cajaNombre?: string | null;
  idUser?: string | null;
  ventaId?: string | null;
  createdAt?: string;
}

export interface InventarioJornadaActivaData {
  inventario: Inventario | null;
  jornada: JornadaActivaValue;
}

export interface DetalleProducto {
  producto: string;
  cantidad: number;
  precio_actual: number;
  subtotal?: number;
}

export interface ComprobanteVenta {
  id: string;
  ventaId: string;
  concesionId: string;
  sucursalId: string;
  inventarioId: string;
  jornadaId?: string | null;
  cajaId?: string | null;
  cajaNombre?: string | null;
  idUser?: string | null;
  cajeroNombre?: string | null;
  total: number;
  detalle?: DetalleProducto[];
  fecha?: unknown;
  createdAt?: unknown;
}

export interface Ticket {
  id: string;
  fecha: string;
  metodo_pago: string;
  subtotal: number;
  total: number;
  status: string;
  concesionId: string;
  sucursalId?: string | null;
  idUser?: string | null;
}

export interface CorteResumenProducto {
  productoId: string;
  nombre: string;
  cantidad: number;
  subtotal: number;
  /** Precio real por unidad tal como se registró en la línea de venta. */
  precioUnitario: number;
}

export interface CorteResumenPromociones2x1 {
  montoTotal: number;
  montoDescuento: number;
  unidadesGratis: number;
  cantidadTransacciones: number;
}

export interface CorteResumenComboLinea {
  comboId: string;
  nombre: string;
  cantidadVendidos: number;
  montoTotal: number;
}

export interface CorteResumenCombos {
  montoTotal: number;
  cantidadVendidos: number;
  items: CorteResumenComboLinea[];
}

export interface CorteResumen {
  /** Dinero real vendido = efectivo + tarjeta. NO incluye puntos. */
  totalVendido: number;
  totalEfectivo: number;
  totalTarjeta: number;
  /** Monto ($) canjeado con puntos. Informativo: NO se suma al dinero real. */
  totalPuntosMonto: number;
  totalPuntosCanjeados: number;
  ventasConPuntos: number;
  cantidadVentas: number;
  productos: CorteResumenProducto[];
  promociones2x1: CorteResumenPromociones2x1;
  combos: CorteResumenCombos;
  /** Efectivo físico contado al cerrar (arqueo). null si el corte no está cerrado. */
  efectivoContado: number | null;
  /** efectivoContado - totalEfectivo. Positivo = sobrante, negativo = faltante. */
  diferenciaCaja: number | null;
  cajaNombre: string | null;
  cajeroNombre: string | null;
  corteCerrado: boolean;
  corteId: string | null;
}

export interface Corte {
  id: string;
  ventaId: string | null;
  idUser: string | null;
  concesionId: string;
  sucursalId?: string | null;
  jornadaId?: string | null;
  inventarioId?: string | null;
  cajaId?: string | null;
  cajaNombre?: string | null;
  secuencia?: number | null;
  ventasAbiertas?: boolean | null;
  fecha: string;
  comentarios: string | null;
  estatus: string;
  totalReal: number;
  totalCaja: number;
  totalEfectivo?: number | null;
  totalTarjeta?: number | null;
  totalPuntosMonto?: number | null;
  totalPuntosCanjeados?: number | null;
  ventasConPuntos?: number | null;
  cantidadVentas?: number | null;
  efectivoContado?: number | null;
  diferenciaCaja?: number | null;
  productos?: CorteResumenProducto[] | null;
  promociones2x1?: CorteResumenPromociones2x1 | null;
  combos?: CorteResumenCombos | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ReporteProductoRow {
  productoId: string;
  nombre: string;
  inventarioInicial: number;
  cantidadVendida: number;
  precioUnitario: number;
  inventarioFinal: number;
  cortesias: number;
  totalVendido: number;
}

export interface ReporteIngresos {
  ventaNeta: number;
  totalEfectivo: number;
  totalTarjeta: number;
  totalPuntosMonto: number;
  totalPuntosCanjeados: number;
  ventasConPuntos: number;
  cantidadVentas: number;
}

export type ReporteTipoVentaTipo =
  | "normal"
  | "abonado"
  | "abonado_puntos"
  | "normal_puntos";

export interface ReporteTipoVentaRow {
  tipo: ReporteTipoVentaTipo;
  etiqueta: string;
  descripcion: string;
  transacciones: number;
  efectivo: number;
  tarjeta: number;
  puntosMonto: number;
  puntosCanjeados: number;
  valorTotal: number;
  descuentoAbonado: number;
}

export interface ReportePromocionesAbonado {
  cantidadTransacciones: number;
  montoTotal: number;
  montoDescuento: number;
  unidadesGratis: number;
}

export interface ReporteConcesionRow {
  concesionId: string;
  nombre: string;
  porcentajeComision: number;
  totalVenta: number;
  comision: number;
  gananciaConcesion: number;
}

export interface ReporteCortes {
  jornada: { fecha: string; numero: number; jornadaId: string };
  productos: ReporteProductoRow[] | null;
  resumen: ReporteConcesionRow[];
  ingresos: ReporteIngresos | null;
  tiposVenta: ReporteTipoVentaRow[] | null;
  promocionesAbonado: ReportePromocionesAbonado | null;
}

export interface JornadaActivaValue {
  activo?: boolean;
  equipo_local?: string;
  equipo_visitante?: string;
  estadio?: string;
  fecha?: string;
  hora?: string;
  jornada?: number;
  [key: string]: unknown;
}

export interface ComboProducto {
  producto_id: string;
  cantidad: number;
}

export interface Combo {
  id: string;
  concesion_id: string;
  titulo: string;
  descripcion?: string | null;
  productos: ComboProducto[];
  /** Precio de venta del combo. */
  precio: number;
  activo: boolean;
  createdByUid?: string | null;
  createdByNombre?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type DescuentoTipo = "2X1" | "3X2" | "PORCENTAJE" | "MONTO";

export interface Descuento {
  id: string;
  concesion_id: string;
  titulo: string;
  descripcion?: string | null;
  tipo: DescuentoTipo;
  valor?: number | null;
  producto_ids: string[];
  activo: boolean;
  createdByUid?: string | null;
  createdByNombre?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TrabajadorClubPreview {
  id: string;
  uid: string;
  nombre: string;
  email: string;
  telefono?: string | null;
  rol: string;
  roles: string[];
  provider?: string;
  activo: boolean;
  puntosActuales?: number;
  nivel?: string | null;
  esTrabajadorClub: boolean;
  puedeAgregar: boolean;
  motivoNoAgregar?: string;
}

export interface TrabajadorClub {
  id: string;
  uid: string;
  nombre: string;
  email: string;
  telefono?: string | null;
  roles: string[];
  cortesiasTotal: number;
  cortesiasCanjeadas: number;
  trabajadorClubAgregadoAt?: string | null;
  trabajadorClubAgregadoPor?: string | null;
  activo: boolean;
  puntosActuales?: number;
  nivel?: string | null;
}

export interface CortesiaTrabajadorClub {
  id: string;
  torneo: string;
  torneoPath: string;
  partidoKey: string;
  jornada: number;
  fecha: string;
  hora?: string | null;
  equipoLocal: string;
  equipoVisitante: string;
  estadio?: string | null;
  cortesiaCanjeada: boolean;
  syncedAt?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
}
