import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Componente que protege rutas privadas
// Si no hay sesión activa redirige al login automáticamente
// Si el usuario no tiene el rol requerido redirige a su dashboard
const PrivateRoute = ({ children, rolesPermitidos = [] }) => {
  const { usuario, loading } = useAuth()

  // Mientras verifica la sesión no muestra nada
  if (loading) return null

  // Si no hay usuario autenticado redirige al login
  if (!usuario) return <Navigate to="/login" replace />

  // Si hay roles requeridos verifica que el usuario tenga uno de ellos
  if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(usuario.rol)) {
    // Redirige al dashboard correspondiente según su rol
    if (usuario.rol === 'director') return <Navigate to="/director" replace />
    if (usuario.rol === 'coordinador') return <Navigate to="/coordinador" replace />
    if (usuario.rol === 'admision') return <Navigate to="/admision" replace />
    if (usuario.rol === 'superadmin') return <Navigate to="/coordinador" replace />
  }

  // Si todo está bien muestra el contenido protegido
  return children
}

export default PrivateRoute