import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'

// Páginas
import Login from './pages/auth/Login'
import CoordinadorDashboard from './pages/coordinador/Dashboard'
import Medicos from './pages/coordinador/Medicos'
import Horarios from './pages/coordinador/Horarios'
import RegistrarAtencion from './pages/admision/RegistrarAtencion'
import DirectorDashboard from './pages/director/Dashboard'
import Rendimiento from './pages/director/Rendimiento'

// Componente de carga mientras verifica la sesión
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="text-sm text-gray-500">Cargando...</div>
  </div>
)

const App = () => {
  const { usuario, loading } = useAuth()

  // Muestra pantalla de carga mientras verifica sesión
  if (loading) return <LoadingScreen />

  return (
    <Routes>

      {/* Ruta pública — login */}
      <Route path="/login" element={
        // Si ya hay sesión activa redirige al dashboard correspondiente
        usuario ? <Navigate to={
          usuario.rol === 'director' ? '/director' :
          usuario.rol === 'admision' ? '/admision' : '/coordinador'
        } replace /> : <Login />
      } />

      {/* Rutas del coordinador */}
      <Route path="/coordinador" element={
        <PrivateRoute rolesPermitidos={['coordinador', 'superadmin']}>
          <Layout><CoordinadorDashboard /></Layout>
        </PrivateRoute>
      } />
      <Route path="/coordinador/medicos" element={
        <PrivateRoute rolesPermitidos={['coordinador', 'superadmin']}>
          <Layout><Medicos /></Layout>
        </PrivateRoute>
      } />
      <Route path="/coordinador/horarios" element={
        <PrivateRoute rolesPermitidos={['coordinador', 'superadmin']}>
          <Layout><Horarios /></Layout>
        </PrivateRoute>
      } />

      {/* Rutas de admisión */}
      <Route path="/admision" element={
        <PrivateRoute rolesPermitidos={['admision', 'coordinador', 'superadmin']}>
          <Layout><RegistrarAtencion /></Layout>
        </PrivateRoute>
      } />

      {/* Rutas del director */}
      <Route path="/director" element={
        <PrivateRoute rolesPermitidos={['director', 'superadmin']}>
          <Layout><DirectorDashboard /></Layout>
        </PrivateRoute>
      } />
      <Route path="/director/rendimiento" element={
        <PrivateRoute rolesPermitidos={['director', 'superadmin']}>
          <Layout><Rendimiento /></Layout>
        </PrivateRoute>
      } />

      {/* Ruta raíz — redirige según rol o al login */}
      <Route path="/" element={
        usuario ? <Navigate to={
          usuario.rol === 'director' ? '/director' :
          usuario.rol === 'admision' ? '/admision' : '/coordinador'
        } replace /> : <Navigate to="/login" replace />
      } />

      {/* Cualquier ruta no encontrada redirige al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  )
}

export default App