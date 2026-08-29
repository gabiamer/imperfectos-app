import { describe, it, expect } from 'vitest'
import { calcularTarifaPorTramo, evaluarCostoPublicacion } from './tarifas'

describe('calcularTarifaPorTramo', () => {
  it('cobra Bs 2 para lotes de hasta Bs 100', () => {
    expect(calcularTarifaPorTramo(50)).toBe(2)
    expect(calcularTarifaPorTramo(100)).toBe(2) // límite exacto incluido en el tramo
  })

  it('cobra Bs 5 para lotes entre Bs 101 y Bs 500', () => {
    expect(calcularTarifaPorTramo(101)).toBe(5)
    expect(calcularTarifaPorTramo(500)).toBe(5) // límite exacto
  })

  it('cobra Bs 10 para lotes entre Bs 501 y Bs 1500', () => {
    expect(calcularTarifaPorTramo(501)).toBe(10)
    expect(calcularTarifaPorTramo(1500)).toBe(10) // límite exacto
  })

  it('cobra Bs 20 para lotes mayores a Bs 1500', () => {
    expect(calcularTarifaPorTramo(1501)).toBe(20)
    expect(calcularTarifaPorTramo(10000)).toBe(20)
  })

  it('rechaza valores inválidos', () => {
    expect(() => calcularTarifaPorTramo(-10)).toThrow()
    expect(() => calcularTarifaPorTramo(NaN)).toThrow()
  })
})

describe('evaluarCostoPublicacion', () => {
  it('las primeras 2 publicaciones del mes son gratis sin importar el valor del lote', () => {
    expect(evaluarCostoPublicacion(0, 2000)).toEqual({ esGratis: true, tarifa: 0 })
    expect(evaluarCostoPublicacion(1, 2000)).toEqual({ esGratis: true, tarifa: 0 })
  })

  it('desde la 3ra publicación del mes se cobra según el tramo', () => {
    expect(evaluarCostoPublicacion(2, 80)).toEqual({ esGratis: false, tarifa: 2 })
    expect(evaluarCostoPublicacion(5, 1600)).toEqual({ esGratis: false, tarifa: 20 })
  })
})
