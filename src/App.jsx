import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import AdminPage from './features/admin/AdminPage'
import AuthPage from './features/auth/AuthPage'
import ExplorarPage from './features/explorar/ExplorarPage'
import PublicarPage from './features/publicar/PublicarPage'

// Componente para proteger rutas
function ProtectedRoute({ element, requireAuth = true, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</div>
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/ingresar" replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return element
}

function App() {
  const { isAuthenticated, usuarioData, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <header className="top-nav">
        <span className="brand">Imperfectos</span>
        <nav>
          <NavLink to="/" end>
            Explorar
          </NavLink>
          {isAuthenticated && usuarioData?.rol === 'vendedor' && (
            <NavLink to="/publicar">Publicar</NavLink>
          )}
          {isAuthenticated && usuarioData?.rol === 'admin' && (
            <NavLink to="/admin">Admin</NavLink>
          )}
          {!isAuthenticated ? (
            <NavLink to="/ingresar">Ingresar</NavLink>
          ) : (
            <div className="nav-user">
              <span className="user-info">
                {usuarioData?.nombre} ({usuarioData?.rol})
              </span>
              <button onClick={handleLogout} className="btn-logout">
                Salir
              </button>
            </div>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<ExplorarPage />} />
          <Route
            path="/publicar"
            element={<ProtectedRoute element={<PublicarPage />} requireAuth />}
          />
          <Route path="/ingresar" element={<AuthPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute
                element={<AdminPage />}
                requireAuth
                requireAdmin
              />
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
