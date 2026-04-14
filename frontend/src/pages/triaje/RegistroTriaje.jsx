import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getTurnoActual, getFechaLima } from "../../utils/helpers";
import BuscadorMedico from "../../components/BuscadorMedico";

const RegistroTriaje = () => {
  const { usuario } = useAuth();

  const [medicos, setMedicos] = useState([]);
  const [form, setForm] = useState({
    medico_id: "",
    especialidad_id: "",
    hcl: "",
    boleta: "",
    paciente_nombre: "",
    paciente_edad: "",
    paciente_dni: "",
    seguro: "",
    campana: "",
  });

  const [registrosHoy, setRegistrosHoy] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState(null);

  // Turno y fecha en Lima — se envían al backend
  const turnoActual = getTurnoActual();
  const fechaLima = getFechaLima();

  // Fecha de hoy formateada para mostrar
  const hoy = new Date().toLocaleDateString("es-PE", {
    timeZone: "America/Lima",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resMedicos, resHoy] = await Promise.all([
        api.get("/medicos/"),
        api.get("/triaje/hoy"),
      ]);
      setMedicos(resMedicos.data);
      setRegistrosHoy(resHoy.data.data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  // Al seleccionar médico rellena especialidad automáticamente
  const handleMedicoChange = (medico) => {
    setForm((prev) => ({
      ...prev,
      medico_id: medico?.id || "",
      especialidad_id: medico?.especialidad_id || "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.medico_id) return;
    setGuardando(true);

    try {
      await api.post("/triaje/", {
        medico_id: form.medico_id,
        especialidad_id: form.especialidad_id || null,
        hcl: form.hcl || null,
        boleta: form.boleta || null,
        paciente_nombre: form.paciente_nombre || null,
        paciente_edad: form.paciente_edad || null,
        paciente_dni: form.paciente_dni || null,
        seguro: form.seguro || null,
        campana: form.campana || null,
        turno: turnoActual,
        fecha: fechaLima,
      });

      // Limpia el formulario manteniendo solo el médico
      setForm((prev) => ({
        ...prev,
        hcl: "",
        boleta: "",
        paciente_nombre: "",
        paciente_edad: "",
        paciente_dni: "",
        seguro: "",
        campana: "",
      }));

      mostrarToast("Paciente registrado correctamente", "success");
      cargarDatos();
    } catch (err) {
      mostrarToast("Error al registrar", "error");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarRegistro = async (id) => {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      await api.delete(`/triaje/${id}`);
      mostrarToast("Registro eliminado", "success");
      cargarDatos();
    } catch (err) {
      mostrarToast("Error al eliminar", "error");
    }
  };

  const mostrarToast = (mensaje, tipo) => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg text-white ${
            toast.tipo === "success" ? "bg-green-600" : "bg-red-500"
          }`}
        >
          {toast.mensaje}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-gray-900 capitalize">
              Registro de triaje
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">{hoy}</p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                turnoActual === "mañana"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              Turno: {turnoActual === "mañana" ? "Mañana" : "Tarde"}
            </div>
            <div className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-medium">
              {registrosHoy.length} pacientes hoy
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 flex gap-6">
        {/* Formulario */}
        <div className="w-96 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-sm font-medium text-gray-900 mb-4">
              Nuevo paciente
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Médico — buscador en tiempo real */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Médico <span className="text-red-500">*</span>
                </label>
                <BuscadorMedico
                  medicos={medicos}
                  value={form.medico_id}
                  onChange={handleMedicoChange}
                  placeholder="Buscar médico..."
                />
              </div>

              {/* N° HCL */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  N° HCL
                </label>
                <input
                  type="text"
                  value={form.hcl}
                  onChange={(e) => setForm({ ...form, hcl: e.target.value })}
                  placeholder="Ej: 249482"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                />
              </div>

              {/* N° Boleta */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  N° Boleta
                </label>
                <input
                  type="text"
                  value={form.boleta}
                  onChange={(e) => setForm({ ...form, boleta: e.target.value })}
                  placeholder="Ej: BT05-63016"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                />
              </div>

              {/* Apellidos y Nombres */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Apellidos y Nombres
                </label>
                <input
                  type="text"
                  value={form.paciente_nombre}
                  onChange={(e) =>
                    setForm({ ...form, paciente_nombre: e.target.value })
                  }
                  placeholder="Ej: GARCIA LOPEZ JUAN"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                />
              </div>

              {/* Edad y DNI en fila */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    Edad
                  </label>
                  <input
                    type="text"
                    value={form.paciente_edad}
                    onChange={(e) =>
                      setForm({ ...form, paciente_edad: e.target.value })
                    }
                    placeholder="Ej: 45"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    DNI
                  </label>
                  <input
                    type="text"
                    value={form.paciente_dni}
                    onChange={(e) =>
                      setForm({ ...form, paciente_dni: e.target.value })
                    }
                    placeholder="Ej: 12345678"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Seguro */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Seguro
                </label>
                <input
                  type="text"
                  value={form.seguro}
                  onChange={(e) => setForm({ ...form, seguro: e.target.value })}
                  placeholder="Ej: PACIFICO, SIS, etc."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                />
              </div>

              {/* Campaña */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Campaña
                </label>
                <input
                  type="text"
                  value={form.campana}
                  onChange={(e) =>
                    setForm({ ...form, campana: e.target.value })
                  }
                  placeholder="Ej: Campaña Adulto Mayor"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                />
              </div>

              {/* Botón registrar */}
              <button
                type="submit"
                disabled={guardando || !form.medico_id}
                className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2"
              >
                {guardando ? "Registrando..." : "+ Registrar paciente"}
              </button>
            </form>
          </div>
        </div>

        {/* Tabla de registros del día */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900">
                Registros de hoy
              </div>
              <button
                onClick={cargarDatos}
                className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                Actualizar
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-2.5">
                      N°
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-2.5">
                      HCL
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-2.5">
                      Boleta
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-2.5">
                      Paciente
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-2.5">
                      Edad
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-2.5">
                      DNI
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-2.5">
                      Especialidad
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-2.5">
                      Médico
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-2.5">
                      Seguro
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-2.5">
                      Campaña
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-2.5">
                      Turno
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="text-center py-8 text-xs text-gray-400"
                      >
                        Cargando...
                      </td>
                    </tr>
                  ) : registrosHoy.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="text-center py-8 text-xs text-gray-400"
                      >
                        No hay registros hoy
                      </td>
                    </tr>
                  ) : (
                    registrosHoy.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-xs font-medium text-gray-700">
                          {r.numero_orden}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">
                          {r.hcl || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">
                          {r.boleta || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-medium text-gray-800">
                          {r.paciente_nombre || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">
                          {r.paciente_edad || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">
                          {r.paciente_dni || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">
                          {r.especialidad_nombre || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">
                          {r.medico_nombre} {r.medico_apellido}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">
                          {r.seguro || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">
                          {r.campana || "—"}
                        </td>
                        <td className="px-4 py-2.5">
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
                        <td className="px-4 py-2.5">
                          <button
                            onClick={() => eliminarRegistro(r.id)}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroTriaje;
