import { useState, useEffect } from "react";
import api from "../../services/api";

const diasSemana = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

const Horarios = () => {
  const [medicos, setMedicos] = useState([]);
  const [medicoSeleccionado, setMedicoSeleccionado] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modo, setModo] = useState("semana");

  const [formIndividual, setFormIndividual] = useState({
    dia_semana: "lunes",
    turno: "mañana",
    hora_inicio: "08:00",
    hora_fin: "13:00",
  });

  const [formRango, setFormRango] = useState({
    fecha_inicio: "",
    fecha_fin: "",
    turno: "mañana",
    hora_inicio: "08:00",
    hora_fin: "13:00",
    dias_semana: [],
  });

  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    cargarMedicos();
  }, []);
  useEffect(() => {
    if (medicoSeleccionado) cargarHorarios(medicoSeleccionado.id);
  }, [medicoSeleccionado]);

  const cargarMedicos = async () => {
    try {
      const res = await api.get("/medicos/");
      setMedicos(res.data);
      if (res.data.length > 0) setMedicoSeleccionado(res.data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const cargarHorarios = async (medicoId) => {
    try {
      const res = await api.get(`/medicos/${medicoId}/horarios`);
      setHorarios(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const eliminarHorario = async (id) => {
    if (!confirm("¿Eliminar este horario?")) return;
    try {
      await api.delete(`/medicos/horarios/${id}`);
      mostrarToast("Horario eliminado", "success");
      cargarHorarios(medicoSeleccionado.id);
    } catch (err) {
      mostrarToast("Error al eliminar", "error");
    }
  };

  const agregarHorarioIndividual = async () => {
    if (!medicoSeleccionado) return;
    setGuardando(true);
    try {
      await api.post(`/medicos/${medicoSeleccionado.id}/horarios`, {
        medico_id: medicoSeleccionado.id,
        ...formIndividual,
      });
      mostrarToast("Horario agregado correctamente", "success");
      setModalAbierto(false);
      cargarHorarios(medicoSeleccionado.id);
    } catch (err) {
      mostrarToast("Error al agregar horario", "error");
    } finally {
      setGuardando(false);
    }
  };

  const agregarHorarioRango = async () => {
    if (!medicoSeleccionado) return;
    if (!formRango.fecha_inicio || !formRango.fecha_fin) {
      mostrarToast("Selecciona fecha inicio y fin", "error");
      return;
    }
    if (formRango.dias_semana.length === 0) {
      mostrarToast("Selecciona al menos un día de la semana", "error");
      return;
    }

    setGuardando(true);
    try {
      const diasMap = {
        lunes: 1,
        martes: 2,
        miercoles: 3,
        jueves: 4,
        viernes: 5,
        sabado: 6,
      };

      const diasNumericos = formRango.dias_semana.map((d) => diasMap[d]);
      const inicio = new Date(formRango.fecha_inicio + "T12:00:00");
      const fin = new Date(formRango.fecha_fin + "T12:00:00");

      let creados = 0;
      for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
        if (diasNumericos.includes(d.getDay())) {
          const fecha = new Date(d).toISOString().split("T")[0];
          const diaNombre = Object.keys(diasMap).find(
            (k) => diasMap[k] === d.getDay(),
          );
          await api.post(`/medicos/${medicoSeleccionado.id}/horarios`, {
            medico_id: medicoSeleccionado.id,
            dia_semana: diaNombre,
            turno: formRango.turno,
            hora_inicio: formRango.hora_inicio,
            hora_fin: formRango.hora_fin,
            fecha: fecha,
          });
          creados++;
        }
      }

      mostrarToast(`${creados} horarios creados correctamente`, "success");
      setModalAbierto(false);
      cargarHorarios(medicoSeleccionado.id);
    } catch (err) {
      mostrarToast("Error al crear horarios", "error");
    } finally {
      setGuardando(false);
    }
  };

  const toggleDiaSemana = (dia) => {
    setFormRango((prev) => ({
      ...prev,
      dias_semana: prev.dias_semana.includes(dia)
        ? prev.dias_semana.filter((d) => d !== dia)
        : [...prev.dias_semana, dia],
    }));
  };

  const mostrarToast = (mensaje, tipo) => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const coloresAvatar = [
    "bg-blue-100 text-blue-700",
    "bg-teal-100 text-teal-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-green-100 text-green-700",
  ];

  const getIniciales = (nombre, apellido) =>
    `${nombre?.charAt(0) || ""}${apellido?.charAt(0) || ""}`.toUpperCase();

  // Calcula cuántos horarios se crearán
  const calcularHorariosARear = () => {
    if (
      !formRango.fecha_inicio ||
      !formRango.fecha_fin ||
      formRango.dias_semana.length === 0
    )
      return 0;
    const diasMap = {
      lunes: 1,
      martes: 2,
      miércoles: 3,
      jueves: 4,
      viernes: 5,
      sábado: 6,
    };
    const diasNumericos = formRango.dias_semana.map((d) => diasMap[d]);
    const inicio = new Date(formRango.fecha_inicio + "T12:00:00");
    const fin = new Date(formRango.fecha_fin + "T12:00:00");
    let count = 0;
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      if (diasNumericos.includes(d.getDay())) count++;
    }
    return count;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg text-white ${
            toast.tipo === "success" ? "bg-green-600" : "bg-red-500"
          }`}
        >
          {toast.mensaje}
        </div>
      )}

      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-900">Horarios</div>
          <div className="text-xs text-gray-400 mt-0.5">
            Gestiona los horarios programados por médico
          </div>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors"
        >
          + Agregar horario
        </button>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Lista médicos */}
        <div className="w-72 border-r border-gray-200 bg-white flex flex-col">
          <div className="px-3 py-3 border-b border-gray-100">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar médico..."
              className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-400 placeholder-gray-400"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {medicos
              .filter((m) =>
                `${m.nombre} ${m.apellido}`
                  .toLowerCase()
                  .includes(busqueda.toLowerCase()),
              )
              .map((m, i) => (
                <div
                  key={m.id}
                  onClick={() => setMedicoSeleccionado(m)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
                    medicoSeleccionado?.id === m.id
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${coloresAvatar[medicos.indexOf(m) % coloresAvatar.length]}`}
                  >
                    {getIniciales(m.nombre, m.apellido)}
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`text-xs font-medium truncate ${medicoSeleccionado?.id === m.id ? "text-blue-700" : "text-gray-800"}`}
                    >
                      {m.nombre} {m.apellido}
                    </div>
                  </div>
                </div>
              ))}
            {busqueda &&
              medicos.filter((m) =>
                `${m.nombre} ${m.apellido}`
                  .toLowerCase()
                  .includes(busqueda.toLowerCase()),
              ).length === 0 && (
                <div className="px-4 py-6 text-xs text-gray-400 text-center">
                  Sin resultados para "{busqueda}"
                </div>
              )}
          </div>
        </div>

        {/* Horarios */}
        <div className="flex-1 p-6 overflow-y-auto">
          {medicoSeleccionado ? (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${coloresAvatar[medicos.findIndex((m) => m.id === medicoSeleccionado.id) % coloresAvatar.length]}`}
                >
                  {getIniciales(
                    medicoSeleccionado.nombre,
                    medicoSeleccionado.apellido,
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {medicoSeleccionado.nombre} {medicoSeleccionado.apellido}
                  </div>
                  <div className="text-xs text-gray-400">
                    {horarios.length} horarios programados
                  </div>
                </div>
              </div>

              {horarios.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm bg-white border border-gray-200 rounded-2xl">
                  Sin horarios registrados
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">
                          Día / Fecha
                        </th>
                        <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">
                          Horario
                        </th>
                        <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">
                          Turno
                        </th>
                        <th className="text-left text-xs text-gray-400 font-medium px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {horarios.map((h, i) => (
                        <tr
                          key={i}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="px-5 py-3 text-xs font-medium text-gray-700 capitalize">
                            {h.fecha
                              ? new Date(
                                  h.fecha + "T12:00:00",
                                ).toLocaleDateString("es-PE", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : h.dia_semana}
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-600">
                            {h.hora_inicio} – {h.hora_fin}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                h.turno === "mañana"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {h.turno === "mañana" ? "Mañana" : "Tarde"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => eliminarHorario(h.id)}
                              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm">
              Selecciona un médico
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="text-sm font-medium text-gray-900 mb-4">
              Agregar horario — {medicoSeleccionado?.nombre}{" "}
              {medicoSeleccionado?.apellido}
            </div>

            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setModo("semana")}
                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                  modo === "semana"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                Por día de semana
              </button>
              <button
                onClick={() => setModo("rango")}
                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                  modo === "rango"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                Por rango de fechas
              </button>
            </div>

            {modo === "semana" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Día de la semana
                  </label>
                  <select
                    value={formIndividual.dia_semana}
                    onChange={(e) =>
                      setFormIndividual({
                        ...formIndividual,
                        dia_semana: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                  >
                    {diasSemana.map((d) => (
                      <option key={d} value={d}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Turno
                  </label>
                  <div className="flex gap-2">
                    {["mañana", "tarde"].map((t) => (
                      <button
                        key={t}
                        onClick={() =>
                          setFormIndividual({ ...formIndividual, turno: t })
                        }
                        className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                          formIndividual.turno === t
                            ? t === "mañana"
                              ? "bg-amber-500 text-white border-amber-500"
                              : "bg-blue-600 text-white border-blue-600"
                            : "border-gray-200 text-gray-600"
                        }`}
                      >
                        {t === "mañana" ? "Mañana" : "Tarde"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Hora inicio
                    </label>
                    <input
                      type="time"
                      value={formIndividual.hora_inicio}
                      onChange={(e) =>
                        setFormIndividual({
                          ...formIndividual,
                          hora_inicio: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Hora fin
                    </label>
                    <input
                      type="time"
                      value={formIndividual.hora_fin}
                      onChange={(e) =>
                        setFormIndividual({
                          ...formIndividual,
                          hora_fin: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {modo === "rango" && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      value={formRango.fecha_inicio}
                      onChange={(e) =>
                        setFormRango({
                          ...formRango,
                          fecha_inicio: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Fecha fin
                    </label>
                    <input
                      type="date"
                      value={formRango.fecha_fin}
                      onChange={(e) =>
                        setFormRango({
                          ...formRango,
                          fecha_fin: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-2">
                    Días de la semana
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {diasSemana.map((dia) => (
                      <button
                        key={dia}
                        onClick={() => toggleDiaSemana(dia)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                          formRango.dias_semana.includes(dia)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {dia.charAt(0).toUpperCase() + dia.slice(1, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Turno
                  </label>
                  <div className="flex gap-2">
                    {["mañana", "tarde"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setFormRango({ ...formRango, turno: t })}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                          formRango.turno === t
                            ? t === "mañana"
                              ? "bg-amber-500 text-white border-amber-500"
                              : "bg-blue-600 text-white border-blue-600"
                            : "border-gray-200 text-gray-600"
                        }`}
                      >
                        {t === "mañana" ? "Mañana" : "Tarde"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Hora inicio
                    </label>
                    <input
                      type="time"
                      value={formRango.hora_inicio}
                      onChange={(e) =>
                        setFormRango({
                          ...formRango,
                          hora_inicio: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Hora fin
                    </label>
                    <input
                      type="time"
                      value={formRango.hora_fin}
                      onChange={(e) =>
                        setFormRango({ ...formRango, hora_fin: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                {calcularHorariosARear() > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                    Se crearán{" "}
                    <strong>{calcularHorariosARear()} horarios</strong> en el
                    rango seleccionado
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setModalAbierto(false)}
                className="flex-1 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={
                  modo === "semana"
                    ? agregarHorarioIndividual
                    : agregarHorarioRango
                }
                disabled={guardando}
                className="flex-1 py-2 text-xs font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                {guardando
                  ? "Guardando..."
                  : modo === "rango"
                    ? `Crear ${calcularHorariosARear()} horarios`
                    : "Agregar horario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Horarios;
