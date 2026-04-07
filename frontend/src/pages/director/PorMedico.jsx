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
} from "recharts";

const PorMedico = () => {
  const { usuario } = useAuth();

  const [medicos, setMedicos] = useState([]);
  const [atenciones, setAtenciones] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [horarios, setHorarios] = useState({});
  const [medicoSeleccionado, setMedicoSeleccionado] = useState(null);
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
      if (resMedicos.data.length > 0) {
        setMedicoSeleccionado(resMedicos.data[0]);
      }

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

  // Filtra atenciones del médico seleccionado en el período
  const atencionesMedico = atenciones.filter((a) => {
    if (!medicoSeleccionado) return false;
    const fecha = new Date(a.registrado_en);
    const desde = new Date();
    desde.setDate(desde.getDate() - periodo);
    return a.medico_id === medicoSeleccionado.id && fecha >= desde;
  });

  // Agrupa por día
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
    atencionesMedico.forEach((a) => {
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

  // Horarios del médico seleccionado
  const horariosDelMedico = medicoSeleccionado
    ? horarios[medicoSeleccionado.id] || []
    : [];

  const horasTotales = horariosDelMedico.reduce((total, h) => {
    const inicio = new Date(`2000-01-01T${h.hora_inicio}`);
    const fin = new Date(`2000-01-01T${h.hora_fin}`);
    return total + (fin - inicio) / 3600000;
  }, 0);

  const ratio = calcularRatioHora(
    atencionesMedico.length,
    horasTotales || periodo * 4,
  );
  const estado = getEstadoRendimiento(ratio);

  const getNombreEsp = (id) => {
    const e = especialidades.find((e) => e.id === id);
    return e ? e.nombre : "Sin especialidad";
  };

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
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-sm font-medium text-gray-900 mr-auto">
            Análisis por médico — solo lectura
          </div>
          <select
            value={medicoSeleccionado?.id || ""}
            onChange={(e) => {
              const m = medicos.find((m) => m.id === e.target.value);
              setMedicoSeleccionado(m || null);
            }}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white"
          >
            {medicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} {m.apellido}
              </option>
            ))}
          </select>
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
            <div className="text-sm text-gray-400">Cargando...</div>
          </div>
        ) : (
          <div className="max-w-4xl">
            {/* Perfil del médico */}
            {medicoSeleccionado && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-medium flex-shrink-0 ${coloresAvatar[medicos.findIndex((m) => m.id === medicoSeleccionado.id) % coloresAvatar.length]}`}
                >
                  {getIniciales(
                    medicoSeleccionado.nombre,
                    medicoSeleccionado.apellido,
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-base font-medium text-gray-900">
                    {medicoSeleccionado.nombre} {medicoSeleccionado.apellido}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {getNombreEsp(medicoSeleccionado.especialidad_id)}
                    {medicoSeleccionado.codigo &&
                      ` · ${medicoSeleccionado.codigo}`}
                  </div>
                </div>
                <div
                  className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                    estado.color === "green"
                      ? "bg-green-50 text-green-700"
                      : estado.color === "amber"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-600"
                  }`}
                >
                  {estado.label} · {ratio} at/h
                </div>
              </div>
            )}

            {/* Métricas */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">
                  Total atenciones
                </div>
                <div className="text-3xl font-medium text-gray-900">
                  {atencionesMedico.length}
                </div>
                <div className="text-xs text-gray-400 mt-1">en el período</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">
                  Atenciones/hora
                </div>
                <div className="text-3xl font-medium text-blue-600">
                  {ratio}
                </div>
                <div className="text-xs text-gray-400 mt-1">rendimiento</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">Turno mañana</div>
                <div className="text-3xl font-medium text-amber-600">
                  {atencionesMedico.filter((a) => a.turno === "mañana").length}
                </div>
                <div className="text-xs text-gray-400 mt-1">atenciones</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">Turno tarde</div>
                <div className="text-3xl font-medium text-purple-600">
                  {atencionesMedico.filter((a) => a.turno === "tarde").length}
                </div>
                <div className="text-xs text-gray-400 mt-1">atenciones</div>
              </div>
            </div>

            {/* Gráfico evolución */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
              <div className="text-sm font-medium text-gray-900 mb-1">
                Evolución diaria
              </div>
              <div className="text-xs text-gray-400 mb-4">
                Atenciones por día con desglose de turnos
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
                    dot={{ r: 3 }}
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
            </div>

            {/* Horarios del médico */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="text-sm font-medium text-gray-900 mb-4">
                Horarios programados
              </div>
              {horariosDelMedico.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-6">
                  Sin horarios registrados
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {horariosDelMedico.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0"
                    >
                      <div className="w-24 text-xs font-medium text-gray-700 capitalize">
                        {h.dia_semana}
                      </div>
                      <div className="text-xs text-gray-600">
                        {h.hora_inicio} – {h.hora_fin}
                      </div>
                      <div
                        className={`text-xs px-2 py-0.5 rounded-full ml-auto ${
                          h.turno === "mañana"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {h.turno === "mañana" ? "Mañana" : "Tarde"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PorMedico;
