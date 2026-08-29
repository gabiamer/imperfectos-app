import { NavLink, Route, Routes } from 'react-router-dom'
import AdminPage from './features/admin/AdminPage'
import AuthPage from './features/auth/AuthPage'
import ExplorarPage from './features/explorar/ExplorarPage'
import PublicarPage from './features/publicar/PublicarPage'

function App() {
  return (
    <div className="app-shell">
      <header className="top-nav">
        <span className="brand">Imperfectos</span>
        <nav>
          <NavLink to="/" end>
            Explorar
          </NavLink>
          <NavLink to="/publicar">Publicar</NavLink>
          <NavLink to="/ingresar">Ingresar</NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<ExplorarPage />} />
          <Route path="/publicar" element={<PublicarPage />} />
          <Route path="/ingresar" element={<AuthPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
