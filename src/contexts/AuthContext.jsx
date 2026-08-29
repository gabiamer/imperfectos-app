import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [usuarioData, setUsuarioData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Función para cargar datos del usuario (memoizada)
    const loadUsuarioData = useCallback(async (authId) => {
        try {
            const { data, error: err } = await supabase
                .from('usuarios')
                .select('*')
                .eq('auth_id', authId)
                .single()

            if (err) {
                console.error('Error al cargar usuario:', err)
                setError('No se pudo cargar los datos del usuario')
                return
            }

            setUsuarioData(data)
            setError(null)
        } catch (err) {
            console.error('Error inesperado:', err)
            setError('Error al cargar datos')
        }
    }, [])

    // Recuperar sesión al montar
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    setUser(session.user)
                }
            } catch (err) {
                console.error('Error al verificar sesión:', err)
            } finally {
                setLoading(false)
            }
        }

        checkSession()

        // Escuchar cambios de autenticación (callback síncrono para evitar deadlock)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (session?.user) {
                    setUser(session.user)
                } else {
                    setUser(null)
                    setUsuarioData(null)
                }
            }
        )

        return () => subscription?.unsubscribe()
    }, [])

    // Cargar datos del usuario cuando `user` cambia (useEffect separado)
    useEffect(() => {
        if (user?.id) {
            loadUsuarioData(user.id)
        } else {
            setUsuarioData(null)
        }
    }, [user, loadUsuarioData])

    const registro = async (nombre, telefono, rol, zona, pin) => {
        setError(null)
        try {
            // El trigger en la BD crea el perfil usuario automáticamente desde raw_user_meta_data
            const { error: authError } = await supabase.auth.signUp({
                email: `${telefono}@imperfectos-app.com`,
                password: `${telefono}:${pin}`,
                options: {
                    data: {
                        nombre,
                        telefono,
                        rol,
                        zona,
                    },
                },
            })

            if (authError) {
                setError(
                    authError.message === 'User already registered'
                        ? 'Este teléfono ya está registrado'
                        : 'Error al registrar: ' + authError.message
                )
                return { success: false }
            }

            setError(null)
            return { success: true }
        } catch (err) {
            setError('Error inesperado: ' + err.message)
            return { success: false }
        }
    }

    const login = async (telefono, pin) => {
        setError(null)
        try {
            if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
                setError('El PIN debe ser 4 dígitos')
                return { success: false }
            }

            const email = `${telefono}@imperfectos-app.com`   // ← NO @imperfectos.local
            const password = `${telefono}:${pin}`

            const { data, error: err } = await supabase.auth.signInWithPassword({
                email,                                            // ← objeto, no dos parámetros sueltos
                password,
            })

            if (err) {
                setError(
                    err.message === 'Invalid login credentials'
                        ? 'Teléfono o PIN incorrecto'
                        : err.message
                )
                return { success: false }
            }

            setUser(data.user)
            await loadUsuarioData(data.user.id)
            setError(null)
            return { success: true }
        } catch (err) {
            setError('Error inesperado: ' + err.message)
            return { success: false }
        }
    }

    const logout = async () => {
        try {
            await supabase.auth.signOut()
            setUser(null)
            setUsuarioData(null)
            setError(null)
            return { success: true }
        } catch (err) {
            setError('Error al cerrar sesión: ' + err.message)
            return { success: false }
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                usuarioData,
                loading,
                error,
                setError,
                registro,
                login,
                logout,
                isAuthenticated: !!user,
                isAdmin: usuarioData?.rol === 'admin',
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider')
    }
    return context
}
