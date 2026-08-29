/*
 * GUÍA DE USO DEL HOOK useAuth
 * 
 * El contexto AuthContext expone un hook useAuth() que puedes usar
 * en cualquier componente dentro de la app (debe estar dentro de <AuthProvider>).
 * 
 * useAuth() retorna un objeto con:
 * - user: objeto del usuario de Supabase Auth (null si no está autenticado)
 * - usuarioData: fila de la tabla 'usuarios' con: id, auth_id, nombre, telefono, rol, zona, creado_en
 * - loading: boolean, true mientras se carga la sesión inicial
 * - error: string con el último mensaje de error
 * - setError: función para limpiar o establecer el error manualmente
 * - isAuthenticated: boolean, true si user !== null
 * - isAdmin: boolean, true si usuarioData.rol === 'admin'
 * - login(telefono, pin): async, retorna { success: true/false }
 * - registro(nombre, telefono, rol, zona): async, retorna { success: true/false }
 * - logout(): async, cierra la sesión
 */

// EJEMPLO 1: Acceder al usuario actual en PublicarPage
import { useAuth } from '../../contexts/AuthContext'

export default function PublicarPage() {
  const { usuarioData, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <div>No estás autenticado</div>
  }

  return (
    <section className="page">
      <h1>Crear publicación</h1>
      <p>Vendedor: {usuarioData.nombre}</p>
      <p>Zona: {usuarioData.zona}</p>
      {/* ... rest of form ... */}
    </section>
  )
}

// EJEMPLO 2: Acceder al rol del usuario en AdminPage
import { useAuth } from '../../contexts/AuthContext'

export default function AdminPage() {
  const { usuarioData, isAdmin } = useAuth()

  if (!isAdmin) {
    return <div>No tienes permisos de administrador</div>
  }

  return (
    <section className="page">
      <h1>Panel de Administrador</h1>
      <p>Admin: {usuarioData.nombre}</p>
      {/* ... admin content ... */}
    </section>
  )
}

// EJEMPLO 3: Mostrar usuario en header (ya hecho en App.jsx)
import { useAuth } from '../../contexts/AuthContext'

function Header() {
  const { isAuthenticated, usuarioData, logout } = useAuth()

  return (
    <nav>
      {isAuthenticated ? (
        <>
          <span>{usuarioData.nombre} ({usuarioData.rol})</span>
          <button onClick={logout}>Salir</button>
        </>
      ) : (
        <NavLink to="/ingresar">Ingresar</NavLink>
      )}
    </nav>
  )
}

// EJEMPLO 4: Acceder a datos del usuario de Supabase Auth
import { useAuth } from '../../contexts/AuthContext'

export default function UserDetails() {
  const { user, usuarioData } = useAuth()

  return (
    <>
      <p>ID de auth: {user.id}</p>
      <p>Email: {user.email}</p>
      <p>Nombre de usuario: {usuarioData.nombre}</p>
      <p>Teléfono: {usuarioData.telefono}</p>
      <p>Rol: {usuarioData.rol}</p>
      <p>Zona: {usuarioData.zona}</p>
    </>
  )
}

/*
 * FLUJO DE AUTENTICACIÓN IMPLEMENTADO:
 * 
 * 1. REGISTRO:
 *    - Usuario ingresa: nombre, teléfono, rol (vendedor/comprador), zona, PIN (4 dígitos)
 *    - Se crea en Supabase Auth con email ficticio (telefono@imperfectos.local)
 *    - Se crea fila en tabla 'usuarios' vinculada con auth_id
 *    - Usuario es redirigido a / (home)
 * 
 * 2. LOGIN:
 *    - Usuario ingresa: teléfono, PIN (4 dígitos)
 *    - Supabase Auth verifica las credenciales
 *    - Usuario es redirigido a / (home)
 * 
 * 3. PROTECCIÓN DE RUTAS:
 *    - /publicar: requiere isAuthenticated
 *    - /admin: requiere isAuthenticated Y isAdmin
 *    - Si no cumple, redirige a /ingresar o /
 * 
 * 4. PERSISTENCIA:
 *    - Supabase guarda la sesión en localStorage
 *    - Al refrescar, se recupera automáticamente
 *    - Se llama a loadUsuarioData(authId) para traer datos de tabla usuarios
 * 
 * 5. LOGOUT:
 *    - Llama a supabase.auth.signOut()
 *    - Limpia user y usuarioData
 *    - Redirige a home
 */
