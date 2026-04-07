import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getIniciales, getTurnoActual } from "../../utils/helpers";

const TurnoHoy = () => {
  const { usuario } = useAuth();

  const [medicos, setMedicos] = useState([]);
  const [horarios, setHorarios] = useState({});
  const [atenciones, setAtenciones] = useState([]);
  const [turnoFiltro, setTurnoFiltro] = useState("todos");
  const [cargando, setCargando] = useState(true);

  // Turno actual detectado por hora del sistema
  const turnoActual = getTurnoActual();

  // Fecha de hoy formateada
  const hoy = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Nombre del día actual para cruzar con horarios
  const nombreDiaHoy = new Date()
    .toLocaleDateString("es-PE", { weekday: "long" })
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace("miércoles", "miercoles");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resMedicos, resAtenciones] = await Promise.all([
        api.get("/medicos/"),
        api.get(`/atenciones/clinica/${usuario.clinica_id}`),
      ]);

      setMedicos(resMedicos.data);
      setAtenciones(resAtenciones.data);

      // Carga horarios de cada médico
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

  // Obtiene el horario de hoy de un médico
  const getHorarioHoy = (medicoId) => {
    const h = horarios[medicoId] || [];
    return h.filter((h) => h.dia_semana === nombreDiaHoy);
  };

  // Cuenta atenciones de hoy de un médico
  const getAtencionesHoy = (medicoId) => {
    const hoyStr = new Date().toDateString();
    return atenciones.filter(
      (a) =>
        a.medico_id === medicoId &&
        new Date(a.registrado_en).toDateString() === hoyStr,
    ).length;
  };

  // Determina el estado del médico según sus atenciones
  const getEstado = (atencionesCont, horariosHoy) => {
    if (horariosHoy.length === 0) return { label: "Sin turno", color: "gray" };
    if (atencionesCont === 0) return { label: "Sin actividad", color: "red" };
    if (atencionesCont < 3) return { label: "Poca actividad", color: "amber" };
    return { label: "En consulta", color: "green" };
  };

  // Médicos con turno hoy filtrados por turno seleccionado
  const medicosFiltrados = medicos.filter((m) => {
    const horariosHoy = getHorarioHoy(m.id);
    if (horariosHoy.length === 0) return false;
    if (turnoFiltro === "todos") return true;
    return horariosHoy.some((h) => h.turno === turnoFiltro);
  });

  // Médicos sin turno hoy
  const medicosSinTurno = medicos.filter(
    (m) => getHorarioHoy(m.id).length === 0,
  );

  // Totales para las métricas
  const totalAtencionesDia = atenciones.filter(
    (a) =>
      new Date(a.registrado_en).toDateString() === new Date().toDateString(),
  ).length;

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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-gray-900 capitalize">
              Turno de hoy
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">{hoy}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Indicador turno actual */}
            <div
              className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                turnoActual === "mañana"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              Turno actual: {turnoActual === "mañana" ? "Mañana" : "Tarde"}
            </div>

            {/* Filtro de turno */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {["todos", "mañana", "tarde"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTurnoFiltro(t)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all capitalize ${
                    turnoFiltro === t
                      ? t === "mañana"
                        ? "bg-amber-500 text-white"
                        : t === "tarde"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-white"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Botón actualizar */}
            <button
              onClick={cargarDatos}
              className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {cargando ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-gray-400">Cargando turno...</div>
          </div>
        ) : (
          <div className="max-w-3xl">
            {/* Métricas rápidas */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">
                  Médicos en turno
                </div>
                <div className="text-3xl font-medium text-gray-900">
                  {medicosFiltrados.length}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  programados hoy
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">Atenciones hoy</div>
                <div className="text-3xl font-medium text-blue-600">
                  {totalAtencionesDia}
                </div>
                <div className="text-xs text-gray-400 mt-1">registradas</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">Sin actividad</div>
                <div className="text-3xl font-medium text-red-500">
                  {
                    medicosFiltrados.filter((m) => getAtencionesHoy(m.id) === 0)
                      .length
                  }
                </div>
                <div className="text-xs text-gray-400 mt-1">médicos</div>
              </div>
            </div>

            {/* Lista de médicos en turno */}
            <div className="flex flex-col gap-3 mb-6">
              {medicosFiltrados.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm bg-white border border-gray-200 rounded-2xl">
                  No hay médicos con turno programado para hoy
                </div>
              ) : (
                medicosFiltrados.map((medico, index) => {
                  const horariosHoy = getHorarioHoy(medico.id);
                  const count = getAtencionesHoy(medico.id);
                  const estado = getEstado(count, horariosHoy);

                  return (
                    <div
                      key={medico.id}
                      className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4 hover:shadow-sm transition-all"
                    >
                      {/* Avatar */}
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                          coloresAvatar[index % coloresAvatar.length]
                        }`}
                      >
                        {getIniciales(medico.nombre, medico.apellido)}
                      </div>

                      {/* Info del médico */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {medico.nombre} {medico.apellido}
                        </div>
                        {/* Horarios de hoy */}
                        <div className="flex flex-wrap gap-2 mt-1">
                          {horariosHoy.map((h, i) => (
                            <span
                              key={i}
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                h.turno === "mañana"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {h.hora_inicio} – {h.hora_fin} ·{" "}
                              {h.turno === "mañana" ? "Mañana" : "Tarde"}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Contador de atenciones */}
                      <div className="text-center flex-shrink-0 w-16">
                        <div
                          className={`text-2xl font-medium ${
                            count > 0 ? "text-blue-600" : "text-gray-300"
                          }`}
                        >
                          {count}
                        </div>
                        <div className="text-xs text-gray-400">atenciones</div>
                      </div>

                      {/* Estado */}
                      <div
                        className={`flex items-center gap-1.5 flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium ${
                          estado.color === "green"
                            ? "bg-green-50 text-green-700"
                            : estado.color === "amber"
                              ? "bg-amber-50 text-amber-700"
                              : estado.color === "red"
                                ? "bg-red-50 text-red-600"
                                : "bg-gray-50 text-gray-500"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            estado.color === "green"
                              ? "bg-green-500"
                              : estado.color === "amber"
                                ? "bg-amber-500"
                                : estado.color === "red"
                                  ? "bg-red-500"
                                  : "bg-gray-400"
                          }`}
                        />
                        {estado.label}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Médicos sin turno hoy */}
            {medicosSinTurno.length > 0 && turnoFiltro === "todos" && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <div className="text-xs font-medium text-gray-500 mb-3">
                  Sin turno programado hoy
                </div>
                <div className="flex flex-wrap gap-2">
                  {medicosSinTurno.map((m, i) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          coloresAvatar[i % coloresAvatar.length]
                        }`}
                      >
                        {getIniciales(m.nombre, m.apellido)}
                      </div>
                      <span className="text-xs text-gray-600">
                        {m.nombre} {m.apellido}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnoHoy;
