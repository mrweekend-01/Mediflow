import { useState, useEffect } from 'react'
import api from '../../services/api'
import { getIniciales } from '../../utils/helpers'
import BuscadorMedico from '../../components/BuscadorMedico'

// Horas por turno
const HORAS_TURNO = {
  mañana: { hora_inicio: '08:00', hora_fin: '13:00' },
  tarde:  { hora_inicio: '14:00', hora_fin: '19:00' },
}

const Horarios = () => {
  const [medicos, setMedicos] = useState([])
  const [medicoSeleccionado, setMedicoSeleccionado] = useState(null)
  const [horarios, setHorarios] = useState([])

  // Modo: 'semana' (lista clásica) | 'calendario' (mes visual)
  const [modo, setModo] = useState('semana')

  // Modal clásico
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form, setForm] = useState({
    dia_semana: 'lunes',
    turno: 'mañana',
    hora_inicio: '08:00',
    hora_fin: '13:00',
  })

  // Calendario mensual
  const hoy = new Date()
  const [calMes, setCalMes] = useState(hoy.getMonth())    // 0-based
  const [calAnio, setCalAnio] = useState(hoy.getFullYear())
  // horariosCalendario: { 'YYYY-MM-DD': { turno, hora_inicio, hora_fin, id? } }
  const [horariosCalendario, setHorariosCalendario] = useState({})
  const [turnoCalendario, setTurnoCalendario] = useState('mañana')
  const [guardandoCal, setGuardandoCal] = useState(false)

  const [cargando, setCargando] = useState(true)
  const [cargandoHorarios, setCargandoHorarios] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState(null)

  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']

  useEffect(() => {
    const cargarMedicos = async () => {
      try {
        const res = await api.get('/medicos/')
        setMedicos(res.data)
        if (res.data.length > 0) seleccionarMedico(res.data[0])
      } catch (err) {
        console.error('Error cargando médicos:', err)
      } finally {
        setCargando(false)
      }
    }
    cargarMedicos()
  }, [])

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

  // ── Modo semana ──────────────────────────────────────────────

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

  // ── Modo calendario ──────────────────────────────────────────

  const cargarHorariosMes = async (medico, anio, mes) => {
    try {
      const res = await api.get(
        `/medicos/${medico.id}/horarios/mes?anio=${anio}&mes=${mes + 1}`
      )
      const map = {}
      ;(res.data.data || []).forEach((h) => {
        map[h.fecha] = { turno: h.turno, hora_inicio: h.hora_inicio, hora_fin: h.hora_fin, id: h.id }
      })
      setHorariosCalendario(map)
    } catch (err) {
      console.error('Error cargando calendario:', err)
    }
  }

  useEffect(() => {
    if (medicoSeleccionado && modo === 'calendario') {
      cargarHorariosMes(medicoSeleccionado, calAnio, calMes)
    }
  }, [medicoSeleccionado, modo, calAnio, calMes])

  // Genera celdas del mes
  const generarDiasDelMes = () => {
    const primerDia = new Date(calAnio, calMes, 1)
    const ultimoDia = new Date(calAnio, calMes + 1, 0)
    const diasEnMes = ultimoDia.getDate()
    // Día de semana del 1ro (0=dom → convertir a lunes=0)
    let inicio = primerDia.getDay() - 1
    if (inicio < 0) inicio = 6
    return { diasEnMes, inicio }
  }

  const formatFecha = (anio, mes, dia) => {
    const mm = String(mes + 1).padStart(2, '0')
    const dd = String(dia).padStart(2, '0')
    return `${anio}-${mm}-${dd}`
  }

  const toggleDia = (fecha) => {
    setHorariosCalendario((prev) => {
      const existe = prev[fecha]
      if (existe) {
        const next = { ...prev }
        delete next[fecha]
        return next
      }
      return {
        ...prev,
        [fecha]: {
          turno: turnoCalendario,
          ...HORAS_TURNO[turnoCalendario],
        },
      }
    })
  }

  const guardarCalendario = async () => {
    if (!medicoSeleccionado) return
    setGuardandoCal(true)
    try {
      // 1. Trae los horarios actuales del mes
      const resActuales = await api.get(
        `/medicos/${medicoSeleccionado.id}/horarios/mes?anio=${calAnio}&mes=${calMes + 1}`
      )
      const actuales = resActuales.data.data || []

      // 2. Elimina TODOS los actuales del mes (simplifica el merge y evita
      //    bugs cuando el usuario cambió el turno de un día existente)
      await Promise.all(
        actuales.map((h) =>
          api.delete(`/medicos/${medicoSeleccionado.id}/horarios/fecha/${h.fecha}`)
        )
      )

      // 3. Recrea todos los días marcados en el calendario
      const items = Object.entries(horariosCalendario).map(([fecha, h]) => ({
        fecha,
        turno: h.turno,
        hora_inicio: h.hora_inicio,
        hora_fin: h.hora_fin,
      }))

      if (items.length > 0) {
        await api.post(`/medicos/${medicoSeleccionado.id}/horarios/bulk`, { items })
      }

      mostrarToast('Calendario guardado correctamente', 'success')
      await cargarHorariosMes(medicoSeleccionado, calAnio, calMes)
    } catch (err) {
      mostrarToast('Error al guardar el calendario', 'error')
    } finally {
      setGuardandoCal(false)
    }
  }

  const nombreMes = new Date(calAnio, calMes).toLocaleDateString('es-PE', {
    month: 'long', year: 'numeric'
  })

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

  const { diasEnMes, inicio } = generarDiasDelMes()

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
          <div className="flex items-center gap-3">
            {/* Selector de modo */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {[
                { label: 'Por semana', value: 'semana' },
                { label: 'Calendario', value: 'calendario' },
              ].map((m) => (
                <button
                  key={m.value}
                  onClick={() => setModo(m.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    modo === m.value
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {modo === 'semana' && medicoSeleccionado && (
              <button
                onClick={() => setModalAbierto(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                + Agregar horario
              </button>
            )}
          </div>
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
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Panel derecho */}
        <div className="flex-1 p-6 overflow-auto">
          {!medicoSeleccionado ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              Selecciona un médico para ver sus horarios
            </div>
          ) : modo === 'semana' ? (
            /* ── Vista por semana ── */
            cargandoHorarios ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">
                Cargando horarios...
              </div>
            ) : (
              <div className="max-w-2xl">
                <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${coloresAvatar[medicos.findIndex(m => m.id === medicoSeleccionado.id) % coloresAvatar.length]}`}>
                    {getIniciales(medicoSeleccionado.nombre, medicoSeleccionado.apellido)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {medicoSeleccionado.nombre} {medicoSeleccionado.apellido}
                    </div>
                    <div className="text-xs text-gray-400">
                      {horarios.filter(h => h.dia_semana).length} horario{horarios.filter(h => h.dia_semana).length !== 1 ? 's' : ''} por semana
                    </div>
                  </div>
                </div>

                {horarios.filter(h => h.dia_semana).length === 0 ? (
                  <div className="text-center py-16 text-gray-400 text-sm bg-white border border-gray-200 rounded-2xl">
                    No hay horarios por semana para este médico
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {horarios.filter(h => h.dia_semana).map((horario) => (
                      <div key={horario.id} className="bg-white border border-gray-200 rounded-xl px-5 py-3.5 flex items-center gap-4 hover:shadow-sm transition-all">
                        <div className="w-24 text-sm font-medium text-gray-900 capitalize">{horario.dia_semana}</div>
                        <div className="flex-1 text-sm text-gray-600">{horario.hora_inicio} – {horario.hora_fin}</div>
                        <div className={`text-xs px-3 py-1 rounded-full font-medium ${horario.turno === 'mañana' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                          {horario.turno === 'mañana' ? 'Mañana' : 'Tarde'}
                        </div>
                        <button onClick={() => eliminarHorario(horario.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          ) : (
            /* ── Vista calendario mensual ── */
            <div className="max-w-3xl">
              {/* Cabecera médico */}
              <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${coloresAvatar[medicos.findIndex(m => m.id === medicoSeleccionado.id) % coloresAvatar.length]}`}>
                    {getIniciales(medicoSeleccionado.nombre, medicoSeleccionado.apellido)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{medicoSeleccionado.nombre} {medicoSeleccionado.apellido}</div>
                    <div className="text-xs text-gray-400">{Object.keys(horariosCalendario).length} días marcados</div>
                  </div>
                </div>
                <button
                  onClick={guardarCalendario}
                  disabled={guardandoCal}
                  className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {guardandoCal ? 'Guardando...' : 'Guardar calendario'}
                </button>
              </div>

              {/* Controles del mes */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => {
                      const d = new Date(calAnio, calMes - 1)
                      setCalMes(d.getMonth())
                      setCalAnio(d.getFullYear())
                    }}
                    className="text-gray-500 hover:text-gray-800 text-sm px-2 py-1 rounded"
                  >
                    ‹
                  </button>
                  <span className="text-sm font-medium text-gray-900 capitalize">{nombreMes}</span>
                  <button
                    onClick={() => {
                      const d = new Date(calAnio, calMes + 1)
                      setCalMes(d.getMonth())
                      setCalAnio(d.getFullYear())
                    }}
                    className="text-gray-500 hover:text-gray-800 text-sm px-2 py-1 rounded"
                  >
                    ›
                  </button>
                </div>

                {/* Selector de turno para marcar */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs text-gray-500">Turno a marcar:</span>
                  <div className="flex gap-1">
                    {['mañana', 'tarde'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTurnoCalendario(t)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all capitalize ${
                          turnoCalendario === t
                            ? t === 'mañana'
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 ml-auto">
                    Clic en un día para marcarlo/desmarcarlo
                  </span>
                </div>

                {/* Grid del calendario */}
                <div className="grid grid-cols-7 gap-1">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                    <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">
                      {d}
                    </div>
                  ))}

                  {/* Celdas vacías antes del primer día */}
                  {Array.from({ length: inicio }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {/* Días del mes */}
                  {Array.from({ length: diasEnMes }, (_, i) => i + 1).map((dia) => {
                    const fecha = formatFecha(calAnio, calMes, dia)
                    const marcado = horariosCalendario[fecha]
                    const esTurnoManana = marcado?.turno === 'mañana'
                    const esTarde = marcado?.turno === 'tarde'
                    const esHoy =
                      fecha ===
                      new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })

                    return (
                      <button
                        key={dia}
                        onClick={() => toggleDia(fecha)}
                        className={`relative h-10 rounded-xl text-xs font-medium transition-all border
                          ${marcado
                            ? esTurnoManana
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'
                          }
                          ${esHoy ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
                        `}
                      >
                        {dia}
                        {marcado && (
                          <span className="absolute bottom-0.5 left-0 right-0 text-center text-[9px] leading-tight opacity-80">
                            {esTurnoManana ? 'M' : 'T'}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Leyenda */}
                <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
                    <span className="text-xs text-gray-500">Mañana</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
                    <span className="text-xs text-gray-500">Tarde</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gray-50 ring-2 ring-blue-400" />
                    <span className="text-xs text-gray-500">Hoy</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal agregar horario (modo semana) */}
      {modalAbierto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="text-sm font-medium text-gray-900 mb-4">
              Agregar horario — {medicoSeleccionado?.nombre} {medicoSeleccionado?.apellido}
            </div>
            <div className="space-y-3">
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
              <div>
                <label className="block text-xs text-gray-500 mb-1">Turno</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm({ ...form, turno: 'mañana', hora_inicio: '08:00', hora_fin: '13:00' })}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${form.turno === 'mañana' ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    Mañana
                  </button>
                  <button
                    onClick={() => setForm({ ...form, turno: 'tarde', hora_inicio: '14:00', hora_fin: '19:00' })}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${form.turno === 'tarde' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    Tarde
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Hora inicio</label>
                  <input type="time" value={form.hora_inicio} onChange={e => setForm({ ...form, hora_inicio: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Hora fin</label>
                  <input type="time" value={form.hora_fin} onChange={e => setForm({ ...form, hora_fin: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModalAbierto(false)}
                className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={guardarHorario} disabled={guardando}
                className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
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
