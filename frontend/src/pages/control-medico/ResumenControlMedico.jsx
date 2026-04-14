import { useState, useEffect } from "react";
import api from "../../services/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ResumenControlMedico = () => {
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
      const res = await api.get(`/control-medico/mes?anio=${anio}&mes=${mes}`);
      setRegistros(res.data.data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  const registrosPorDia = registros.reduce((grupos, r) => {
    const dia = r.fecha;
    if (!grupos[dia]) grupos[dia] = [];
    grupos[dia].push(r);
    return grupos;
  }, {});

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

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws_data = [];

    const diasOrdenados = Object.entries(registrosPorDia).sort(
      ([a], [b]) => new Date(a) - new Date(b),
    );

    diasOrdenados.forEach(([fecha, regs]) => {
      const fechaFormateada = new Date(fecha + "T12:00:00")
        .toLocaleDateString("es-PE", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
        .toUpperCase();

      ws_data.push([fechaFormateada]);
      ws_data.push([
        "N°",
        "N° ORDEN",
        "FECHA",
        "N° HCL",
        "N° BOLETA",
        "APELLIDOS Y NOMBRES",
        "EDAD",
        "DNI",
        "ESPECIALIDAD",
        "MÉDICO",
        "SEGURO",
        "TURNO",
      ]);

      regs.forEach((r, i) => {
        ws_data.push([
          i + 1,
          r.numero_orden,
          r.fecha,
          r.hcl || "",
          r.boleta || "",
          r.paciente_nombre || "",
          r.paciente_edad || "",
          r.paciente_dni || "",
          r.especialidad_nombre || "",
          `${r.medico_nombre || ""} ${r.medico_apellido || ""}`.trim(),
          r.seguro || "",
          r.turno === "mañana" ? "M" : "T",
        ]);
      });
      ws_data.push([]);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws["!cols"] = [
      { wch: 5 },
      { wch: 8 },
      { wch: 12 },
      { wch: 10 },
      { wch: 14 },
      { wch: 35 },
      { wch: 6 },
      { wch: 12 },
      { wch: 20 },
      { wch: 30 },
      { wch: 12 },
      { wch: 7 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, `${meses[mes - 1]} ${anio}`);
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `ControlMedico_${meses[mes - 1]}_${anio}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-sm font-medium text-gray-900 mr-auto">
            Resumen control médico — solo lectura
          </div>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {[
              { label: "Por día", value: "dia" },
              { label: "Por médico", value: "medico" },
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

          <button
            onClick={exportarExcel}
            disabled={registros.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40"
          >
            Descargar Excel
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-400 mb-1">Total registros</div>
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
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-400 mb-1">Turno tarde</div>
            <div className="text-3xl font-medium text-blue-600">
              {registros.filter((r) => r.turno === "tarde").length}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-400 mb-1">Días con registros</div>
            <div className="text-3xl font-medium text-green-600">
              {Object.keys(registrosPorDia).length}
            </div>
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
                        <div className="bg-yellow-400 px-5 py-2">
                          <div className="text-sm font-medium text-yellow-900 capitalize">
                            {fechaFormateada}
                          </div>
                          <div className="text-xs text-yellow-800">
                            {regs.length} registros ·{" "}
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
          </>
        )}
      </div>
    </div>
  );
};

export default ResumenControlMedico;
