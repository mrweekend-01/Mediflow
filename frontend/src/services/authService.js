import api from './api'

// Llama al endpoint de login y guarda el token y datos del usuario
// en localStorage para mantener la sesión activa
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password })
  const data = response.data

  // Guarda el token JWT para usarlo en futuras llamadas
  localStorage.setItem('token', data.access_token)

  // Guarda los datos del usuario para mostrarlos en la UI
  localStorage.setItem('usuario', JSON.stringify({
    nombre: data.nombre,
    rol: data.rol,
    clinica_id: data.clinica_id,
  }))

  return data
}

// Elimina el token y datos del usuario del localStorage
// efectivamente cerrando la sesión
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
}

// Retorna los datos del usuario guardados en localStorage
// o null si no hay sesión activa
const getUsuario = () => {
  const usuario = localStorage.getItem('usuario')
  return usuario ? JSON.parse(usuario) : null
}

// Verifica si hay un token guardado — indica si hay sesión activa
const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}

export default { login, logout, getUsuario, isAuthenticated }