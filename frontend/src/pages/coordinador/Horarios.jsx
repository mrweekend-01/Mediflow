import { useState, useEffect } from 'react'
import api from '../../services/api'
import { getIniciales } from '../../utils/helpers'

const Horarios = () => {

  // Lista de médicos para el selector
  const [medicos, setMedicos] = useState([])

  // Médico seleccionado actualmente
  const [medicoSeleccionado, setMedicoSeleccionado] = useState(null)

  // Horarios del médico seleccionado
  const [horarios, setHorarios] = useState([])

  // Control del modal
  const [modalAbierto, setModalAbierto] = useState(false)

  // Formulario de horario
  const [form, setForm] = useState({
    dia_semana: 'lunes',
    turno: 'mañana',
    hora_inicio: '08:00',
    hora_fin: '13:00',
  })

  const [cargando, setCargando] = useState(true)
  const [cargandoHorarios, setCargandoHorarios] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState(null)

  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']

  // Carga los médicos al montar
  useEffect(() => {
    const cargarMedicos = async () => {
      try {
        const res = await api.get('/medicos/')
        setMedicos(res.data)
        // Selecciona el primero por defecto
        if (res.data.length > 0) {
          seleccionarMedico(res.data[0])
        }
      } catch (err) {
        console.error('Error cargando médicos:', err)
      } finally {
        setCargando(false)
      }
    }
    cargarMedicos()
  }, [])

  // Carga los horarios del médico seleccionado
  const seleccionarMedico = async (medico) => {
    setMedicoSeleccionado(medico)
    setCargandoHorarios(true)
    try {
      const res = await api.get(`/medicos/${medico.id}/horarios`)
      setHorarios(res.data)
    } catch (err) {
      console.error('Error cargando horarios:', err)
    } finally {
      setCargandoHorarios(false)
    }
  }

  // Crea un nuevo horario para el médico seleccionado
  const guardarHorario = async () => {
    if (!medicoSeleccionado) return
    setGuardando(true)
    try {
      await api.post(`/medicos/${medicoSeleccionado.id}/horarios`, {
        medico_id: medicoSeleccionado.id,
        dia_semana: form.dia_semana,
        turno: form.turno,
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin,
      })
      mostrarToast('Horario agregado correctamente', 'success')
      setModalAbierto(false)
      seleccionarMedico(medicoSeleccionado)
    } catch (err) {
      mostrarToast('Error al guardar el horario', 'error')
    } finally {
      setGuardando(false)
    }
  }

  // Elimina un horario
  const eliminarHorario = async (horarioId) => {
    if (!confirm('¿Eliminar este horario?')) return
    try {
      await api.delete(`/medicos/horarios/${horarioId}`)
      mostrarToast('Horario eliminado', 'success')
      seleccionarMedico(medicoSeleccionado)
    } catch (err) {
      mostrarToast('Error al eliminar', 'error')
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
            <h1 className="text-lg font-medium text-gray-900">Horarios</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gestiona los horarios programados por médico
            </p>
          </div>
          {medicoSeleccionado && (
            <button
              onClick={() => setModalAbierto(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Agregar horario
            </button>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">

        {/* Panel izquierdo — lista de médicos */}
        <div className="w-64 border-r border-gray-200 bg-white overflow-auto flex-shrink-0">
          <div className="p-3">
            <div className="text-xs text-gray-400 px-2 py-2 font-medium">
              Selecciona un médico
            </div>
            {cargando ? (
              <div className="text-xs text-gray-400 px-2">Cargando...</div>
            ) : (
              medicos.map((medico, index) => (
                <button
                  key={medico.id}
                  onClick={() => seleccionarMedico(medico)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-left transition-all
                    ${medicoSeleccionado?.id === medico.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                    }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${coloresAvatar[index % coloresAvatar.length]}`}>
                    {getIniciales(medico.nombre, medico.apellido)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {medico.nombre} {medico.apellido}
                    </div>
                    <div className="text-xs text-gray-400">
                      {horarios.length > 0 && medicoSeleccionado?.id === medico.id
                        ? `${horarios.length} horarios`
                        : ''}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Panel derecho — horarios del médico */}
        <div className="flex-1 p-6 overflow-auto">
          {!medicoSeleccionado ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              Selecciona un médico para ver sus horarios
            </div>
          ) : cargandoHorarios ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              Cargando horarios...
            </div>
          ) : (
            <div className="max-w-2xl">

              {/* Cabecera del médico seleccionado */}
              <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${coloresAvatar[medicos.findIndex(m => m.id === medicoSeleccionado.id) % coloresAvatar.length]}`}>
                  {getIniciales(medicoSeleccionado.nombre, medicoSeleccionado.apellido)}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {medicoSeleccionado.nombre} {medicoSeleccionado.apellido}
                  </div>
                  <div className="text-xs text-gray-400">
                    {horarios.length} horario{horarios.length !== 1 ? 's' : ''} programado{horarios.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Lista de horarios */}
              {horarios.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm bg-white border border-gray-200 rounded-2xl">
                  No hay horarios registrados para este médico
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {horarios.map((horario) => (
                    <div
                      key={horario.id}
                      className="bg-white border border-gray-200 rounded-xl px-5 py-3.5 flex items-center gap-4 hover:shadow-sm transition-all"
                    >
                      {/* Día */}
                      <div className="w-24 text-sm font-medium text-gray-900 capitalize">
                        {horario.dia_semana}
                      </div>

                      {/* Horas */}
                      <div className="flex-1 text-sm text-gray-600">
                        {horario.hora_inicio} – {horario.hora_fin}
                      </div>

                      {/* Badge turno */}
                      <div className={`text-xs px-3 py-1 rounded-full font-medium
                        ${horario.turno === 'mañana'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                        }`}>
                        {horario.turno === 'mañana' ? 'Mañana' : 'Tarde'}
                      </div>

                      {/* Botón eliminar */}
                      <button
                        onClick={() => eliminarHorario(horario.id)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal agregar horario */}
      {modalAbierto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">

            <div className="text-sm font-medium text-gray-900 mb-4">
              Agregar horario — {medicoSeleccionado?.nombre} {medicoSeleccionado?.apellido}
            </div>

            <div className="space-y-3">

              {/* Día de la semana */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Día de la semana</label>
                <select
                  value={form.dia_semana}
                  onChange={e => setForm({ ...form, dia_semana: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                >
                  {dias.map(dia => (
                    <option key={dia} value={dia} className="capitalize">{dia}</option>
                  ))}
                </select>
              </div>

              {/* Turno */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Turno</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm({ ...form, turno: 'mañana', hora_inicio: '08:00', hora_fin: '13:00' })}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all
                      ${form.turno === 'mañana'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    Mañana
                  </button>
                  <button
                    onClick={() => setForm({ ...form, turno: 'tarde', hora_inicio: '14:00', hora_fin: '19:00' })}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all
                      ${form.turno === 'tarde'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    Tarde
                  </button>
                </div>
              </div>

              {/* Horas */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Hora inicio</label>
                  <input
                    type="time"
                    value={form.hora_inicio}
                    onChange={e => setForm({ ...form, hora_inicio: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Hora fin</label>
                  <input
                    type="time"
                    value={form.hora_fin}
                    onChange={e => setForm({ ...form, hora_fin: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                  />
                </div>
              </div>

            </div>

            {/* Botones */}
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setModalAbierto(false)}
                className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarHorario}
                disabled={guardando}
                className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Agregar horario'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default Horarios