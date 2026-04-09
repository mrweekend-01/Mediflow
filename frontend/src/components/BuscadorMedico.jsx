import { useState, useRef, useEffect } from 'react'

/**
 * Buscador de médico reutilizable con búsqueda en tiempo real.
 *
 * Props:
 *   medicos     — array de { id, nombre, apellido, especialidad_id, ... }
 *   value       — medico_id actualmente seleccionado (string)
 *   onChange    — fn(medico) — recibe el objeto médico completo (o null)
 *   placeholder — texto del input (opcional)
 *   disabled    — deshabilitar el buscador (opcional)
 */
const BuscadorMedico = ({
  medicos = [],
  value = '',
  onChange,
  placeholder = 'Buscar médico...',
  disabled = false,
}) => {
  const medicoSeleccionado = medicos.find((m) => m.id === value) || null
  const [query, setQuery] = useState('')
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  // Cierra el dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setAbierto(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const medicosFiltrados = medicos.filter((m) => {
    if (!query) return true
    const texto = `${m.nombre} ${m.apellido}`.toLowerCase()
    return texto.includes(query.toLowerCase())
  })

  const seleccionar = (medico) => {
    onChange(medico)
    setAbierto(false)
    setQuery('')
  }

  const limpiar = (e) => {
    e.stopPropagation()
    onChange(null)
    setQuery('')
  }

  return (
    <div ref={ref} className="relative">
      {/* Campo de selección */}
      <div
        onClick={() => !disabled && setAbierto((v) => !v)}
        className={`w-full px-3 py-2 text-sm border rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white hover:border-blue-300'}
          ${abierto ? 'border-blue-400' : 'border-gray-200'}`}
      >
        {medicoSeleccionado ? (
          <span className="text-gray-800 truncate">
            {medicoSeleccionado.nombre} {medicoSeleccionado.apellido}
          </span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {medicoSeleccionado && !disabled && (
            <button
              type="button"
              onClick={limpiar}
              className="text-gray-300 hover:text-gray-500 text-xs leading-none"
            >
              ✕
            </button>
          )}
          <span className={`text-gray-300 text-xs transition-transform ${abierto ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </div>

      {/* Dropdown */}
      {abierto && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Input de búsqueda */}
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribir nombre..."
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
            />
          </div>

          {/* Lista filtrada */}
          <div className="max-h-52 overflow-y-auto">
            {medicosFiltrados.length === 0 ? (
              <div className="px-3 py-4 text-xs text-gray-400 text-center">
                Sin resultados para "{query}"
              </div>
            ) : (
              medicosFiltrados.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => seleccionar(m)}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2
                    ${m.id === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                >
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {m.nombre?.charAt(0)}{m.apellido?.charAt(0)}
                  </div>
                  <span className="truncate">{m.nombre} {m.apellido}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BuscadorMedico
