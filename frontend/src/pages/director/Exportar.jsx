import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { formatearFechaHora } from "../../utils/helpers";

const Exportar = () => {
  const { usuario } = useAuth();

  const [medicos, setMedicos] = useState([]);
  const [atenciones, setAtenciones] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [periodo, setPeriodo] = useState(7);
  const [exportando, setExportando] = useState(null);
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

  // Filtra atenciones por período
  const atencionesPeriodo = atenciones.filter((a) => {
    const fecha = new Date(a.registrado_en);
    const desde = new Date();
    desde.setDate(desde.getDate() - periodo);
    return fecha >= desde;
  });

  // Convierte array de objetos a CSV y descarga
  const descargarCSV = (datos, nombreArchivo) => {
    if (datos.length === 0) return;
    const cabeceras = Object.keys(datos[0]).join(",");
    const filas = datos.map((d) =>
      Object.values(d)
        .map((v) => `"${v}"`)
        .join(","),
    );
    const csv = [cabeceras, ...filas].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${nombreArchivo}_${new Date().toLocaleDateString("es-PE").replace(/\//g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Exporta atenciones detalladas
  const exportarAtenciones = () => {
    setExportando("atenciones");
    const datos = atencionesPeriodo.map((a) => {
      const m = medicos.find((m) => m.id === a.medico_id);
      return {
        medico: m ? `${m.nombre} ${m.apellido}` : "—",
        turno: a.turno || "—",
        fecha: formatearFechaHora(a.registrado_en),
      };
    });
    descargarCSV(datos, "atenciones");
    setTimeout(() => setExportando(null), 1000);
  };

  // Exporta ranking por médico
  const exportarRanking = () => {
    setExportando("ranking");
    const datos = medicos
      .map((m) => {
        const total = atencionesPeriodo.filter(
          (a) => a.medico_id === m.id,
        ).length;
        const esp = especialidades.find((e) => e.id === m.especialidad_id);
        return {
          medico: `${m.nombre} ${m.apellido}`,
          especialidad: esp ? esp.nombre : "Sin especialidad",
          atenciones: total,
          codigo: m.codigo || "—",
        };
      })
      .sort((a, b) => b.atenciones - a.atenciones);
    descargarCSV(datos, "ranking_medicos");
    setTimeout(() => setExportando(null), 1000);
  };

  // Exporta por especialidad
  const exportarEspecialidades = () => {
    setExportando("especialidades");
    const datos = especialidades.map((e) => {
      const medicosEsp = medicos.filter((m) => m.especialidad_id === e.id);
      const total = atencionesPeriodo.filter((a) =>
        medicosEsp.some((m) => m.id === a.medico_id),
      ).length;
      return {
        especialidad: e.nombre,
        medicos: medicosEsp.length,
        atenciones: total,
        promedio_por_medico:
          medicosEsp.length > 0 ? Math.round(total / medicosEsp.length) : 0,
      };
    });
    descargarCSV(datos, "por_especialidad");
    setTimeout(() => setExportando(null), 1000);
  };

  // Exporta resumen diario
  const exportarResumenDiario = () => {
    setExportando("diario");
    const dias = {};
    atencionesPeriodo.forEach((a) => {
      const key = new Date(a.registrado_en).toLocaleDateString("es-PE");
      if (!dias[key]) dias[key] = { fecha: key, total: 0, manana: 0, tarde: 0 };
      dias[key].total += 1;
      if (a.turno === "mañana") dias[key].manana += 1;
      else dias[key].tarde += 1;
    });
    descargarCSV(Object.values(dias), "resumen_diario");
    setTimeout(() => setExportando(null), 1000);
  };

  const reportes = [
    {
      id: "atenciones",
      titulo: "Atenciones detalladas",
      descripcion: "Listado completo de atenciones con médico, turno y fecha",
      icono: "📋",
      accion: exportarAtenciones,
      count: atencionesPeriodo.length,
      unidad: "registros",
    },
    {
      id: "ranking",
      titulo: "Ranking de médicos",
      descripcion: "Médicos ordenados por total de atenciones en el período",
      icono: "🏆",
      accion: exportarRanking,
      count: medicos.length,
      unidad: "médicos",
    },
    {
      id: "especialidades",
      titulo: "Por especialidad",
      descripcion:
        "Distribución de atenciones agrupadas por especialidad médica",
      icono: "📊",
      accion: exportarEspecialidades,
      count: especialidades.length,
      unidad: "especialidades",
    },
    {
      id: "diario",
      titulo: "Resumen diario",
      descripcion: "Total de atenciones por día con desglose de turnos",
      icono: "📅",
      accion: exportarResumenDiario,
      count: periodo,
      unidad: "días",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="mr-auto">
            <div className="text-sm font-medium text-gray-900">
              Exportar datos
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              Descarga reportes en formato CSV
            </div>
          </div>
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
            <div className="text-sm text-gray-400">Cargando datos...</div>
          </div>
        ) : (
          <div className="max-w-2xl">
            {/* Info del período */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 mb-6 flex items-center gap-3">
              <div className="text-blue-600 text-sm">ℹ</div>
              <div className="text-xs text-blue-700">
                Los reportes incluyen datos de los últimos{" "}
                <strong>{periodo} días</strong> —{atencionesPeriodo.length}{" "}
                atenciones en total.
              </div>
            </div>

            {/* Tarjetas de reportes */}
            <div className="flex flex-col gap-3">
              {reportes.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4 hover:shadow-sm transition-all"
                >
                  <div className="text-2xl flex-shrink-0">{r.icono}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {r.titulo}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {r.descripcion}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {r.count} {r.unidad}
                    </div>
                  </div>
                  <button
                    onClick={r.accion}
                    disabled={
                      exportando === r.id || atencionesPeriodo.length === 0
                    }
                    className={`flex-shrink-0 text-xs font-medium px-4 py-2 rounded-xl transition-all ${
                      exportando === r.id
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40"
                    }`}
                  >
                    {exportando === r.id ? "✓ Descargado" : "Descargar CSV"}
                  </button>
                </div>
              ))}
            </div>

            {atencionesPeriodo.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No hay datos en el período seleccionado para exportar
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Exportar;
