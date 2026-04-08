import { useState, useEffect } from "react";
import api from "../../services/api";

const ResumenTriaje = () => {
  const [registros, setRegistros] = useState([]);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState("dia");

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  useEffect(() => {
    cargarDatos();
  }, [mes, anio]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const res = await api.get(`/triaje/mes?anio=${anio}&mes=${mes}`);
      setRegistros(res.data.data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  // Agrupa registros por día
  const registrosPorDia = registros.reduce((grupos, r) => {
    const dia = r.fecha;
    if (!grupos[dia]) grupos[dia] = [];
    grupos[dia].push(r);
    return grupos;
  }, {});

  // Resumen por médico del mes
  const resumenPorMedico = registros.reduce((acc, r) => {
    const key = `${r.medico_nombre} ${r.medico_apellido}`;
    if (!acc[key])
      acc[key] = {
        nombre: key,
        especialidad: r.especialidad_nombre,
        total: 0,
        manana: 0,
        tarde: 0,
      };
    acc[key].total += 1;
    if (r.turno === "mañana") acc[key].manana += 1;
    else acc[key].tarde += 1;
    return acc;
  }, {});

  // Resumen por especialidad del mes
  const resumenPorEspecialidad = registros.reduce((acc, r) => {
    const key = r.especialidad_nombre || "Sin especialidad";
    if (!acc[key]) acc[key] = { nombre: key, total: 0 };
    acc[key].total += 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-sm font-medium text-gray-900 mr-auto">
            Resumen de triaje — solo lectura
          </div>

          {/* Selector vista */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {[
              { label: "Por día", value: "dia" },
              { label: "Por médico", value: "medico" },
              { label: "Por especialidad", value: "especialidad" },
            ].map((v) => (
              <button
                key={v.value}
                onClick={() => setVista(v.value)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  vista === v.value
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Selector mes */}
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white"
          >
            {meses.map((m, i) => (
              <option key={i + 1} value={i + 1}>
                {m}
              </option>
            ))}
          </select>

          {/* Selector año */}
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white"
          >
            {[2024, 2025, 2026].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Métricas generales */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-400 mb-1">Total pacientes</div>
            <div className="text-3xl font-medium text-gray-900">
              {registros.length}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {meses[mes - 1]} {anio}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-400 mb-1">Turno mañana</div>
            <div className="text-3xl font-medium text-amber-600">
              {registros.filter((r) => r.turno === "mañana").length}
            </div>
            <div className="text-xs text-gray-400 mt-1">pacientes</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-400 mb-1">Turno tarde</div>
            <div className="text-3xl font-medium text-blue-600">
              {registros.filter((r) => r.turno === "tarde").length}
            </div>
            <div className="text-xs text-gray-400 mt-1">pacientes</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-400 mb-1">Días con atención</div>
            <div className="text-3xl font-medium text-green-600">
              {Object.keys(registrosPorDia).length}
            </div>
            <div className="text-xs text-gray-400 mt-1">días</div>
          </div>
        </div>

        {cargando ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-sm text-gray-400">Cargando...</div>
          </div>
        ) : registros.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm bg-white border border-gray-200 rounded-2xl">
            No hay registros para {meses[mes - 1]} {anio}
          </div>
        ) : (
          <>
            {/* Vista por día */}
            {vista === "dia" && (
              <div className="flex flex-col gap-4">
                {Object.entries(registrosPorDia)
                  .sort(([a], [b]) => new Date(a) - new Date(b))
                  .map(([fecha, regs]) => {
                    const fechaFormateada = new Date(fecha + "T12:00:00")
                      .toLocaleDateString("es-PE", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                      .toUpperCase();

                    return (
                      <div
                        key={fecha}
                        className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
                      >
                        {/* Cabecera del día estilo Excel */}
                        <div className="bg-yellow-400 px-5 py-2">
                          <div className="text-sm font-medium text-yellow-900 capitalize">
                            {fechaFormateada}
                          </div>
                          <div className="text-xs text-yellow-800">
                            {regs.length} pacientes ·{" "}
                            {regs.filter((r) => r.turno === "mañana").length}{" "}
                            mañana ·{" "}
                            {regs.filter((r) => r.turno === "tarde").length}{" "}
                            tarde
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left text-xs text-gray-400 font-medium px-4 py-2">
                                  N°
                                </th>
                                <th className="text-left text-xs text-gray-400 font-medium px-4 py-2">
                                  HCL
                                </th>
                                <th className="text-left text-xs text-gray-400 font-medium px-4 py-2">
                                  Boleta
                                </th>
                                <th className="text-left text-xs text-gray-400 font-medium px-4 py-2">
                                  Paciente
                                </th>
                                <th className="text-left text-xs text-gray-400 font-medium px-4 py-2">
                                  Edad
                                </th>
                                <th className="text-left text-xs text-gray-400 font-medium px-4 py-2">
                                  DNI
                                </th>
                                <th className="text-left text-xs text-gray-400 font-medium px-4 py-2">
                                  Especialidad
                                </th>
                                <th className="text-left text-xs text-gray-400 font-medium px-4 py-2">
                                  Médico
                                </th>
                                <th className="text-left text-xs text-gray-400 font-medium px-4 py-2">
                                  Seguro
                                </th>
                                <th className="text-left text-xs text-gray-400 font-medium px-4 py-2">
                                  Turno
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {regs.map((r) => (
                                <tr
                                  key={r.id}
                                  className="border-b border-gray-50 hover:bg-gray-50"
                                >
                                  <td className="px-4 py-2 text-xs font-medium text-gray-700">
                                    {r.numero_orden}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-gray-600">
                                    {r.hcl || "—"}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-gray-600">
                                    {r.boleta || "—"}
                                  </td>
                                  <td className="px-4 py-2 text-xs font-medium text-gray-800">
                                    {r.paciente_nombre || "—"}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-gray-600">
                                    {r.paciente_edad || "—"}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-gray-600">
                                    {r.paciente_dni || "—"}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-gray-600">
                                    {r.especialidad_nombre || "—"}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-gray-600">
                                    {r.medico_nombre} {r.medico_apellido}
                                  </td>
                                  <td className="px-4 py-2 text-xs text-gray-600">
                                    {r.seguro || "—"}
                                  </td>
                                  <td className="px-4 py-2">
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full ${
                                        r.turno === "mañana"
                                          ? "bg-amber-50 text-amber-700"
                                          : "bg-blue-50 text-blue-700"
                                      }`}
                                    >
                                      {r.turno === "mañana" ? "M" : "T"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Vista por médico */}
            {vista === "medico" && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">
                        #
                      </th>
                      <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">
                        Médico
                      </th>
                      <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">
                        Especialidad
                      </th>
                      <th className="text-right text-xs text-gray-400 font-medium px-5 py-3">
                        Total
                      </th>
                      <th className="text-right text-xs text-gray-400 font-medium px-5 py-3">
                        Mañana
                      </th>
                      <th className="text-right text-xs text-gray-400 font-medium px-5 py-3">
                        Tarde
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(resumenPorMedico)
                      .sort((a, b) => b.total - a.total)
                      .map((m, i) => (
                        <tr
                          key={i}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="px-5 py-3 text-xs text-gray-400">
                            {i + 1}
                          </td>
                          <td className="px-5 py-3 text-xs font-medium text-gray-800">
                            {m.nombre}
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-500">
                            {m.especialidad || "—"}
                          </td>
                          <td className="px-5 py-3 text-xs font-medium text-gray-900 text-right">
                            {m.total}
                          </td>
                          <td className="px-5 py-3 text-xs text-amber-600 text-right">
                            {m.manana}
                          </td>
                          <td className="px-5 py-3 text-xs text-blue-600 text-right">
                            {m.tarde}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Vista por especialidad */}
            {vista === "especialidad" && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">
                        #
                      </th>
                      <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">
                        Especialidad
                      </th>
                      <th className="text-right text-xs text-gray-400 font-medium px-5 py-3">
                        Pacientes
                      </th>
                      <th className="text-right text-xs text-gray-400 font-medium px-5 py-3">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(resumenPorEspecialidad)
                      .sort((a, b) => b.total - a.total)
                      .map((e, i) => (
                        <tr
                          key={i}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="px-5 py-3 text-xs text-gray-400">
                            {i + 1}
                          </td>
                          <td className="px-5 py-3 text-xs font-medium text-gray-800">
                            {e.nombre}
                          </td>
                          <td className="px-5 py-3 text-xs font-medium text-gray-900 text-right">
                            {e.total}
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-500 text-right">
                            {Math.round((e.total / registros.length) * 100)}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResumenTriaje;
