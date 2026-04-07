import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getIniciales } from "../../utils/helpers";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const PorEspecialidad = () => {
  const { usuario } = useAuth();

  const [medicos, setMedicos] = useState([]);
  const [atenciones, setAtenciones] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [espSeleccionada, setEspSeleccionada] = useState(null);
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
      if (resEsp.data.length > 0) setEspSeleccionada(resEsp.data[0]);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  // Filtra atenciones por período
  const atencionesPeriodo = atenciones.filter((a) => {
    const fecha = new Date(a.registrado_en);
    const desde = new Date();
    desde.setDate(desde.getDate() - periodo);
    return fecha >= desde;
  });

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

  // Datos por especialidad para pie chart
  const dataPorEsp = especialidades
    .map((e, i) => {
      const medicosEsp = medicos.filter((m) => m.especialidad_id === e.id);
      const total = atencionesPeriodo.filter((a) =>
        medicosEsp.some((m) => m.id === a.medico_id),
      ).length;
      return {
        nombre: e.nombre,
        value: total,
        color: colores[i % colores.length],
      };
    })
    .filter((d) => d.value > 0);

  // Médicos de la especialidad seleccionada
  const medicosEspSeleccionada = espSeleccionada
    ? medicos.filter((m) => m.especialidad_id === espSeleccionada.id)
    : [];

  // Datos de médicos de la especialidad para barras
  const dataMedicosEsp = medicosEspSeleccionada
    .map((m) => ({
      nombre: m.apellido,
      atenciones: atencionesPeriodo.filter((a) => a.medico_id === m.id).length,
    }))
    .sort((a, b) => b.atenciones - a.atenciones);

  const totalEspSeleccionada = dataMedicosEsp.reduce(
    (s, d) => s + d.atenciones,
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-sm font-medium text-gray-900 mr-auto">
            Análisis por especialidad — solo lectura
          </div>
          <select
            value={espSeleccionada?.id || ""}
            onChange={(e) => {
              const esp = especialidades.find((x) => x.id === e.target.value);
              setEspSeleccionada(esp || null);
            }}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white"
          >
            {especialidades.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
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
            {/* Métricas especialidad seleccionada */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">
                  Total atenciones
                </div>
                <div className="text-3xl font-medium text-gray-900">
                  {totalEspSeleccionada}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {espSeleccionada?.nombre}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">
                  Médicos activos
                </div>
                <div className="text-3xl font-medium text-blue-600">
                  {medicosEspSeleccionada.length}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  en esta especialidad
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">
                  Promedio/médico
                </div>
                <div className="text-3xl font-medium text-green-600">
                  {medicosEspSeleccionada.length > 0
                    ? Math.round(
                        totalEspSeleccionada / medicosEspSeleccionada.length,
                      )
                    : 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">atenciones</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Pie chart de distribución */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="text-sm font-medium text-gray-900 mb-4">
                  Distribución general
                </div>
                {dataPorEsp.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={dataPorEsp}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          dataKey="value"
                        >
                          {dataPorEsp.map((d, i) => (
                            <Cell key={i} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-1.5 mt-2">
                      {dataPorEsp.map((d, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: d.color }}
                          />
                          <span className="text-gray-600 flex-1 truncate">
                            {d.nombre}
                          </span>
                          <span className="font-medium text-gray-900">
                            {d.value}
                          </span>
                          <span className="text-gray-400">
                            (
                            {Math.round(
                              (d.value / atencionesPeriodo.length) * 100,
                            )}
                            %)
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

              {/* Barras por médico de la especialidad */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Médicos — {espSeleccionada?.nombre}
                </div>
                <div className="text-xs text-gray-400 mb-4">
                  Atenciones en el período
                </div>
                {dataMedicosEsp.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={dataMedicosEsp} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="nombre"
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
                        fill="#378ADD"
                        radius={[4, 4, 0, 0]}
                        label={{
                          position: "top",
                          fontSize: 10,
                          fill: "#6b7280",
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-gray-400 text-center py-8">
                    Sin datos
                  </div>
                )}
              </div>
            </div>

            {/* Lista de médicos de la especialidad */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="text-sm font-medium text-gray-900 mb-4">
                Médicos en {espSeleccionada?.nombre}
              </div>
              <div className="flex flex-col gap-2">
                {medicosEspSeleccionada.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-6">
                    No hay médicos en esta especialidad
                  </div>
                ) : (
                  medicosEspSeleccionada.map((m, index) => {
                    const count = atencionesPeriodo.filter(
                      (a) => a.medico_id === m.id,
                    ).length;
                    const max = Math.max(
                      ...medicosEspSeleccionada.map(
                        (x) =>
                          atencionesPeriodo.filter((a) => a.medico_id === x.id)
                            .length,
                      ),
                      1,
                    );
                    const pct = Math.round((count / max) * 100);

                    return (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${coloresAvatar[index % coloresAvatar.length]}`}
                        >
                          {getIniciales(m.nombre, m.apellido)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-800">
                            {m.nombre} {m.apellido}
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                            <div
                              className="h-1.5 bg-blue-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900 w-8 text-right flex-shrink-0">
                          {count}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PorEspecialidad;
