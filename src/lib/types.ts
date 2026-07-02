export enum UserRole {
  SUPERADMIN = "SUPERADMIN",
  ADMIN = "ADMIN",
  VENDEDOR = "VENDEDOR",
}

export interface PosUser {
  uid?: string;
  email?: string;
  nombre?: string;
  rol?: string;
  activo?: boolean;
  concesionId?: string | null;
  sucursalId?: string | null;
  [key: string]: unknown;
}

export interface Concession {
  id: string;
  nombre: string;
  activo: boolean;
  imagenes?: string[];
  idUser?: string | null;
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
  fecha_nacimiento?: string;
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
  cajas?: { id: string; activo: boolean }[];
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
  idUser?: string | null;
  total: number;
  detalle?: DetalleProducto[];
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

export interface Corte {
  id: string;
  ventaId: string | null;
  idUser: string | null;
  concesionId: string;
  sucursalId?: string | null;
  fecha: string;
  comentarios: string | null;
  estatus: string;
  totalReal: number;
  totalCaja: number;
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
