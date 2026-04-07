import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { getTurnoActual, getIniciales } from '../../utils/helpers'

const RegistrarAtencion = () => {
  const { usuario } = useAuth()
  const [medicos, setMedicos] = useState([])
  const [turno, setTurno] = useState(getTurnoActual())
  const [contadores, setContadores] = useState({})
  const [historial, setHistorial] = useState({})
  const [toast, setToast] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarMedicos = async () => {
      try {
        const res = await api.get('/medicos/')
        setMedicos(res.data)
        const inicial = {}
        const hist = {}
        res.data.forEach(m => {
          inicial[m.id] = 0
          hist[m.id] = []
        })
        setContadores(inicial)
        setHistorial(hist)
      } catch (err) {
        console.error('Error cargando médicos:', err)
      } finally {
        setCargando(false)
      }
    }
    cargarMedicos()
  }, [])

  // Registra una atención y guarda el ID en el historial local
  const sumar = async (medico) => {
    try {
      const res = await api.post('/atenciones/', {
        medico_id: medico.id,
        clinica_id: usuario.clinica_id,
        turno: turno,
      })

      // Guarda el ID de la atención creada para poder eliminarla después
      setHistorial(prev => ({
        ...prev,
        [medico.id]: [...(prev[medico.id] || []), res.data.id]
      }))

      setContadores(prev => ({
        ...prev,
        [medico.id]: (prev[medico.id] || 0) + 1
      }))

      setToast(`✓ Atención registrada — ${medico.nombre} ${medico.apellido}`)
      setTimeout(() => setToast(null), 2000)

    } catch (err) {
      console.error('Error registrando:', err)
    }
  }

  // Elimina la última atención registrada en esta sesión
  const restar = async (medico) => {
    const ids = historial[medico.id] || []
    if (ids.length === 0) return

    try {
      const ultimoId = ids[ids.length - 1]
      await api.delete(`/atenciones/${ultimoId}`)

      // Quita el último ID del historial
      setHistorial(prev => ({
        ...prev,
        [medico.id]: prev[medico.id].slice(0, -1)
      }))

      setContadores(prev => ({
        ...prev,
        [medico.id]: Math.max((prev[medico.id] || 0) - 1, 0)
      }))

      setToast(`✗ Atención eliminada — ${medico.nombre} ${medico.apellido}`)
      setTimeout(() => setToast(null), 2000)

    } catch (err) {
      console.error('Error eliminando:', err)
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

  const totalSesion = Object.values(contadores).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-gray-900">Registrar atención</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Selecciona el médico cada vez que derives un paciente
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Turno:</span>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setTurno('mañana')}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all
                  ${turno === 'mañana' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Mañana
              </button>
              <button
                onClick={() => setTurno('tarde')}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all
                  ${turno === 'tarde' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Tarde
              </button>
            </div>
            <div className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium">
              {totalSesion} atenciones hoy
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-8 py-6">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg
            ${toast.startsWith('✓') ? 'bg-green-600' : 'bg-red-500'} text-white`}>
            {toast}
          </div>
        )}

        {cargando ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-gray-400">Cargando médicos...</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-2xl">
            {medicos.map((medico, index) => {
              const count = contadores[medico.id] || 0
              const colorAvatar = coloresAvatar[index % coloresAvatar.length]

              return (
                <div
                  key={medico.id}
                  className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${colorAvatar}`}>
                    {getIniciales(medico.nombre, medico.apellido)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {medico.nombre} {medico.apellido}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">Especialista</div>
                  </div>

                  {/* Controles − contador + */}
                  <div className="flex items-center gap-3 flex-shrink-0">

                    {/* Botón restar */}
                    <button
                      onClick={() => restar(medico)}
                      disabled={count === 0}
                      className="w-9 h-9 rounded-full border border-gray-200 text-gray-400
                        hover:border-red-300 hover:text-red-500 hover:bg-red-50
                        disabled:opacity-25 disabled:cursor-not-allowed
                        transition-all text-lg font-medium flex items-center justify-center"
                    >
                      −
                    </button>

                    {/* Contador */}
                    <div className="w-14 text-center">
                      <div className={`text-2xl font-medium transition-all
                        ${count > 0 ? 'text-blue-600' : 'text-gray-200'}`}>
                        {count}
                      </div>
                      <div className="text-xs text-gray-400">atenciones</div>
                    </div>

                    {/* Botón sumar */}
                    <button
                      onClick={() => sumar(medico)}
                      className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700
                        active:scale-95 text-white text-lg font-medium
                        transition-all flex items-center justify-center"
                    >
                      +
                    </button>

                  </div>
                </div>
              )
            })}

            {medicos.length === 0 && (
              <div className="text-center py-16 text-gray-400 text-sm">
                No hay médicos activos registrados
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RegistrarAtencion