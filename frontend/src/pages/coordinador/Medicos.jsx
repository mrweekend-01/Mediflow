import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { getIniciales } from '../../utils/helpers'

const Medicos = () => {
  const { usuario } = useAuth()

  // Lista de médicos y especialidades
  const [medicos, setMedicos] = useState([])
  const [especialidades, setEspecialidades] = useState([])

  // Control del modal de crear/editar
  const [modalAbierto, setModalAbierto] = useState(false)
  const [medicoEditando, setMedicoEditando] = useState(null)

  // Formulario
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    especialidad_id: '',
    codigo: '',
  })

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState(null)

  // Carga médicos y especialidades al montar
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [resMedicos, resEsp] = await Promise.all([
        api.get('/medicos/'),
        api.get('/especialidades/')
      ])
      setMedicos(resMedicos.data)
      setEspecialidades(resEsp.data)
    } catch (err) {
      console.error('Error cargando datos:', err)
    } finally {
      setCargando(false)
    }
  }

  // Abre el modal para crear un médico nuevo
  const abrirCrear = () => {
    setMedicoEditando(null)
    setForm({ nombre: '', apellido: '', especialidad_id: '', codigo: '' })
    setModalAbierto(true)
  }

  // Abre el modal para editar un médico existente
  const abrirEditar = (medico) => {
    setMedicoEditando(medico)
    setForm({
      nombre: medico.nombre,
      apellido: medico.apellido,
      especialidad_id: medico.especialidad_id || '',
      codigo: medico.codigo || '',
    })
    setModalAbierto(true)
  }

  // Guarda el médico — crea o actualiza según el caso
  const guardar = async () => {
    if (!form.nombre || !form.apellido) return
    setGuardando(true)

    try {
      if (medicoEditando) {
        // Actualiza médico existente
        await api.put(`/medicos/${medicoEditando.id}`, {
          nombre: form.nombre,
          apellido: form.apellido,
          especialidad_id: form.especialidad_id || null,
          codigo: form.codigo || null,
        })
        mostrarToast('Médico actualizado correctamente', 'success')
      } else {
        // Crea médico nuevo
        await api.post('/medicos/', {
          nombre: form.nombre,
          apellido: form.apellido,
          clinica_id: usuario.clinica_id,
          especialidad_id: form.especialidad_id || null,
          codigo: form.codigo || null,
        })
        mostrarToast('Médico creado correctamente', 'success')
      }

      setModalAbierto(false)
      cargarDatos()

    } catch (err) {
      mostrarToast('Error al guardar el médico', 'error')
    } finally {
      setGuardando(false)
    }
  }

  // Desactiva un médico (soft delete)
  const desactivar = async (medico) => {
    if (!confirm(`¿Desactivar a ${medico.nombre} ${medico.apellido}?`)) return
    try {
      await api.delete(`/medicos/${medico.id}`)
      mostrarToast('Médico desactivado', 'success')
      cargarDatos()
    } catch (err) {
      mostrarToast('Error al desactivar', 'error')
    }
  }

  const mostrarToast = (mensaje, tipo) => {
    setToast({ mensaje, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  const coloresAvatar = [
    'bg-blue-100 text-blue-700',
    'bg-teal-100 text-teal-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-green-100 text-green-700',
  ]

  // Busca el nombre de la especialidad por ID
  const getNombreEsp = (id) => {
    const esp = especialidades.find(e => e.id === id)
    return esp ? esp.nombre : 'Sin especialidad'
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg text-white
          ${toast.tipo === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>
          {toast.mensaje}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-gray-900">Médicos</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {medicos.length} médicos activos registrados
            </p>
          </div>
          <button
            onClick={abrirCrear}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Nuevo médico
          </button>
        </div>
      </div>

      {/* Lista de médicos */}
      <div className="px-8 py-6">
        {cargando ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-gray-400">Cargando médicos...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-w-3xl">
            {medicos.map((medico, index) => (
              <div
                key={medico.id}
                className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4 hover:shadow-sm transition-all"
              >
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${coloresAvatar[index % coloresAvatar.length]}`}>
                  {getIniciales(medico.nombre, medico.apellido)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {medico.nombre} {medico.apellido}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {getNombreEsp(medico.especialidad_id)}
                    {medico.codigo && ` · ${medico.codigo}`}
                  </div>
                </div>

                {/* Badge activo */}
                <div className="bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full">
                  Activo
                </div>

                {/* Acciones */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => abrirEditar(medico)}
                    className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => desactivar(medico)}
                    className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Desactivar
                  </button>
                </div>
              </div>
            ))}

            {medicos.length === 0 && (
              <div className="text-center py-16 text-gray-400 text-sm">
                No hay médicos registrados aún
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">

            <div className="text-sm font-medium text-gray-900 mb-4">
              {medicoEditando ? 'Editar médico' : 'Nuevo médico'}
            </div>

            <div className="space-y-3">

              {/* Nombre */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Carlos"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors"
                />
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Apellido</label>
                <input
                  type="text"
                  value={form.apellido}
                  onChange={e => setForm({ ...form, apellido: e.target.value })}
                  placeholder="Ej: Paredes"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors"
                />
              </div>

              {/* Especialidad */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Especialidad</label>
                <select
                  value={form.especialidad_id}
                  onChange={e => setForm({ ...form, especialidad_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors"
                >
                  <option value="">Sin especialidad</option>
                  {especialidades.map(esp => (
                    <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Código */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Código interno</label>
                <input
                  type="text"
                  value={form.codigo}
                  onChange={e => setForm({ ...form, codigo: e.target.value })}
                  placeholder="Ej: MED003"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400 transition-colors"
                />
              </div>

            </div>

            {/* Botones del modal */}
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setModalAbierto(false)}
                className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando || !form.nombre || !form.apellido}
                className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {guardando ? 'Guardando...' : medicoEditando ? 'Actualizar' : 'Crear médico'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default Medicos