import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";

// Páginas auth
import Login from "./pages/auth/Login";

// Páginas coordinador
import CoordinadorDashboard from "./pages/coordinador/Dashboard";
import Medicos from "./pages/coordinador/Medicos";
import Horarios from "./pages/coordinador/Horarios";
import ControlMedico from "./pages/coordinador/ControlMedico";

// Páginas admisión
import RegistrarAtencion from "./pages/admision/RegistrarAtencion";

// Páginas director
import DirectorDashboard from "./pages/director/Dashboard";
import Rendimiento from "./pages/director/Rendimiento";
import TurnoHoy from "./pages/director/TurnoHoy";
import Tendencia from "./pages/director/Tendencia";
import PorMedico from "./pages/director/PorMedico";
import PorEspecialidad from "./pages/director/PorEspecialidad";
import Exportar from "./pages/director/Exportar";
import RegistroTriaje from "./pages/triaje/RegistroTriaje";
import ResumenTriaje from "./pages/triaje/ResumenTriaje";

import CargaHistorica from "./pages/archivos/CargaHistorica";
import ResumenControlMedico from "./pages/control-medico/ResumenControlMedico";
import DashboardCampanas from "./pages/campanas/DashboardCampanas";
import Auditoria from "./pages/superadmin/Auditoria";
import DashboardCampanas from "./pages/campanas/DashboardCampanas";
// Pantalla de carga mientras verifica la sesión
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="text-sm text-gray-500">Cargando...</div>
  </div>
);

const App = () => {
  const { usuario, loading } = useAuth();

  // Muestra pantalla de carga mientras verifica sesión
  if (loading) return <LoadingScreen />;

  // Ruta de inicio según rol del usuario
  const rutaInicio =
    usuario?.rol === "director"
      ? "/director"
      : usuario?.rol === "admision"
        ? "/admision"
        : usuario?.rol === "marketing" || usuario?.rol === "comercial"
          ? "/campanas"
          : usuario?.rol === "archivos"
            ? "/archivos"
            : "/coordinador";

  return (
    <Routes>
      {/* Ruta pública — login */}
      <Route
        path="/login"
        element={usuario ? <Navigate to={rutaInicio} replace /> : <Login />}
      />

      {/* Rutas de triaje */}
      <Route
        path="/triaje"
        element={
          <PrivateRoute
            rolesPermitidos={["admision", "coordinador", "superadmin"]}
          >
            <Layout>
              <RegistroTriaje />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/triaje/resumen"
        element={
          <PrivateRoute
            rolesPermitidos={[
              "admision",
              "coordinador",
              "superadmin",
              "director",
            ]}
          >
            <Layout>
              <ResumenTriaje />
            </Layout>
          </PrivateRoute>
        }
      />
      {/* Control médico */}
      <Route
        path="/control-medico"
        element={
          <PrivateRoute rolesPermitidos={["coordinador", "superadmin"]}>
            <Layout>
              <ControlMedico />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Rutas del coordinador */}
      <Route
        path="/coordinador"
        element={
          <PrivateRoute rolesPermitidos={["coordinador", "superadmin"]}>
            <Layout>
              <CoordinadorDashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/coordinador/medicos"
        element={
          <PrivateRoute rolesPermitidos={["coordinador", "superadmin"]}>
            <Layout>
              <Medicos />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/control-medico/resumen"
        element={
          <PrivateRoute rolesPermitidos={["coordinador", "superadmin"]}>
            <Layout>
              <ResumenControlMedico />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/coordinador/horarios"
        element={
          <PrivateRoute rolesPermitidos={["coordinador", "superadmin"]}>
            <Layout>
              <Horarios />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Rutas de admisión */}
      <Route
        path="/admision"
        element={
          <PrivateRoute
            rolesPermitidos={["admision", "coordinador", "superadmin"]}
          >
            <Layout>
              <RegistrarAtencion />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/archivos"
        element={
          <PrivateRoute
            rolesPermitidos={["archivos", "coordinador", "superadmin"]}
          >
            <Layout>
              <CargaHistorica />
            </Layout>
          </PrivateRoute>
        }
      />
      {/* Rutas del director */}
      <Route
        path="/director"
        element={
          <PrivateRoute rolesPermitidos={["director", "superadmin"]}>
            <Layout>
              <DirectorDashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/director/rendimiento"
        element={
          <PrivateRoute rolesPermitidos={["director", "superadmin"]}>
            <Layout>
              <Rendimiento />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/director/turno"
        element={
          <PrivateRoute rolesPermitidos={["director", "superadmin"]}>
            <Layout>
              <TurnoHoy />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/director/tendencia"
        element={
          <PrivateRoute rolesPermitidos={["director", "superadmin"]}>
            <Layout>
              <Tendencia />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/director/medico"
        element={
          <PrivateRoute rolesPermitidos={["director", "superadmin"]}>
            <Layout>
              <PorMedico />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/director/especialidad"
        element={
          <PrivateRoute rolesPermitidos={["director", "superadmin"]}>
            <Layout>
              <PorEspecialidad />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/director/exportar"
        element={
          <PrivateRoute rolesPermitidos={["director", "superadmin"]}>
            <Layout>
              <Exportar />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Rutas de campañas */}
      <Route
        path="/campanas"
        element={
          <PrivateRoute
            rolesPermitidos={["marketing", "comercial", "superadmin", "director"]}
          >
            <Layout>
              <DashboardCampanas />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Auditoría — solo superadmin */}
      <Route
        path="/auditoria"
        element={
          <PrivateRoute rolesPermitidos={["superadmin"]}>
            <Layout>
              <Auditoria />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Ruta raíz — redirige según rol */}
      <Route
        path="/"
        element={
          usuario ? (
            <Navigate to={rutaInicio} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Cualquier ruta no encontrada */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
