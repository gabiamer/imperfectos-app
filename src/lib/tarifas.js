/**
 * Lógica de cálculo de tarifa por publicación.
 *
 * Reglas del modelo de negocio (NO modificar sin validar con el equipo/mentores):
 * - Cada vendedor tiene 2 publicaciones gratis por mes calendario.
 * - Desde la 3ra publicación del mes, se cobra una tarifa fija según el
 *   valor total declarado del lote. Se cobra AL PUBLICAR, no al vender,
 *   para eliminar el incentivo a subreportar ventas.
 */

export const PUBLICACIONES_GRATIS_POR_MES = 2

export const TRAMOS_TARIFA = [
  { max: 100, tarifa: 2 },
  { max: 500, tarifa: 5 },
  { max: 1500, tarifa: 10 },
  { max: Infinity, tarifa: 20 },
]

/**
 * Calcula la tarifa que corresponde a un lote según su valor total declarado.
 * @param {number} valorLote - precio total del lote publicado, en Bs.
 * @returns {number} tarifa en Bs.
 */
export function calcularTarifaPorTramo(valorLote) {
  if (typeof valorLote !== 'number' || Number.isNaN(valorLote) || valorLote < 0) {
    throw new Error('valorLote debe ser un número positivo')
  }
  const tramo = TRAMOS_TARIFA.find((t) => valorLote <= t.max)
  return tramo.tarifa
}

/**
 * Determina si una nueva publicación debe ser gratis o pagada, y su tarifa.
 * @param {number} publicacionesEsteMes - cuántas publicaciones ya hizo el vendedor en el mes calendario actual.
 * @param {number} valorLote - precio total del lote a publicar, en Bs.
 * @returns {{ esGratis: boolean, tarifa: number }}
 */
export function evaluarCostoPublicacion(publicacionesEsteMes, valorLote) {
  const esGratis = publicacionesEsteMes < PUBLICACIONES_GRATIS_POR_MES
  return {
    esGratis,
    tarifa: esGratis ? 0 : calcularTarifaPorTramo(valorLote),
  }
}
