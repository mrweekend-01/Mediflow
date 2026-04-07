import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  getIniciales,
  calcularRatioHora,
  getEstadoRendimiento,
} from "../../utils/helpers";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const Rendimiento = () => {
  const { usuario } = useAuth();

  const [medicos, setMedicos] = useState([]);
  const [atenciones, setAtenciones] = useState([]);
  const [horarios, setHorarios] = useState({});
  const [especialidades, setEspecialidades] = useState([]);
  const [filtroEsp, setFiltroEsp] = useState("todas");
  const [filtroMedico, setFiltroMedico] = useState("todos");
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

      const horariosMap = {};
      await Promise.all(
        resMedicos.data.map(async (m) => {
          try {
            const res = await api.get(`/medicos/${m.id}/horarios`);
            horariosMap[m.id] = res.data;
          } catch {
            horariosMap[m.id] = [];
          }
        }),
      );
      setHorarios(horariosMap);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  // Filtra atenciones según período seleccionado
  const atencionesPeriodo = atenciones.filter((a) => {
    const fecha = new Date(a.registrado_en);
    const desde = new Date();
    desde.setDate(desde.getDate() - periodo);
    return fecha >= desde;
  });

  // Calcula horas programadas totales de un médico
  const calcularHorasProgramadas = (medicoId) => {
    const h = horarios[medicoId] || [];
    return h.reduce((total, horario) => {
      const inicio = new Date(`2000-01-01T${horario.hora_inicio}`);
      const fin = new Date(`2000-01-01T${horario.hora_fin}`);
      return total + (fin - inicio) / 3600000;
    }, 0);
  };

  // Dataset de rendimiento con filtros aplicados
  const dataRendimiento = medicos
    .filter((m) => {
      if (filtroMedico !== "todos" && m.id !== filtroMedico) return false;
      if (filtroEsp !== "todas" && m.especialidad_id !== filtroEsp)
        return false;
      return true;
    })
    .map((m) => {
      const totalAtenciones = atencionesPeriodo.filter(
        (a) => a.medico_id === m.id,
      ).length;
      const horasProgramadas = calcularHorasProgramadas(m.id) || periodo * 4;
      const ratio = calcularRatioHora(totalAtenciones, horasProgramadas);
      const estado = getEstadoRendimiento(ratio);
      return {
        id: m.id,
        nombre: `${m.nombre} ${m.apellido}`,
        apellido: m.apellido,
        atenciones: totalAtenciones,
        horas: Math.round(horasProgramadas * 10) / 10,
        ratio,
        estado,
      };
    })
    .sort((a, b) => b.ratio - a.ratio);

  // Promedio del ratio de la clínica
  const promedioRatio =
    dataRendimiento.length > 0
      ? Math.round(
          (dataRendimiento.reduce((s, d) => s + d.ratio, 0) /
            dataRendimiento.length) *
            10,
        ) / 10
      : 0;

  // Médicos bajo el promedio — alertas
  const medicosAlerta = dataRendimiento.filter((d) => d.ratio < promedioRatio);

  // Colores para cada línea de médico
  const coloresLinea = [
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

  // Datos agrupados por día — una columna de atenciones y una de horas por médico
  const dataPorDiaMedico = (() => {
    const dias = {};
    for (let i = periodo; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
      });
      // Nombre del día para cruzar con horarios registrados
      const nombreDia = d
        .toLocaleDateString("es-PE", { weekday: "long" })
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace("miércoles", "miercoles");

      dias[key] = { dia: key };

      dataRendimiento.forEach((m) => {
        // Inicializa atenciones en 0
        dias[key][m.nombre] = 0;
        // Calcula horas programadas de ese médico ese día de la semana
        const horariosMedico = horarios[m.id] || [];
        const horasDelDia = horariosMedico
          .filter((h) => h.dia_semana === nombreDia)
          .reduce((total, h) => {
            const inicio = new Date(`2000-01-01T${h.hora_inicio}`);
            const fin = new Date(`2000-01-01T${h.hora_fin}`);
            return total + (fin - inicio) / 3600000;
          }, 0);
        dias[key][`${m.nombre}_horas`] = Math.round(horasDelDia * 10) / 10;
      });
    }

    // Cuenta atenciones reales por día por médico
    atencionesPeriodo.forEach((a) => {
      const medico = dataRendimiento.find((d) => d.id === a.medico_id);
      if (!medico) return;
      const key = new Date(a.registrado_en).toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
      });
      if (dias[key]) {
        dias[key][medico.nombre] = (dias[key][medico.nombre] || 0) + 1;
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
            <div className="text-sm font-medium text-gray-900">
              Rendimiento médico
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              KPI: atenciones por hora — solo lectura
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
            <div className="text-sm text-gray-400">
              Calculando rendimiento...
            </div>
          </div>
        ) : (
          <div className="max-w-5xl">
            {/* Tarjetas KPI */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">
                  Promedio clínica
                </div>
                <div className="text-3xl font-medium text-blue-600">
                  {promedioRatio}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  atenciones/hora
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">
                  Mejor rendimiento
                </div>
                <div className="text-3xl font-medium text-green-600">
                  {dataRendimiento[0]?.ratio || 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {dataRendimiento[0]?.apellido || "—"}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">
                  Bajo el promedio
                </div>
                <div className="text-3xl font-medium text-red-500">
                  {medicosAlerta.length}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  médico{medicosAlerta.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">
                  Total atenciones
                </div>
                <div className="text-3xl font-medium text-gray-900">
                  {atencionesPeriodo.length}
                </div>
                <div className="text-xs text-gray-400 mt-1">en el período</div>
              </div>
            </div>

            {/* Alertas — médicos bajo el promedio */}
            {medicosAlerta.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                <div className="text-xs font-medium text-red-700 mb-2">
                  Médicos por debajo del promedio — requieren atención
                </div>
                <div className="flex flex-wrap gap-2">
                  {medicosAlerta.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2 bg-white border border-red-200 rounded-xl px-3 py-1.5"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span className="text-xs text-gray-700">{m.nombre}</span>
                      <span className="text-xs font-medium text-red-600">
                        {m.ratio} at/h
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gráfico de líneas — una por médico */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
              <div className="text-sm font-medium text-gray-900 mb-1">
                Evolución diaria de atenciones por médico
              </div>
              <div className="text-xs text-gray-400 mb-3">
                Hover sobre el gráfico para ver atenciones y horas del día
              </div>

              {/* Leyenda de colores */}
              <div className="flex flex-wrap gap-3 mb-4">
                {dataRendimiento.map((d, i) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-1.5 text-xs text-gray-600"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: coloresLinea[i % coloresLinea.length],
                      }}
                    />
                    {d.nombre}
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={dataPorDiaMedico}
                  margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="dia"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />

                  {/* Tooltip personalizado con atenciones y horas del día */}
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const visibles = payload.filter(
                        (p) => !String(p.dataKey).includes("_horas"),
                      );
                      return (
                        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm min-w-52">
                          <div className="text-xs font-medium text-gray-700 mb-2 border-b border-gray-100 pb-1.5">
                            {label}
                          </div>
                          {visibles.map((p, i) => {
                            const horasKey = `${p.dataKey}_horas`;
                            const horasDelDia = p.payload[horasKey] ?? 0;
                            const ratioDelDia =
                              horasDelDia > 0 && p.value > 0
                                ? Math.round((p.value / horasDelDia) * 10) / 10
                                : null;
                            return (
                              <div
                                key={i}
                                className="flex items-start gap-2 text-xs mb-1.5 last:mb-0"
                              >
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
                                  style={{ background: p.color }}
                                />
                                <div>
                                  <div className="font-medium text-gray-800">
                                    {p.dataKey}
                                  </div>
                                  <div className="text-gray-500">
                                    {p.value} atenciones
                                    {horasDelDia > 0 && (
                                      <span> · {horasDelDia}h programadas</span>
                                    )}
                                  </div>
                                  {ratioDelDia && (
                                    <div className="text-blue-600 font-medium">
                                      {ratioDelDia} at/h ese día
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }}
                  />

                  {/* Línea de referencia del promedio */}
                  <ReferenceLine
                    y={promedioRatio}
                    stroke="#E24B4A"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Prom: ${promedioRatio}`,
                      position: "right",
                      fontSize: 10,
                      fill: "#E24B4A",
                    }}
                  />

                  {/* Una línea por cada médico */}
                  {dataRendimiento.map((d, i) => (
                    <Line
                      key={d.id}
                      type="monotone"
                      dataKey={d.nombre}
                      stroke={coloresLinea[i % coloresLinea.length]}
                      strokeWidth={2}
                      dot={{
                        r: 3,
                        fill: coloresLinea[i % coloresLinea.length],
                      }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Tabla detallada */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="text-sm font-medium text-gray-900 mb-4">
                Detalle por médico
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
                    <th className="text-right text-xs text-gray-400 font-medium pb-2">
                      Atenciones
                    </th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-2">
                      Horas prog.
                    </th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-2">
                      Atenciones/hora
                    </th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-2">
                      vs promedio
                    </th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-2">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dataRendimiento.map((d, index) => {
                    const diff =
                      Math.round((d.ratio - promedioRatio) * 10) / 10;
                    const medico = medicos.find((m) => m.id === d.id);
                    return (
                      <tr
                        key={d.id}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="py-3 text-xs text-gray-400">
                          {index + 1}
                        </td>
                        <td className="py-3">
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
                              {d.nombre}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-xs font-medium text-gray-900 text-right">
                          {d.atenciones}
                        </td>
                        <td className="py-3 text-xs text-gray-600 text-right">
                          {d.horas}h
                        </td>
                        <td className="py-3 text-xs font-medium text-right">
                          <span
                            className={
                              d.ratio >= promedioRatio
                                ? "text-green-600"
                                : "text-red-500"
                            }
                          >
                            {d.ratio} at/h
                          </span>
                        </td>
                        <td className="py-3 text-xs text-right">
                          <span
                            className={
                              diff >= 0 ? "text-green-600" : "text-red-500"
                            }
                          >
                            {diff >= 0 ? "+" : ""}
                            {diff}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              d.estado.color === "green"
                                ? "bg-green-50 text-green-700"
                                : d.estado.color === "amber"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-600"
                            }`}
                          >
                            {d.estado.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {dataRendimiento.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
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
        )}
      </div>
    </div>
  );
};

export default Rendimiento;
