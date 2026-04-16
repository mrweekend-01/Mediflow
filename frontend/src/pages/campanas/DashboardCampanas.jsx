import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getFechaLima } from "../../utils/helpers";
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
  Legend,
} from "recharts";

const COLORES = [
  "#378ADD",
  "#1D9E75",
  "#7F77DD",
  "#EF9F27",
  "#D85A30",
  "#E24B4A",
  "#3DBFB8",
  "#9B59B6",
];

const hoyLima = getFechaLima();

const DashboardCampanas = () => {
  const { usuario } = useAuth();

  const [resumen, setResumen] = useState(null);
  const [tendencia, setTendencia] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [cargando, setCargando] = useState(true);

  // ── Filtros flotantes ──────────────────────────────────────
  const [filtroEsp, setFiltroEsp] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("todos");
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date(hoyLima);
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  });
  const [fechaFin, setFechaFin] = useState(hoyLima);

  // Atajos de período
  const aplicarPeriodo = (dias) => {
    const fin = hoyLima;
    const d = new Date(hoyLima);
    d.setDate(d.getDate() - (dias - 1));
    setFechaInicio(d.toISOString().slice(0, 10));
    setFechaFin(fin);
  };

  useEffect(() => {
    cargarEspecialidades();
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [fechaInicio, fechaFin, filtroEsp, filtroTurno]);

  const cargarEspecialidades = async () => {
    try {
      const res = await api.get("/especialidades/");
      setEspecialidades(res.data);
    } catch (err) {
      console.error("Error cargando especialidades:", err);
    }
  };

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
      if (filtroEsp) params.append("especialidad_id", filtroEsp);
      if (filtroTurno !== "todos") params.append("turno", filtroTurno);

      const [resResumen, resTendencia] = await Promise.all([
        api.get(`/campanas/resumen?${params}`),
        api.get(`/campanas/tendencia?${params}`),
      ]);

      setResumen(resResumen.data.data);
      setTendencia(resTendencia.data.data);
    } catch (err) {
      console.error("Error cargando campañas:", err);
    } finally {
      setCargando(false);
    }
  };

  // ── Export Excel ──────────────────────────────────────────
  const exportarExcel = () => {
    if (!resumen) return;
    const wb = XLSX.utils.book_new();

    const filas = [
      ["Campaña", "Pacientes", "% del total", "Especialidad principal", "Turno predominante"],
    ];
    resumen.campanas.forEach((c) => {
      filas.push([
        c.campana,
        c.pacientes,
        c.porcentaje,
        c.especialidad_principal,
        c.turno_principal,
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(filas);
    XLSX.utils.book_append_sheet(wb, ws, "Resumen campañas");

    if (tendencia?.serie?.length > 0) {
      const campanas = tendencia.campanas || [];
      const filasTend = [["Fecha", ...campanas]];
      tendencia.serie.forEach((fila) => {
        filasTend.push([fila.fecha, ...campanas.map((c) => fila[c] || 0)]);
      });
      const wsTend = XLSX.utils.aoa_to_sheet(filasTend);
      XLSX.utils.book_append_sheet(wb, wsTend, "Tendencia diaria");
    }

    XLSX.writeFile(wb, `campanas-${fechaInicio}-${fechaFin}.xlsx`);
  };

  // ── Data para gráfico de barras ────────────────────────────
  const dataBarras = resumen?.campanas?.map((c) => ({
    name: c.campana.length > 20 ? c.campana.slice(0, 18) + "…" : c.campana,
    fullName: c.campana,
    Pacientes: c.pacientes,
  })) || [];

  // ── Data para gráfico de líneas ────────────────────────────
  const campanasList = tendencia?.campanas || [];
  const dataTendencia = tendencia?.serie || [];

  // ── Líneas visibles (por defecto todas activas) ────────────
  const [lineasVisibles, setLineasVisibles] = useState({});
  useEffect(() => {
    if (campanasList.length > 0) {
      const visible = {};
      campanasList.forEach((c) => { visible[c] = true; });
      setLineasVisibles(visible);
    }
  }, [tendencia]);

  const toggleLinea = (campana) => {
    setLineasVisibles((prev) => ({ ...prev, [campana]: !prev[campana] }));
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        Cargando...
      </div>
    );
  }

  const totalPacientes = resumen?.total_pacientes ?? 0;
  const totalCampanas = resumen?.total_campanas ?? 0;
  const campanaActiva = resumen?.campana_mas_activa ?? "—";
  const promedio = resumen?.promedio_por_campana ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* ── Filtros flotantes sticky ───────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-sm font-medium text-gray-800 mr-2 flex-shrink-0">
            Campañas
          </div>

          {/* Especialidad */}
          <select
            value={filtroEsp}
            onChange={(e) => setFiltroEsp(e.target.value)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white"
          >
            <option value="">Todas las especialidades</option>
            {especialidades.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>

          {/* Turno */}
          <select
            value={filtroTurno}
            onChange={(e) => setFiltroTurno(e.target.value)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white"
          >
            <option value="todos">Ambos turnos</option>
            <option value="mañana">Mañana</option>
            <option value="tarde">Tarde</option>
          </select>

          {/* Fechas */}
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400"
          />
          <span className="text-xs text-gray-400">–</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400"
          />

          {/* Atajos */}
          <div className="flex gap-1">
            {[
              { label: "Hoy", dias: 1 },
              { label: "7d", dias: 7 },
              { label: "30d", dias: 30 },
            ].map(({ label, dias }) => (
              <button
                key={label}
                onClick={() => aplicarPeriodo(dias)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Exportar */}
          <button
            onClick={exportarExcel}
            className="ml-auto text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          >
            <span>↓</span> Exportar Excel
          </button>
        </div>
      </div>

      <div className="px-8 pt-6">
        {/* ── KPIs ──────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total pacientes",
              value: totalPacientes,
              sub: `${fechaInicio} — ${fechaFin}`,
            },
            {
              label: "Campaña más activa",
              value: campanaActiva,
              sub: "mayor volumen del período",
              small: true,
            },
            {
              label: "Campañas activas",
              value: totalCampanas,
              sub: "con pacientes registrados",
            },
            {
              label: "Promedio / campaña",
              value: promedio,
              sub: "pacientes por campaña",
            },
          ].map((kpi, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 px-5 py-4"
            >
              <div className="text-xs text-gray-500 mb-1">{kpi.label}</div>
              <div
                className={`font-semibold text-gray-900 ${
                  kpi.small ? "text-base leading-tight" : "text-2xl"
                }`}
              >
                {kpi.value}
              </div>
              <div className="text-xs text-gray-400 mt-1">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Gráficos ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Barras — comparación por volumen */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-xs font-medium text-gray-700 mb-4">
              Pacientes por campaña
            </div>
            {dataBarras.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-xs text-gray-400">
                Sin datos para el período seleccionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dataBarras} margin={{ top: 0, right: 10, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} allowDecimals={false} />
                  <Tooltip
                    formatter={(v, n, props) => [v, props.payload.fullName || n]}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <Bar dataKey="Pacientes" fill="#378ADD" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Líneas — tendencia diaria */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-700">
                Tendencia diaria por campaña
              </div>
            </div>
            {/* Leyenda seleccionable */}
            {campanasList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {campanasList.map((c, i) => (
                  <button
                    key={c}
                    onClick={() => toggleLinea(c)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      lineasVisibles[c]
                        ? "text-white border-transparent"
                        : "bg-white text-gray-400 border-gray-200"
                    }`}
                    style={
                      lineasVisibles[c]
                        ? { backgroundColor: COLORES[i % COLORES.length], borderColor: COLORES[i % COLORES.length] }
                        : {}
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            {dataTendencia.length === 0 || campanasList.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-xs text-gray-400">
                Sin datos para el período seleccionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dataTendencia} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 9, fill: "#6b7280" }}
                    tickFormatter={(v) => v.slice(5)}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  {campanasList.map((c, i) =>
                    lineasVisibles[c] ? (
                      <Line
                        key={c}
                        type="monotone"
                        dataKey={c}
                        stroke={COLORES[i % COLORES.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ) : null
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Tabla detallada ───────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-700">
              Detalle por campaña
            </span>
          </div>
          {resumen?.campanas?.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-xs text-gray-400">
              Sin campañas registradas en el período
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-2.5 text-gray-500 font-medium">Campaña</th>
                  <th className="text-right px-5 py-2.5 text-gray-500 font-medium">Pacientes</th>
                  <th className="text-left px-5 py-2.5 text-gray-500 font-medium">Especialidad principal</th>
                  <th className="text-left px-5 py-2.5 text-gray-500 font-medium">Turno predominante</th>
                  <th className="text-right px-5 py-2.5 text-gray-500 font-medium">% del total</th>
                </tr>
              </thead>
              <tbody>
                {resumen?.campanas?.map((c, i) => (
                  <tr
                    key={c.campana}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORES[i % COLORES.length] }}
                        />
                        <span className="text-gray-900 font-medium">{c.campana}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-right font-semibold text-gray-900">
                      {c.pacientes}
                    </td>
                    <td className="px-5 py-2.5 text-gray-600">{c.especialidad_principal}</td>
                    <td className="px-5 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          c.turno_principal === "mañana"
                            ? "bg-amber-50 text-amber-700"
                            : c.turno_principal === "tarde"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {c.turno_principal}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${c.porcentaje}%`,
                              backgroundColor: COLORES[i % COLORES.length],
                            }}
                          />
                        </div>
                        <span className="text-gray-600 w-10 text-right">{c.porcentaje}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCampanas;
