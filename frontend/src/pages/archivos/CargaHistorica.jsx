import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import BuscadorMedico from "../../components/BuscadorMedico";

const CargaHistorica = () => {
  const { usuario } = useAuth();

  const [medicos, setMedicos] = useState([]);
  const [form, setForm] = useState({
    medico_id: "",
    turno: "mañana",
    fecha: "",
    cantidad: 1,
  });

  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState(null);

  // Estado de edición inline
  const [editando, setEditando] = useState(null); // índice de la fila que se edita
  const [editCantidad, setEditCantidad] = useState("");
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  useEffect(() => {
    cargarMedicos();
  }, []);

  const cargarMedicos = async () => {
    try {
      const res = await api.get("/medicos/");
      setMedicos(res.data);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.medico_id || !form.fecha || form.cantidad < 1) return;
    setGuardando(true);

    try {
      await api.post("/atenciones/historico", {
        medico_id: form.medico_id,
        clinica_id: usuario.clinica_id,
        turno: form.turno,
        fecha: form.fecha,
        cantidad: Number(form.cantidad),
      });

      const medico = medicos.find((m) => m.id === form.medico_id);
      setRegistros((prev) => [
        {
          medico: `${medico?.nombre} ${medico?.apellido}`,
          medico_id: form.medico_id,
          clinica_id: usuario.clinica_id,
          turno: form.turno,
          fecha: form.fecha,
          cantidad: Number(form.cantidad),
        },
        ...prev,
      ]);

      mostrarToast(`${form.cantidad} atenciones registradas correctamente`, "success");
      setForm((prev) => ({ ...prev, cantidad: 1 }));
    } catch (err) {
      mostrarToast("Error al registrar", "error");
    } finally {
      setGuardando(false);
    }
  };

  const iniciarEdicion = (index) => {
    setEditando(index);
    setEditCantidad(String(registros[index].cantidad));
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setEditCantidad("");
  };

  const guardarEdicion = async (index) => {
    const nueva = parseInt(editCantidad);
    if (!nueva || nueva < 1 || nueva > 200) {
      mostrarToast("Cantidad inválida (1-200)", "error");
      return;
    }
    const r = registros[index];
    setGuardandoEdit(true);
    try {
      await api.patch("/atenciones/historico", {
        medico_id: r.medico_id,
        clinica_id: r.clinica_id,
        turno: r.turno,
        fecha: r.fecha,
        nueva_cantidad: nueva,
      });
      setRegistros((prev) =>
        prev.map((reg, i) => (i === index ? { ...reg, cantidad: nueva } : reg))
      );
      setEditando(null);
      mostrarToast("Atenciones actualizadas correctamente", "success");
    } catch (err) {
      mostrarToast("Error al actualizar", "error");
    } finally {
      setGuardandoEdit(false);
    }
  };

  const mostrarToast = (mensaje, tipo) => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  const totalRegistrado = registros.reduce((sum, r) => sum + Number(r.cantidad), 0);

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
            <h1 className="text-lg font-medium text-gray-900">
              Carga histórica de atenciones
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Registra atenciones de meses anteriores con fecha y turno manual
            </p>
          </div>
          {registros.length > 0 && (
            <div className="bg-blue-600 text-white text-xs px-4 py-2 rounded-xl font-medium">
              {totalRegistrado} atenciones cargadas esta sesión
            </div>
          )}
        </div>
      </div>

      <div className="px-8 py-6 flex gap-6">
        {/* Formulario */}
        <div className="w-96 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-sm font-medium text-gray-900 mb-4">
              Registrar atenciones históricas
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Médico */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Médico <span className="text-red-500">*</span>
                </label>
                <BuscadorMedico
                  medicos={medicos}
                  value={form.medico_id}
                  onChange={(m) => setForm({ ...form, medico_id: m?.id || "" })}
                  placeholder="Buscar médico..."
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Fecha <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                />
              </div>

              {/* Turno */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Turno</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, turno: "mañana" })}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                      form.turno === "mañana"
                        ? "bg-amber-500 text-white border-amber-500"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Mañana
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, turno: "tarde" })}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                      form.turno === "tarde"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Tarde
                  </button>
                </div>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Cantidad de atenciones <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={form.cantidad}
                  onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                />
                <div className="text-xs text-gray-400 mt-1">
                  Se crearán {form.cantidad} registros con esta fecha y turno
                </div>
              </div>

              <button
                type="submit"
                disabled={guardando || !form.medico_id || !form.fecha}
                className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {guardando ? "Registrando..." : `Registrar ${form.cantidad} atenciones`}
              </button>
            </form>
          </div>

          {/* Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-4">
            <div className="text-xs font-medium text-amber-700 mb-1">
              ¿Cómo usar esta pantalla?
            </div>
            <div className="text-xs text-amber-600 space-y-1">
              <div>1. Selecciona el médico del papel</div>
              <div>2. Ingresa la fecha del registro</div>
              <div>3. Selecciona el turno (M o T)</div>
              <div>4. Ingresa la cantidad de atenciones</div>
              <div>5. Usa el lápiz para corregir la cantidad</div>
            </div>
          </div>
        </div>

        {/* Historial de la sesión */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="text-sm font-medium text-gray-900">
                Registros de esta sesión
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Usa el botón de editar para corregir la cantidad de atenciones
              </div>
            </div>

            {registros.length === 0 ? (
              <div className="text-center py-16 text-xs text-gray-400">
                Aún no has registrado atenciones en esta sesión
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Médico</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Fecha</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Turno</th>
                    <th className="text-right text-xs text-gray-400 font-medium px-5 py-3">Atenciones</th>
                    <th className="text-right text-xs text-gray-400 font-medium px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3 text-xs font-medium text-gray-800">
                        {r.medico}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600">{r.fecha}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            r.turno === "mañana"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {r.turno === "mañana" ? "Mañana" : "Tarde"}
                        </span>
                      </td>

                      {/* Cantidad — editable inline */}
                      <td className="px-5 py-3 text-right">
                        {editando === i ? (
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={editCantidad}
                            onChange={(e) => setEditCantidad(e.target.value)}
                            autoFocus
                            className="w-20 px-2 py-1 text-xs border border-blue-400 rounded-lg outline-none text-right"
                          />
                        ) : (
                          <span className="text-xs font-medium text-gray-900">
                            {r.cantidad}
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-3 text-right">
                        {editando === i ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => guardarEdicion(i)}
                              disabled={guardandoEdit}
                              className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {guardandoEdit ? "..." : "Guardar"}
                            </button>
                            <button
                              onClick={cancelarEdicion}
                              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg border border-gray-200 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => iniciarEdicion(i)}
                            className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                            title="Editar cantidad"
                          >
                            ✎
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Total */}
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td colSpan={3} className="px-5 py-3 text-xs font-medium text-gray-700">
                      Total cargado esta sesión
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-blue-600 text-right">
                      {totalRegistrado}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CargaHistorica;
