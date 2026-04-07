// Formatea una fecha ISO a formato legible en español
// Ejemplo: "2026-04-06T14:30:00" → "6 de abril 2026"
export const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Formatea una fecha ISO a hora legible
// Ejemplo: "2026-04-06T14:30:00" → "14:30"
export const formatearHora = (fecha) => {
  return new Date(fecha).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Formatea fecha y hora juntas
// Ejemplo: "2026-04-06T14:30:00" → "6 abr 2026, 14:30"
export const formatearFechaHora = (fecha) => {
  return new Date(fecha).toLocaleString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Obtiene el turno actual según la hora del sistema
// Mañana: 00:00 - 12:59 / Tarde: 13:00 - 23:59
export const getTurnoActual = () => {
  const hora = new Date().getHours()
  return hora < 13 ? 'mañana' : 'tarde'
}

// Retorna las iniciales de un nombre completo
// Ejemplo: "Carlos Paredes" → "CP"
export const getIniciales = (nombre, apellido = '') => {
  const n = nombre?.charAt(0).toUpperCase() || ''
  const a = apellido?.charAt(0).toUpperCase() || ''
  return `${n}${a}`
}

// Calcula el ratio de atenciones por hora
// Ejemplo: 20 atenciones en 4 horas → 5.0 atenciones/hora
export const calcularRatioHora = (atenciones, horas) => {
  if (!horas || horas === 0) return 0
  return Math.round((atenciones / horas) * 10) / 10
}

// Determina el estado de rendimiento según el ratio
// Alto: >= 4 / Medio: >= 2 / Bajo: < 2
export const getEstadoRendimiento = (ratio) => {
  if (ratio >= 4) return { label: 'Alto', color: 'green' }
  if (ratio >= 2) return { label: 'Medio', color: 'amber' }
  return { label: 'Bajo', color: 'red' }
}

// Capitaliza la primera letra de un texto
// Ejemplo: "mañana" → "Mañana"
export const capitalizar = (texto) => {
  if (!texto) return ''
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}