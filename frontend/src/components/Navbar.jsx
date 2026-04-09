import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { getIniciales } from "../utils/helpers";

// Definición de rutas por rol — cada rol ve solo su menú
const menuPorRol = {
  coordinador: [
    { label: "Resumen", path: "/coordinador", icono: "▦" },
    { label: "Triaje", path: "/triaje", icono: "📋" },
    { label: "Resumen triaje", path: "/triaje/resumen", icono: "📊" },
    { label: "Control médico", path: "/control-medico", icono: "🩺" },
    { label: "Médicos", path: "/coordinador/medicos", icono: "◎" },
    { label: "Horarios", path: "/coordinador/horarios", icono: "◷" },
  ],
  admision: [
    { label: "Registrar atención", path: "/admision", icono: "+" },
    { label: "Triaje", path: "/triaje", icono: "📋" },
    { label: "Resumen triaje", path: "/triaje/resumen", icono: "📊" },
  ],
  archivos: [{ label: "Carga histórica", path: "/archivos", icono: "📂" }],
  director: [
    { label: "Dashboard", path: "/director", icono: "▦" },
    { label: "Por médico", path: "/director/medico", icono: "◎" },
    { label: "Por especialidad", path: "/director/especialidad", icono: "◉" },
    { label: "Rendimiento", path: "/director/rendimiento", icono: "▲" },
    { label: "Tendencia", path: "/director/tendencia", icono: "↗" },
    { label: "Turno de hoy", path: "/director/turno", icono: "◑" },
    { label: "Exportar", path: "/director/exportar", icono: "↓" },
  ],
  superadmin: [
    { label: "Resumen", path: "/coordinador", icono: "▦" },
    { label: "Registrar atención", path: "/admision", icono: "+" },
    { label: "Triaje", path: "/triaje", icono: "📋" },
    { label: "Resumen triaje", path: "/triaje/resumen", icono: "📊" },
    { label: "Control médico", path: "/control-medico", icono: "🩺" },
    { label: "Carga histórica", path: "/archivos", icono: "📂" },
    { label: "Médicos", path: "/coordinador/medicos", icono: "◎" },
    { label: "Horarios", path: "/coordinador/horarios", icono: "◷" },
    { label: "Dashboard director", path: "/director", icono: "▦" },
    { label: "Por médico", path: "/director/medico", icono: "◎" },
    { label: "Por especialidad", path: "/director/especialidad", icono: "◉" },
    { label: "Rendimiento", path: "/director/rendimiento", icono: "▲" },
    { label: "Tendencia", path: "/director/tendencia", icono: "↗" },
    { label: "Turno de hoy", path: "/director/turno", icono: "◑" },
    { label: "Exportar", path: "/director/exportar", icono: "↓" },
  ],
};

const Navbar = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Obtiene el menú según el rol del usuario autenticado
  const menu = menuPorRol[usuario?.rol] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="w-52 h-screen border-r border-gray-200 bg-gray-50 flex flex-col flex-shrink-0">
      {/* Cabecera con nombre de la app */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="text-sm font-medium text-gray-900">MediFlow</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {usuario?.rol === "director"
            ? "Panel del director"
            : usuario?.rol === "admision"
              ? "Panel de admisión"
              : "Panel de coordinador"}
        </div>
      </div>

      {/* Menú de navegación */}
      <nav className="flex-1 p-2">
        {menu.map((item) => {
          // Verifica si la ruta actual coincide con el item del menú
          const activo = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-0.5 text-left transition-colors
                ${
                  activo
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
            >
              <span className="text-sm w-4 text-center">{item.icono}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer con datos del usuario y botón de logout */}
      <div className="px-3 py-3 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          {/* Avatar con iniciales */}
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700 flex-shrink-0">
            {getIniciales(usuario?.nombre || "")}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-gray-900 truncate">
              {usuario?.nombre}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {usuario?.rol}
            </div>
          </div>
        </div>
        {/* Botón de cerrar sesión */}
        <button
          onClick={handleLogout}
          className="w-full text-xs text-gray-500 hover:text-red-600 text-left px-1 py-1 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Navbar;
