import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  // Estado del formulario
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      // Llama al contexto de autenticación con las credenciales
      const data = await login(email, password)

      // Redirige según el rol del usuario autenticado
      if (data.rol === 'director') navigate('/director')
      else if (data.rol === 'admision') navigate('/admision')
      else navigate('/coordinador')

    } catch (err) {
      // Muestra error si las credenciales son incorrectas
      setError('Email o contraseña incorrectos')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="text-2xl font-medium text-gray-900 mb-1">MediFlow</div>
          <div className="text-sm text-gray-500">
            Sistema de gestión de productividad médica
          </div>
        </div>

        {/* Tarjeta del formulario */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="text-sm font-medium text-gray-900 mb-4">
            Iniciar sesión
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Campo email */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@clinica.com"
                required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors"
              />
            </div>

            {/* Campo password */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors"
              />
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {/* Botón de submit */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>

          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-400">
          CSJD · MediFlow v1.0
        </div>

      </div>
    </div>
  )
}

export default Login