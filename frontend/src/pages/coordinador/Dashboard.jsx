import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { formatearFechaHora, getIniciales, getTurnoActual } from '../../utils/helpers'

const CoordinadorDashboard = () => {
  const { usuario } = useAuth()

  // Métricas del día
  const [metricas, setMetricas] = useState(null)

  // Atenciones recientes
  const [atenciones, setAtenciones] = useState([])

  // Médicos activos
  const [medicos, setMedicos] = useState([])

  // Conteo de atenciones por médico hoy
  const [conteoMedicos, setConteoMedicos] = useState({})

  const [cargando, setCargando] = useState(true)

  // Turno actual detectado automáticamente
  const turnoActual = getTurnoActual()

  // Fecha de hoy formateada
  const hoy = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [resMedicos, resAtenciones] = await Promise.all([
        api.get('/medicos/'),
        api.get(`/atenciones/clinica/${usuario.clinica_id}`)
      ])

      setMedicos(resMedicos.data)

      // Filtra atenciones de hoy
      const hoyStr = new Date().toDateString()
      const atencionesHoy = resAtenciones.data.filter(a =>
        new Date(a.registrado_en).toDateString() === hoyStr
      )

      setAtenciones(atencionesHoy.slice(0, 10))

      // Cuenta atenciones por médico hoy
      const conteo = {}
      atencionesHoy.forEach(a => {
        conteo[a.medico_id] = (conteo[a.medico_id] || 0) + 1
      })
      setConteoMedicos(conteo)

      // Calcula métricas
      setMetricas({
        totalHoy: atencionesHoy.length,
        medicosActivos: resMedicos.data.length,
        turno: turnoActual,
        totalSemana: resAtenciones.data.filter(a => {
          const fecha = new Date(a.registrado_en)
          const hace7dias = new Date()
          hace7dias.setDate(hace7dias.getDate() - 7)
          return fecha >= hace7dias
        }).length
      })

    } catch (err) {
      console.error('Error cargando dashboard:', err)
    } finally {
      setCargando(false)
    }
  }

  const coloresAvatar = [
    'bg-blue-100 text-blue-700',
    'bg-teal-100 text-teal-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-green-100 text-green-700',
  ]

  // Obtiene el nombre del médico por ID
  const getNombreMedico = (id) => {
    const m = medicos.find(m => m.id === id)
    return m ? `${m.nombre} ${m.apellido}` : 'Médico'
  }

  // Obtiene las iniciales del médico por ID
  const getInicialesMedico = (id) => {
    const m = medicos.find(m => m.id === id)
    return m ? getIniciales(m.nombre, m.apellido) : '?'
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-gray-900 capitalize">
              {hoy}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Turno actual:
              <span className={`ml-1 font-medium ${turnoActual === 'mañana' ? 'text-amber-600' : 'text-blue-600'}`}>
                {turnoActual === 'mañana' ? 'Mañana' : 'Tarde'}
              </span>
            </p>
          </div>
          <button
            onClick={cargarDatos}
            className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        {cargando ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-gray-400">Cargando...</div>
          </div>
        ) : (
          <div className="max-w-4xl">

            {/* Tarjetas de métricas */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">Atenciones hoy</div>
                <div className="text-3xl font-medium text-gray-900">
                  {metricas?.totalHoy || 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">registradas</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">Médicos activos</div>
                <div className="text-3xl font-medium text-gray-900">
                  {metricas?.medicosActivos || 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">en la clínica</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">Esta semana</div>
                <div className="text-3xl font-medium text-blue-600">
                  {metricas?.totalSemana || 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">atenciones</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">Promedio/médico</div>
                <div className="text-3xl font-medium text-gray-900">
                  {metricas?.medicosActivos > 0
                    ? Math.round(metricas.totalHoy / metricas.medicosActivos)
                    : 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">atenciones hoy</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">

              {/* Atenciones por médico hoy */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="text-sm font-medium text-gray-900 mb-4">
                  Atenciones por médico — hoy
                </div>
                <div className="flex flex-col gap-2">
                  {medicos.map((medico, index) => {
                    const count = conteoMedicos[medico.id] || 0
                    const max = Math.max(...Object.values(conteoMedicos), 1)
                    const pct = Math.round((count / max) * 100)

                    return (
                      <div key={medico.id} className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${coloresAvatar[index % coloresAvatar.length]}`}>
                          {getIniciales(medico.nombre, medico.apellido)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-700 truncate mb-1">
                            {medico.nombre} {medico.apellido}
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full">
                            <div
                              className="h-1.5 bg-blue-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900 w-6 text-right flex-shrink-0">
                          {count}
                        </div>
                      </div>
                    )
                  })}

                  {medicos.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-4">
                      No hay médicos registrados
                    </div>
                  )}
                </div>
              </div>

              {/* Últimas atenciones */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="text-sm font-medium text-gray-900 mb-4">
                  Últimas atenciones
                </div>
                <div className="flex flex-col gap-2">
                  {atenciones.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center py-4">
                      No hay atenciones registradas hoy
                    </div>
                  ) : (
                    atenciones.map((atencion, index) => (
                      <div key={atencion.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${coloresAvatar[index % coloresAvatar.length]}`}>
                          {getInicialesMedico(atencion.medico_id)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-700 truncate">
                            {getNombreMedico(atencion.medico_id)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatearFechaHora(atencion.registrado_en)}
                          </div>
                        </div>
                        <div className={`text-xs px-2 py-0.5 rounded-full
                          ${atencion.turno === 'mañana'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-blue-50 text-blue-600'
                          }`}>
                          {atencion.turno === 'mañana' ? 'Mañana' : 'Tarde'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CoordinadorDashboard