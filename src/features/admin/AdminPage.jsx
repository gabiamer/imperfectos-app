// Módulo: Panel de administración (Prompt 5 / rama feature/panel-admin)
// Confirmación manual de pagos de tarifa, moderación básica, y dashboard
// de métricas de impacto (kg publicados, Bs generados, contactos, ingresos).
// TODO equipo: proteger esta ruta para rol "admin" (frontend + RLS de Supabase).

export default function AdminPage() {
  return (
    <section className="page">
      <h1>Panel de administración</h1>
      <p>Solo visible para el equipo (rol admin). Ver Prompt 5.</p>
    </section>
  )
}
