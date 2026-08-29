// Módulo: Publicar producto (Prompt 3 / rama feature/publicar-tarifa)
// Flujo de publicación con la lógica de tarifa por tramos ya implementada
// en src/lib/tarifas.js (probada con tests en tarifas.test.js).
// TODO equipo: construir el formulario (foto, cantidad, precio, ubicación,
// horario) y conectarlo a evaluarCostoPublicacion() antes de guardar en Supabase.

import { evaluarCostoPublicacion } from '../../lib/tarifas'

export default function PublicarPage() {
  // Ejemplo de uso de la función pura de tarifas — reemplazar por datos reales
  // del formulario y de la cuota mensual del vendedor autenticado.
  const ejemplo = evaluarCostoPublicacion(2, 800)

  return (
    <section className="page">
      <h1>Publicar producto</h1>
      <p>Aquí va el formulario de publicación (Prompt 3).</p>
      <p className="hint">
        Ejemplo de cálculo de tarifa (3ra publicación del mes, lote de Bs 800):{' '}
        <strong>
          {ejemplo.esGratis ? 'Gratis' : `Bs ${ejemplo.tarifa}`}
        </strong>
      </p>
    </section>
  )
}
