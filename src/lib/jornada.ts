export function buildJornadaId(fecha: string, jornadaNumero: number | string) {
  return `${fecha}__J${jornadaNumero}`;
}
