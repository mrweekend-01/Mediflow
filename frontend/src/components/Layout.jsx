import Navbar from './Navbar'

// Estructura base de todas las páginas privadas
// Sidebar izquierdo con Navbar + contenido principal a la derecha
const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-white overflow-hidden">

      {/* Barra de navegación lateral */}
      <Navbar />

      {/* Área de contenido principal con scroll */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {children}
      </main>

    </div>
  )
}

export default Layout