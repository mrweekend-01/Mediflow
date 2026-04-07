import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const Tendencia = () => {
  const { usuario } = useAuth();

  const [atenciones, setAtenciones] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [filtroMedico, setFiltroMedico] = useState("todos");
  const [filtroEsp, setFiltroEsp] = useState("todas");
  const [periodo, setPeriodo] = useState(30);
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
      const m = medicos.find((m) => m.id === a.medico_id);
      if (m?.especialidad_id !== filtroEsp) return false;
    }
    return true;
  });

  // Agrupa atenciones por día
  const dataPorDia = (() => {
    const grupos = {};
    for (let i = periodo; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
      });
      grupos[key] = { dia: key, atenciones: 0, manana: 0, tarde: 0 };
    }
    atencionesFiltradas.forEach((a) => {
      const key = new Date(a.registrado_en).toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
      });
      if (grupos[key]) {
        grupos[key].atenciones += 1;
        if (a.turno === "mañana") grupos[key].manana += 1;
        else grupos[key].tarde += 1;
      }
    });
    return Object.values(grupos);
  })();

  // Agrupa por semana para vista mensual
  const dataPorSemana = (() => {
    const semanas = {};
    atencionesFiltradas.forEach((a) => {
      const fecha = new Date(a.registrado_en);
      const inicioSemana = new Date(fecha);
      inicioSemana.setDate(fecha.getDate() - fecha.getDay());
      const key = inicioSemana.toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
      });
      if (!semanas[key]) semanas[key] = { semana: `S ${key}`, atenciones: 0 };
      semanas[key].atenciones += 1;
    });
    return Object.values(semanas);
  })();

  // Métricas generales
  const totalAtenciones = atencionesFiltradas.length;
  const promediodiario =
    periodo > 0 ? Math.round(totalAtenciones / periodo) : 0;
  const maxDia = dataPorDia.reduce(
    (max, d) => (d.atenciones > max.atenciones ? d : max),
    { atenciones: 0, dia: "—" },
  );
  const totalManana = atencionesFiltradas.filter(
    (a) => a.turno === "mañana",
  ).length;
  const totalTarde = atencionesFiltradas.filter(
    (a) => a.turno === "tarde",
  ).length;

  const coloresLinea = ["#378ADD", "#1D9E75", "#7F77DD", "#EF9F27"];

  // Datos de tendencia por médico agrupados por día
  const medicosFiltrados =
    filtroMedico !== "todos"
      ? medicos.filter((m) => m.id === filtroMedico)
      : medicos.filter((m) => {
          if (filtroEsp === "todas") return true;
          return m.especialidad_id === filtroEsp;
        });

  const dataTendenciaMedicos = (() => {
    const dias = {};
    for (let i = periodo; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
      });
      dias[key] = { dia: key };
      medicosFiltrados.forEach((m) => {
        dias[key][`${m.nombre} ${m.apellido}`] = 0;
      });
    }
    atencionesFiltradas.forEach((a) => {
      const m = medicosFiltrados.find((m) => m.id === a.medico_id);
      if (!m) return;
      const key = new Date(a.registrado_en).toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
      });
      if (dias[key]) {
        dias[key][`${m.nombre} ${m.apellido}`] =
          (dias[key][`${m.nombre} ${m.apellido}`] || 0) + 1;
      }
    });
    return Object.values(dias);
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con filtros */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="mr-auto">
            <div className="text-sm font-medium text-gray-900">Tendencia</div>
            <div className="text-xs text-gray-400 mt-0.5">
              Evolución histórica de atenciones — solo lectura
            </div>
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

          {/* Selector período */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {[
              { label: "7 días", value: 7 },
              { label: "30 días", value: 30 },
              { label: "90 días", value: 90 },
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
            <div className="text-sm text-gray-400">Cargando tendencia...</div>
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
                <div className="text-xs text-gray-400 mt-1">
                  en {periodo} días
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">
                  Promedio diario
                </div>
                <div className="text-3xl font-medium text-blue-600">
                  {promediodiario}
                </div>
                <div className="text-xs text-gray-400 mt-1">atenciones/día</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">Día pico</div>
                <div className="text-3xl font-medium text-green-600">
                  {maxDia.atenciones}
                </div>
                <div className="text-xs text-gray-400 mt-1">{maxDia.dia}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">Mañana / Tarde</div>
                <div className="text-xl font-medium text-gray-900 mt-1">
                  <span className="text-amber-600">{totalManana}</span>
                  <span className="text-gray-300 mx-1">/</span>
                  <span className="text-blue-600">{totalTarde}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  atenciones por turno
                </div>
              </div>
            </div>

            {/* Gráfico de línea — evolución diaria total */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
              <div className="text-sm font-medium text-gray-900 mb-1">
                Evolución diaria de atenciones
              </div>
              <div className="text-xs text-gray-400 mb-4">
                Total por día con desglose mañana / tarde
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={dataPorDia}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="dia"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    interval={periodo > 7 ? Math.floor(periodo / 7) : 0}
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
                    dataKey="atenciones"
                    name="Total"
                    stroke="#378ADD"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                    label={{
                      position: "top",
                      fontSize: 9,
                      fill: "#9ca3af",
                      formatter: (v) => (v > 0 ? v : ""),
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="manana"
                    name="Mañana"
                    stroke="#EF9F27"
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="4 3"
                  />
                  <Line
                    type="monotone"
                    dataKey="tarde"
                    name="Tarde"
                    stroke="#7F77DD"
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="4 3"
                  />
                </LineChart>
              </ResponsiveContainer>
              {/* Leyenda manual */}
              <div className="flex gap-4 mt-3 justify-center">
                {[
                  { label: "Total", color: "#378ADD", dash: false },
                  { label: "Mañana", color: "#EF9F27", dash: true },
                  { label: "Tarde", color: "#7F77DD", dash: true },
                ].map((l) => (
                  <div
                    key={l.label}
                    className="flex items-center gap-1.5 text-xs text-gray-500"
                  >
                    <svg width="20" height="8">
                      <line
                        x1="0"
                        y1="4"
                        x2="20"
                        y2="4"
                        stroke={l.color}
                        strokeWidth={l.dash ? 1.5 : 2.5}
                        strokeDasharray={l.dash ? "4 3" : "none"}
                      />
                    </svg>
                    {l.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Gráfico de barras — por semana */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
              <div className="text-sm font-medium text-gray-900 mb-1">
                Atenciones por semana
              </div>
              <div className="text-xs text-gray-400 mb-4">
                Agrupado semanalmente
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dataPorSemana} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="semana"
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
                  <Bar
                    dataKey="atenciones"
                    fill="#1D9E75"
                    radius={[4, 4, 0, 0]}
                    label={{ position: "top", fontSize: 10, fill: "#6b7280" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de líneas por médico */}
            {medicosFiltrados.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Tendencia por médico
                </div>
                <div className="text-xs text-gray-400 mb-3">
                  Evolución diaria individual
                </div>
                <div className="flex flex-wrap gap-3 mb-4">
                  {medicosFiltrados.map((m, i) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-1.5 text-xs text-gray-600"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          background: coloresLinea[i % coloresLinea.length],
                        }}
                      />
                      {m.nombre} {m.apellido}
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={dataTendenciaMedicos}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="dia"
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      interval={periodo > 7 ? Math.floor(periodo / 7) : 0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "0.5px solid #e5e7eb",
                      }}
                    />
                    {medicosFiltrados.map((m, i) => (
                      <Line
                        key={m.id}
                        type="monotone"
                        dataKey={`${m.nombre} ${m.apellido}`}
                        stroke={coloresLinea[i % coloresLinea.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tendencia;
