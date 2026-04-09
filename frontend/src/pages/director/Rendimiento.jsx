import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getFechaLima, getIniciales, calcularRatioHora, getEstadoRendimiento } from "../../utils/helpers";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import BuscadorMedico from "../../components/BuscadorMedico";

const COLORES = ["#378ADD", "#1D9E75", "#7F77DD", "#EF9F27", "#D85A30", "#E24B4A"];
const COLORES_AVATAR = [
  "bg-blue-100 text-blue-700",
  "bg-teal-100 text-teal-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-green-100 text-green-700",
];

const hoyLima = getFechaLima();

const Rendimiento = () => {
  const { usuario } = useAuth();

  const [medicos, setMedicos] = useState([]);
  const [atenciones, setAtenciones] = useState([]);
  const [horarios, setHorarios] = useState({});
  const [especialidades, setEspecialidades] = useState([]);
  const [cargando, setCargando] = useState(true);

  // ── Filtros flotantes ──────────────────────────────────────
  const [filtroEsp, setFiltroEsp] = useState("todas");
  const [filtroMedico, setFiltroMedico] = useState("todos");
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date(hoyLima)
    d.setDate(d.getDate() - 6)
    return d.toISOString().slice(0, 10)
  });
  const [fechaFin, setFechaFin] = useState(hoyLima);
  const [granularidad, setGranularidad] = useState("dia"); // "dia" | "mes"

  // Atajos de período
  const aplicarPeriodo = (dias) => {
    const fin = hoyLima
    const d = new Date(hoyLima)
    d.setDate(d.getDate() - (dias - 1))
    setFechaInicio(d.toISOString().slice(0, 10))
    setFechaFin(fin)
  };

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

      const horariosMap = {};
      await Promise.all(
        resMedicos.data.map(async (m) => {
          try {
            const res = await api.get(`/medicos/${m.id}/horarios`);
            horariosMap[m.id] = res.data;
          } catch {
            horariosMap[m.id] = [];
          }
        })
      );
      setHorarios(horariosMap);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  // Filtra atenciones por rango de fechas
  const atencionesPeriodo = atenciones.filter((a) => {
    const fecha = a.registrado_en?.slice(0, 10);
    return fecha >= fechaInicio && fecha <= fechaFin;
  });

  // Horas programadas totales de un médico (todos sus horarios)
  const calcularHorasProgramadas = (medicoId) => {
    const h = horarios[medicoId] || [];
    return h.reduce((total, horario) => {
      const inicio = new Date(`2000-01-01T${horario.hora_inicio}`);
      const fin = new Date(`2000-01-01T${horario.hora_fin}`);
      return total + (fin - inicio) / 3600000;
    }, 0);
  };

  // Dataset filtrado de rendimiento
  const dataRendimiento = medicos
    .filter((m) => {
      if (filtroMedico !== "todos" && m.id !== filtroMedico) return false;
      if (filtroEsp !== "todas" && m.especialidad_id !== filtroEsp) return false;
      return true;
    })
    .map((m) => {
      const totalAtenciones = atencionesPeriodo.filter((a) => a.medico_id === m.id).length;
      const horasProgramadas = calcularHorasProgramadas(m.id);
      const ratio = calcularRatioHora(totalAtenciones, horasProgramadas || 1);
      const estado = getEstadoRendimiento(ratio);
      const esp = especialidades.find((e) => e.id === m.especialidad_id);
      // Horario legible
      const horariosM = (horarios[m.id] || []).filter(h => h.dia_semana);
      const horarioStr = horariosM.length > 0
        ? [...new Set(horariosM.map(h => `${h.dia_semana} ${h.hora_inicio}-${h.hora_fin}`))].join(', ')
        : '—';
      return {
        id: m.id,
        nombre: `${m.nombre} ${m.apellido}`,
        apellido: m.apellido,
        especialidad: esp?.nombre || "—",
        horario: horarioStr,
        atenciones: totalAtenciones,
        horas: Math.round(horasProgramadas * 10) / 10,
        ratio,
        estado,
      };
    })
    .sort((a, b) => b.ratio - a.ratio);

  // KPIs globales
  const totalAtenciones = dataRendimiento.reduce((s, d) => s + d.atenciones, 0);
  const totalHoras = Math.round(dataRendimiento.reduce((s, d) => s + d.horas, 0) * 10) / 10;
  const ratioGlobal = calcularRatioHora(totalAtenciones, totalHoras || 1);
  const promedioRatio = dataRendimiento.length > 0
    ? Math.round((dataRendimiento.reduce((s, d) => s + d.ratio, 0) / dataRendimiento.length) * 10) / 10
    : 0;
  const medicosAlerta = dataRendimiento.filter((d) => d.ratio < promedioRatio);

  // ── Data para gráfico de líneas (tendencia diaria) ─────────
  const dataTendencia = (() => {
    const dias = {};
    const d0 = new Date(fechaInicio);
    const d1 = new Date(fechaFin);
    for (let d = new Date(d0); d <= d1; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      dias[key] = { dia: key };
      dataRendimiento.forEach((m) => { dias[key][m.nombre] = 0; });
    }
    atencionesPeriodo.forEach((a) => {
      const medico = dataRendimiento.find((d) => d.id === a.medico_id);
      if (!medico) return;
      const key = a.registrado_en?.slice(0, 10);
      if (dias[key]) dias[key][medico.nombre] = (dias[key][medico.nombre] || 0) + 1;
    });
    return Object.values(dias);
  })();

  // ── Data para gráfico de barras dobles (horas vs atenciones) ─
  const dataBarras = dataRendimiento.map((d) => ({
    name: d.apellido,
    "Atenciones": d.atenciones,
    "Horas prog.": d.horas,
  }));

  // ── Exportar Excel ─────────────────────────────────────────
  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    // Hoja resumen de rendimiento
    const filas = [
      ["Especialidad", "Médico", "Horario", "Horas programadas", "Atenciones realizadas", "Ratio at/h"],
    ];
    dataRendimiento.forEach((d) => {
      filas.push([
        d.especialidad,
        d.nombre,
        d.horario,
        d.horas,
        d.atenciones,
        d.ratio,
      ]);
    });
    // Fila de totales
    filas.push(["", "TOTAL", "", totalHoras, totalAtenciones, ratioGlobal]);

    const ws = XLSX.utils.aoa_to_sheet(filas);
    XLSX.utils.book_append_sheet(wb, ws, `Rendimiento ${fechaInicio} al ${fechaFin}`);

    // Hoja de tendencia por día/mes según granularidad
    if (granularidad === "dia") {
      const filasTend = [["Fecha", ...dataRendimiento.map(d => d.nombre)]];
      dataTendencia.forEach((fila) => {
        filasTend.push([fila.dia, ...dataRendimiento.map(d => fila[d.nombre] || 0)]);
      });
      const wsTend = XLSX.utils.aoa_to_sheet(filasTend);
      XLSX.utils.book_append_sheet(wb, wsTend, "Detalle por día");
    } else {
      // Agrupa por mes
      const porMes = {};
      atencionesPeriodo.forEach((a) => {
        const mes = a.registrado_en?.slice(0, 7);
        if (!porMes[mes]) porMes[mes] = {};
        const medico = dataRendimiento.find(d => d.id === a.medico_id);
        if (medico) porMes[mes][medico.nombre] = (porMes[mes][medico.nombre] || 0) + 1;
      });
      const filasMes = [["Mes", ...dataRendimiento.map(d => d.nombre)]];
      Object.entries(porMes).sort().forEach(([mes, counts]) => {
        filasMes.push([mes, ...dataRendimiento.map(d => counts[d.nombre] || 0)]);
      });
      const wsMes = XLSX.utils.aoa_to_sheet(filasMes);
      XLSX.utils.book_append_sheet(wb, wsMes, "Detalle por mes");
    }

    XLSX.writeFile(wb, `rendimiento-${fechaInicio}-${fechaFin}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">

      {/* ── Filtros flotantes (sticky) ───────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-sm font-medium text-gray-800 mr-2 flex-shrink-0">
            Rendimiento médico
          </div>

          {/* Especialidad */}
          <select
            value={filtroEsp}
            onChange={(e) => setFiltroEsp(e.target.value)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white"
          >
            <option value="todas">Todas las especialidades</option>
            {especialidades.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>

          {/* Médico — buscador */}
          <div className="w-52">
            <BuscadorMedico
              medicos={[{ id: "todos", nombre: "Todos", apellido: "los médicos" }, ...medicos]}
              value={filtroMedico}
              onChange={(m) => setFiltroMedico(m?.id || "todos")}
              placeholder="Todos los médicos"
            />
          </div>

          {/* Fecha inicio */}
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400"
          />
          <span className="text-xs text-gray-400">→</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400"
          />

          {/* Atajos de período */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {[
              { label: "Hoy", dias: 1 },
              { label: "7d", dias: 7 },
              { label: "30d", dias: 30 },
            ].map((p) => (
              <button
                key={p.dias}
                onClick={() => aplicarPeriodo(p.dias)}
                className="px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-white rounded-md transition-all"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Granularidad Excel */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {[{ label: "Por día", v: "dia" }, { label: "Por mes", v: "mes" }].map((g) => (
              <button
                key={g.v}
                onClick={() => setGranularidad(g.v)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${granularidad === g.v ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Exportar */}
          <button
            onClick={exportarExcel}
            className="ml-auto text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            ↓ Excel
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        {cargando ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-gray-400">Calculando rendimiento...</div>
          </div>
        ) : (
          <div className="max-w-6xl space-y-5">

            {/* ── KPIs ──────────────────────────────────────── */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">Total atenciones</div>
                <div className="text-3xl font-medium text-blue-600">{totalAtenciones}</div>
                <div className="text-xs text-gray-400 mt-1">en el período</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">Total horas prog.</div>
                <div className="text-3xl font-medium text-teal-600">{totalHoras}</div>
                <div className="text-xs text-gray-400 mt-1">horas registradas</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">Ratio global</div>
                <div className="text-3xl font-medium text-purple-600">{ratioGlobal}</div>
                <div className="text-xs text-gray-400 mt-1">atenciones/hora</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">Bajo el promedio</div>
                <div className="text-3xl font-medium text-red-500">{medicosAlerta.length}</div>
                <div className="text-xs text-gray-400 mt-1">
                  médico{medicosAlerta.length !== 1 ? "s" : ""} — prom. {promedioRatio} at/h
                </div>
              </div>
            </div>

            {/* Alertas */}
            {medicosAlerta.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="text-xs font-medium text-red-700 mb-2">
                  Médicos bajo el promedio ({promedioRatio} at/h)
                </div>
                <div className="flex flex-wrap gap-2">
                  {medicosAlerta.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 bg-white border border-red-200 rounded-xl px-3 py-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span className="text-xs text-gray-700">{m.nombre}</span>
                      <span className="text-xs font-medium text-red-600">{m.ratio} at/h</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Gráfico de barras dobles: horas vs atenciones ── */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="text-sm font-medium text-gray-900 mb-1">
                Horas programadas vs Atenciones realizadas por médico
              </div>
              <div className="text-xs text-gray-400 mb-4">Comparación directa por médico</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={dataBarras} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Horas prog." fill="#1D9E75" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Atenciones" fill="#378ADD" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── Gráfico de líneas: tendencia diaria ─────────── */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="text-sm font-medium text-gray-900 mb-1">
                Tendencia diaria de atenciones por médico
              </div>
              <div className="text-xs text-gray-400 mb-3">
                {fechaInicio} → {fechaFin}
              </div>

              {/* Leyenda */}
              <div className="flex flex-wrap gap-3 mb-4">
                {dataRendimiento.map((d, i) => (
                  <div key={d.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORES[i % COLORES.length] }} />
                    {d.nombre}
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={dataTendencia} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}
                  />
                  <ReferenceLine
                    y={promedioRatio}
                    stroke="#E24B4A"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: `Prom: ${promedioRatio}`, position: "right", fontSize: 10, fill: "#E24B4A" }}
                  />
                  {dataRendimiento.map((d, i) => (
                    <Line
                      key={d.id}
                      type="monotone"
                      dataKey={d.nombre}
                      stroke={COLORES[i % COLORES.length]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: COLORES[i % COLORES.length] }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ── Tabla detallada ──────────────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="text-sm font-medium text-gray-900 mb-4">
                Detalle por médico
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 font-medium pb-2 w-6">#</th>
                    <th className="text-left text-xs text-gray-400 font-medium pb-2">Médico</th>
                    <th className="text-left text-xs text-gray-400 font-medium pb-2">Especialidad</th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-2">Atenciones</th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-2">Horas prog.</th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-2">At/hora</th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-2">vs prom.</th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRendimiento.map((d, index) => {
                    const diff = Math.round((d.ratio - promedioRatio) * 10) / 10;
                    return (
                      <tr key={d.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-3 text-xs text-gray-400">{index + 1}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${COLORES_AVATAR[index % COLORES_AVATAR.length]}`}>
                              {d.nombre.split(" ").map(p => p[0]).slice(0, 2).join("")}
                            </div>
                            <span className="text-xs font-medium text-gray-800">{d.nombre}</span>
                          </div>
                        </td>
                        <td className="py-3 text-xs text-gray-500">{d.especialidad}</td>
                        <td className="py-3 text-xs font-medium text-gray-900 text-right">{d.atenciones}</td>
                        <td className="py-3 text-xs text-gray-600 text-right">{d.horas}h</td>
                        <td className="py-3 text-xs font-medium text-right">
                          <span className={d.ratio >= promedioRatio ? "text-green-600" : "text-red-500"}>
                            {d.ratio} at/h
                          </span>
                        </td>
                        <td className="py-3 text-xs text-right">
                          <span className={diff >= 0 ? "text-green-600" : "text-red-500"}>
                            {diff >= 0 ? "+" : ""}{diff}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            d.estado.color === "green" ? "bg-green-50 text-green-700"
                            : d.estado.color === "amber" ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-600"
                          }`}>
                            {d.estado.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {dataRendimiento.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-xs text-gray-400 text-center py-6">
                        Sin datos en el período seleccionado
                      </td>
                    </tr>
                  )}
                  {dataRendimiento.length > 0 && (
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td className="py-3 text-xs text-gray-500" />
                      <td className="py-3 text-xs font-medium text-gray-700">Total clínica</td>
                      <td />
                      <td className="py-3 text-xs font-medium text-blue-600 text-right">{totalAtenciones}</td>
                      <td className="py-3 text-xs font-medium text-teal-600 text-right">{totalHoras}h</td>
                      <td className="py-3 text-xs font-medium text-purple-600 text-right">{ratioGlobal} at/h</td>
                      <td colSpan={2} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Rendimiento;
