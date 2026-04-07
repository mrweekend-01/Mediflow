import { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/authService'

// Contexto global de autenticación — accesible desde cualquier componente
const AuthContext = createContext(null)

// Proveedor que envuelve toda la app y comparte el estado de autenticación
export const AuthProvider = ({ children }) => {

  // Estado del usuario autenticado — null si no hay sesión
  const [usuario, setUsuario] = useState(null)

  // Estado de carga — evita mostrar el login antes de verificar la sesión
  const [loading, setLoading] = useState(true)

  // Al cargar la app verifica si ya hay una sesión guardada en localStorage
  useEffect(() => {
    const usuarioGuardado = authService.getUsuario()
    if (usuarioGuardado) {
      setUsuario(usuarioGuardado)
    }
    setLoading(false)
  }, [])

  // Función de login — llama al servicio y actualiza el estado global
  const login = async (email, password) => {
    const data = await authService.login(email, password)
    setUsuario({
      nombre: data.nombre,
      rol: data.rol,
      clinica_id: data.clinica_id,
    })
    return data
  }

  // Función de logout — limpia el estado y el localStorage
  const logout = () => {
    authService.logout()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado para acceder al contexto fácilmente
// Uso: const { usuario, login, logout } = useAuth()
export const useAuth = () => useContext(AuthContext)