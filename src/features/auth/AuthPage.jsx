import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './AuthPage.css'

export default function AuthPage() {
  const [tab, setTab] = useState('login') // 'login' o 'registro'
  const [loading, setLoading] = useState(false)
  const { login, registro, error, setError } = useAuth()
  const navigate = useNavigate()

  // LOGIN
  const [loginData, setLoginData] = useState({
    telefono: '',
    pin: '',
  })

  // REGISTRO
  const [registroData, setRegistroData] = useState({
    nombre: '',
    telefono: '',
    pin: '',
    pinConfirm: '',
    rol: 'comprador',
    zona: '',
  })

  const handleLoginChange = (e) => {
    const { name, value } = e.target
    // Solo números para teléfono
    if (name === 'telefono') {
      setLoginData({
        ...loginData,
        [name]: value.replace(/\D/g, ''),
      })
    } else if (name === 'pin') {
      // Solo 4 dígitos para PIN
      setLoginData({
        ...loginData,
        [name]: value.replace(/\D/g, '').slice(0, 4),
      })
    } else {
      setLoginData({ ...loginData, [name]: value })
    }
    setError(null)
  }

  const handleRegistroChange = (e) => {
    const { name, value } = e.target
    if (name === 'telefono') {
      setRegistroData({
        ...registroData,
        [name]: value.replace(/\D/g, ''),
      })
    } else if (name === 'pin' || name === 'pinConfirm') {
      setRegistroData({
        ...registroData,
        [name]: value.replace(/\D/g, '').slice(0, 4),
      })
    } else {
      setRegistroData({ ...registroData, [name]: value })
    }
    setError(null)
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(loginData.telefono, loginData.pin)
    setLoading(false)

    if (result.success) {
      navigate('/')
    }
  }

  const handleRegistroSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validar
    if (!registroData.nombre.trim()) {
      setError('El nombre es obligatorio')
      setLoading(false)
      return
    }
    if (registroData.telefono.length < 8) {
      setError('Ingresa un número de teléfono válido (mínimo 8 dígitos)')
      setLoading(false)
      return
    }
    if (registroData.pin.length !== 4) {
      setError('El PIN debe ser 4 dígitos')
      setLoading(false)
      return
    }
    if (registroData.pin !== registroData.pinConfirm) {
      setError('Los PINs no coinciden')
      setLoading(false)
      return
    }
    if (!registroData.zona.trim()) {
      setError('Selecciona una zona/mercado')
      setLoading(false)
      return
    }

    // Para que el backend sea consistente, guardamos password como telefono:pin
    // pero primero necesitamos actualizar el usuario en auth
    const result = await registro(
      registroData.nombre,
      registroData.telefono,
      registroData.rol,
      registroData.zona,
      registroData.pin 
    )

    if (result.success) {
      // Hacer login automático
      const loginResult = await login(registroData.telefono, registroData.pin)
      setLoading(false)
      if (loginResult.success) {
        navigate('/')
      }
    } else {
      setLoading(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-container">
        <h1>Imperfectos</h1>
        <p className="auth-subtitle">
          Compra y vende productos frescos locales
        </p>

        <div className="auth-tabs">
          <button
            className={`tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setTab('login')
              setError(null)
            }}
          >
            Ingresar
          </button>
          <button
            className={`tab-btn ${tab === 'registro' ? 'active' : ''}`}
            onClick={() => {
              setTab('registro')
              setError(null)
            }}
          >
            Registrarme
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="login-telefono">Teléfono</label>
              <input
                id="login-telefono"
                type="tel"
                name="telefono"
                placeholder="Ej: 71234567"
                value={loginData.telefono}
                onChange={handleLoginChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-pin">PIN (4 dígitos)</label>
              <input
                id="login-pin"
                type="password"
                name="pin"
                placeholder="1234"
                value={loginData.pin}
                onChange={handleLoginChange}
                maxLength="4"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !loginData.telefono || !loginData.pin}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegistroSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="reg-nombre">Nombre completo</label>
              <input
                id="reg-nombre"
                type="text"
                name="nombre"
                placeholder="Tu nombre"
                value={registroData.nombre}
                onChange={handleRegistroChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-telefono">Teléfono</label>
              <input
                id="reg-telefono"
                type="tel"
                name="telefono"
                placeholder="71234567"
                value={registroData.telefono}
                onChange={handleRegistroChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-rol">¿Qué haces en Imperfectos?</label>
              <select
                id="reg-rol"
                name="rol"
                value={registroData.rol}
                onChange={handleRegistroChange}
                disabled={loading}
              >
                <option value="comprador">Compro productos</option>
                <option value="vendedor">Vendo productos</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reg-zona">Mercado / Zona</label>
              <input
                id="reg-zona"
                type="text"
                name="zona"
                placeholder="Ej: Mercado Camacho, San Alejo"
                value={registroData.zona}
                onChange={handleRegistroChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-pin">Crea un PIN (4 dígitos)</label>
              <input
                id="reg-pin"
                type="password"
                name="pin"
                placeholder="1234"
                value={registroData.pin}
                onChange={handleRegistroChange}
                maxLength="4"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-pinConfirm">Confirma el PIN</label>
              <input
                id="reg-pinConfirm"
                type="password"
                name="pinConfirm"
                placeholder="1234"
                value={registroData.pinConfirm}
                onChange={handleRegistroChange}
                maxLength="4"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrarme'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            {tab === 'login'
              ? '¿No tienes cuenta? Usa la pestaña "Registrarme"'
              : '¿Ya tienes cuenta? Usa la pestaña "Ingresar"'}
          </p>
        </div>
      </div>
    </section>
  )
}
