import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  getIniciales,
  calcularRatioHora,
  getEstadoRendimiento,
} from "../../utils/helpers";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const DirectorDashboard = () => {
  const { usuario } = useAuth();

  const [medicos, setMedicos] = useState([]);
  const [atenciones, setAtenciones] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [filtroMedico, setFiltroMedico] = useState("todos");
  const [filtroEsp, setFiltroEsp] = useState("todas");
  const [periodo, setPeriodo] = useState(7);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resMedicos, resAtenciones, resEsp] = await Promise.all([
        api.get("/medicos/"),
        api.get(`/atenciones/clinica/${usuario.clinica_id}`),
        api.get("/especialidades/"),
      ]);
      setMedicos(resMedicos.data);
      setAtenciones(resAtenciones.data);
      setEspecialidades(resEsp.data);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  // Filtra atenciones según período, médico y especialidad
  const atencionesFiltradas = atenciones.filter((a) => {
    const fecha = new Date(a.registrado_en);
    const desde = new Date();
    desde.setDate(desde.getDate() - periodo);
    if (fecha < desde) return false;
    if (filtroMedico !== "todos" && a.medico_id !== filtroMedico) return false;
    if (filtroEsp !== "todas") {
      const medico = medicos.find((m) => m.id === a.medico_id);
      if (medico?.especialidad_id !== filtroEsp) return false;
    }
    return true;
  });

  // Datos agrupados por médico para gráfico de barras
  const dataPorMedico = medicos
    .map((m) => ({
      nombre: m.apellido,
      atenciones: atencionesFiltradas.filter((a) => a.medico_id === m.id)
        .length,
      id: m.id,
    }))
    .filter((d) => filtroMedico === "todos" || d.id === filtroMedico)
    .sort((a, b) => b.atenciones - a.atenciones);

  // Datos agrupados por día para gráfico de línea
  const dataPorDia = (() => {
    const grupos = {};
    atencionesFiltradas.forEach((a) => {
      const dia = new Date(a.registrado_en).toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
      });
      grupos[dia] = (grupos[dia] || 0) + 1;
    });
    return Object.entries(grupos).map(([dia, total]) => ({ dia, total }));
  })();

  // Datos agrupados por especialidad para pie chart
  const dataPorEsp = especialidades
    .map((e) => ({
      nombre: e.nombre,
      value: atencionesFiltradas.filter((a) => {
        const m = medicos.find((m) => m.id === a.medico_id);
        return m?.especialidad_id === e.id;
      }).length,
    }))
    .filter((d) => d.value > 0);

  const totalAtenciones = atencionesFiltradas.length;
  const medicosActivos = medicos.length;
  const promedio =
    medicosActivos > 0 ? Math.round(totalAtenciones / medicosActivos) : 0;

  const getNombreEsp = (id) => {
    const e = especialidades.find((e) => e.id === id);
    return e ? e.nombre : "Sin especialidad";
  };

  const colores = [
    "#378ADD",
    "#1D9E75",
    "#7F77DD",
    "#EF9F27",
    "#D85A30",
    "#E24B4A",
  ];

  const coloresAvatar = [
    "bg-blue-100 text-blue-700",
    "bg-teal-100 text-teal-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-green-100 text-green-700",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con filtros */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-sm font-medium text-gray-900 mr-auto">
            Dashboard — solo lectura
          </div>

          {/* Filtro especialidad */}
          <select
            value={filtroEsp}
            onChange={(e) => setFiltroEsp(e.target.value)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white"
          >
            <option value="todas">Todas las especialidades</option>
            {especialidades.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>

          {/* Filtro médico */}
          <select
            value={filtroMedico}
            onChange={(e) => setFiltroMedico(e.target.value)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white"
          >
            <option value="todos">Todos los médicos</option>
            {medicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} {m.apellido}
              </option>
            ))}
          </select>

          {/* Filtro período */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {[
              { label: "Hoy", value: 1 },
              { label: "Semana", value: 7 },
              { label: "Mes", value: 30 },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriodo(p.value)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  periodo === p.value
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {cargando ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-gray-400">Cargando dashboard...</div>
          </div>
        ) : (
          <div className="max-w-5xl">
            {/* Métricas */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">
                  Total atenciones
                </div>
                <div className="text-3xl font-medium text-gray-900">
                  {totalAtenciones}
                </div>
                <div className="text-xs text-gray-400 mt-1">en el período</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">
                  Médicos activos
                </div>
                <div className="text-3xl font-medium text-gray-900">
                  {medicosActivos}
                </div>
                <div className="text-xs text-gray-400 mt-1">registrados</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">
                  Promedio/médico
                </div>
                <div className="text-3xl font-medium text-blue-600">
                  {promedio}
                </div>
                <div className="text-xs text-gray-400 mt-1">atenciones</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">Especialidades</div>
                <div className="text-3xl font-medium text-gray-900">
                  {especialidades.length}
                </div>
                <div className="text-xs text-gray-400 mt-1">activas</div>
              </div>
            </div>

            {/* Gráficos fila 1 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Barras por médico */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Atenciones por médico
                </div>
                <div className="text-xs text-gray-400 mb-4">
                  Período seleccionado
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dataPorMedico} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="nombre"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "0.5px solid #e5e7eb",
                      }}
                    />
                    <Bar
                      dataKey="atenciones"
                      fill="#378ADD"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Línea por día */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Atenciones por día
                </div>
                <div className="text-xs text-gray-400 mb-4">
                  Evolución en el período
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dataPorDia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="dia"
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "0.5px solid #e5e7eb",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#1D9E75"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#1D9E75" }}
                      label={{ position: "top", fontSize: 10, fill: "#6b7280" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráficos fila 2 */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {/* Pie por especialidad */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="text-sm font-medium text-gray-900 mb-4">
                  Por especialidad
                </div>
                {dataPorEsp.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie
                          data={dataPorEsp}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={60}
                          dataKey="value"
                        >
                          {dataPorEsp.map((_, i) => (
                            <Cell key={i} fill={colores[i % colores.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-1 mt-2">
                      {dataPorEsp.map((d, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: colores[i % colores.length] }}
                          />
                          <span className="text-gray-600 truncate flex-1">
                            {d.nombre}
                          </span>
                          <span className="font-medium text-gray-900">
                            {d.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-gray-400 text-center py-8">
                    Sin datos
                  </div>
                )}
              </div>

              {/* Ranking completo con tabla */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 col-span-2">
                <div className="text-sm font-medium text-gray-900 mb-4">
                  Ranking de productividad
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs text-gray-400 font-medium pb-2 w-6">
                        #
                      </th>
                      <th className="text-left text-xs text-gray-400 font-medium pb-2">
                        Médico
                      </th>
                      <th className="text-left text-xs text-gray-400 font-medium pb-2">
                        Especialidad
                      </th>
                      <th className="text-right text-xs text-gray-400 font-medium pb-2">
                        Atenciones
                      </th>
                      <th className="text-right text-xs text-gray-400 font-medium pb-2">
                        Ratio/día
                      </th>
                      <th className="text-right text-xs text-gray-400 font-medium pb-2">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataPorMedico.slice(0, 5).map((d, index) => {
                      const medico = medicos.find((m) => m.id === d.id);
                      const ratio = calcularRatioHora(d.atenciones, periodo);
                      const estado = getEstadoRendimiento(ratio);

                      return (
                        <tr
                          key={d.id}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="py-2.5 text-xs text-gray-400">
                            {index + 1}
                          </td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                                  coloresAvatar[index % coloresAvatar.length]
                                }`}
                              >
                                {medico
                                  ? getIniciales(medico.nombre, medico.apellido)
                                  : "?"}
                              </div>
                              <span className="text-xs font-medium text-gray-800">
                                {medico
                                  ? `${medico.nombre} ${medico.apellido}`
                                  : d.nombre}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 text-xs text-gray-500">
                            {medico
                              ? getNombreEsp(medico.especialidad_id)
                              : "—"}
                          </td>
                          <td className="py-2.5 text-xs font-medium text-gray-900 text-right">
                            {d.atenciones}
                          </td>
                          <td className="py-2.5 text-xs text-gray-600 text-right">
                            {ratio}
                          </td>
                          <td className="py-2.5 text-right">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                estado.color === "green"
                                  ? "bg-green-50 text-green-700"
                                  : estado.color === "amber"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-red-50 text-red-600"
                              }`}
                            >
                              {estado.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {dataPorMedico.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-xs text-gray-400 text-center py-6"
                        >
                          Sin datos en el período seleccionado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectorDashboard;
