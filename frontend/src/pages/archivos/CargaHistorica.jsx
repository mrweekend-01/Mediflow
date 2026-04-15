import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import BuscadorMedico from "../../components/BuscadorMedico";

const LS_KEY = "carga_historica_sesion";

const hoy = () => new Date().toISOString().slice(0, 10);

const cargarDesdeLS = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (data.fecha !== hoy()) {
      localStorage.removeItem(LS_KEY);
      return [];
    }
    return data.registros || [];
  } catch {
    return [];
  }
};

const guardarEnLS = (registros) => {
  localStorage.setItem(LS_KEY, JSON.stringify({ fecha: hoy(), registros }));
};

const CargaHistorica = () => {
  const { usuario } = useAuth();

  const [medicos, setMedicos] = useState([]);
  const [form, setForm] = useState({
    medico_id: "",
    turno: "mañana",
    fecha: "",
    cantidad: 1,
  });

  const [registros, setRegistros] = useState(() => cargarDesdeLS());
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal editar
  const [modalEditar, setModalEditar] = useState(null); // índice del registro
  const [editForm, setEditForm] = useState({ cantidad: "", fecha: "" });
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  useEffect(() => {
    cargarMedicos();
  }, []);

  // Sincroniza localStorage cada vez que cambian los registros
  useEffect(() => {
    guardarEnLS(registros);
  }, [registros]);

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
      const res = await api.post("/atenciones/historico", {
        medico_id: form.medico_id,
        clinica_id: usuario.clinica_id,
        turno: form.turno,
        fecha: form.fecha,
        cantidad: Number(form.cantidad),
      });

      // Captura los IDs de los registros creados para poder editarlos/eliminarlos
      const ids = Array.isArray(res.data)
        ? res.data.map((r) => r.id)
        : res.data?.ids || [];

      const medico = medicos.find((m) => m.id === form.medico_id);
      const nuevoRegistro = {
        medico: `${medico?.nombre} ${medico?.apellido}`,
        medico_id: form.medico_id,
        clinica_id: usuario.clinica_id,
        turno: form.turno,
        fecha: form.fecha,
        cantidad: Number(form.cantidad),
        ids,
      };

      setRegistros((prev) => [nuevoRegistro, ...prev]);
      mostrarToast(`${form.cantidad} atenciones registradas correctamente`, "success");
      setForm((prev) => ({ ...prev, cantidad: 1 }));
    } catch (err) {
      mostrarToast("Error al registrar", "error");
    } finally {
      setGuardando(false);
    }
  };

  const abrirEdicion = (index) => {
    setModalEditar(index);
    setEditForm({
      cantidad: String(registros[index].cantidad),
      fecha: registros[index].fecha,
    });
  };

  const guardarEdicion = async () => {
    const nueva = parseInt(editForm.cantidad);
    if (!nueva || nueva < 1 || nueva > 200) {
      mostrarToast("Cantidad inválida (1-200)", "error");
      return;
    }
    if (!editForm.fecha) {
      mostrarToast("Selecciona una fecha", "error");
      return;
    }
    const r = registros[modalEditar];
    setGuardandoEdit(true);
    try {
      // Eliminar todos los registros individuales del lote
      await Promise.all(r.ids.map((id) => api.delete(`/atenciones/${id}`)));

      // Recrear con los nuevos valores
      const res = await api.post("/atenciones/historico", {
        medico_id: r.medico_id,
        clinica_id: r.clinica_id,
        turno: r.turno,
        fecha: editForm.fecha,
        cantidad: nueva,
      });

      const newIds = Array.isArray(res.data)
        ? res.data.map((x) => x.id)
        : res.data?.ids || [];

      setRegistros((prev) =>
        prev.map((reg, i) =>
          i === modalEditar
            ? { ...reg, cantidad: nueva, fecha: editForm.fecha, ids: newIds }
            : reg,
        ),
      );
      setModalEditar(null);
      mostrarToast("Registro actualizado correctamente", "success");
    } catch (err) {
      mostrarToast("Error al actualizar", "error");
    } finally {
      setGuardandoEdit(false);
    }
  };

  const eliminarRegistro = async (index) => {
    if (!confirm("¿Eliminar este lote de atenciones?")) return;
    const r = registros[index];
    try {
      await Promise.all(r.ids.map((id) => api.delete(`/atenciones/${id}`)));
      setRegistros((prev) => prev.filter((_, i) => i !== index));
      mostrarToast("Registro eliminado", "success");
    } catch (err) {
      mostrarToast("Error al eliminar", "error");
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

      {/* Modal editar */}
      {modalEditar !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="text-sm font-medium text-gray-900 mb-1">
              Editar registro
            </div>
            <div className="text-xs text-gray-400 mb-4">
              {registros[modalEditar]?.medico} —{" "}
              {registros[modalEditar]?.turno === "mañana" ? "Mañana" : "Tarde"}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={editForm.fecha}
                  onChange={(e) =>
                    setEditForm({ ...editForm, fecha: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Cantidad de atenciones
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  autoFocus
                  value={editForm.cantidad}
                  onChange={(e) =>
                    setEditForm({ ...editForm, cantidad: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                />
                <div className="text-xs text-gray-400 mt-1">
                  Se eliminarán los {registros[modalEditar]?.cantidad} registros
                  actuales y se crearán {editForm.cantidad || "?"} nuevos
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setModalEditar(null)}
                className="flex-1 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                disabled={guardandoEdit}
                className="flex-1 py-2 text-xs font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                {guardandoEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
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
              {totalRegistrado} atenciones cargadas hoy
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
                <label className="block text-xs text-gray-500 mb-1">
                  Turno
                </label>
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
                  onChange={(e) =>
                    setForm({ ...form, cantidad: e.target.value })
                  }
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
                {guardando
                  ? "Registrando..."
                  : `Registrar ${form.cantidad} atenciones`}
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
              <div>5. Usa ✏ para editar fecha o cantidad</div>
              <div>6. Los registros se guardan aunque recargues la página</div>
            </div>
          </div>
        </div>

        {/* Historial de la sesión */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="text-sm font-medium text-gray-900">
                Registros de hoy
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Se guardan automáticamente y persisten al recargar la página
              </div>
            </div>

            {registros.length === 0 ? (
              <div className="text-center py-16 text-xs text-gray-400">
                Aún no has registrado atenciones hoy
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">
                      Médico
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">
                      Fecha
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">
                      Turno
                    </th>
                    <th className="text-right text-xs text-gray-400 font-medium px-5 py-3">
                      Atenciones
                    </th>
                    <th className="text-right text-xs text-gray-400 font-medium px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3 text-xs font-medium text-gray-800">
                        {r.medico}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600">
                        {r.fecha}
                      </td>
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
                      <td className="px-5 py-3 text-right">
                        <span className="text-xs font-medium text-gray-900">
                          {r.cantidad}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirEdicion(i)}
                            className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                            title="Editar fecha y cantidad"
                          >
                            ✏
                          </button>
                          <button
                            onClick={() => eliminarRegistro(i)}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            title="Eliminar lote"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Total */}
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td
                      colSpan={3}
                      className="px-5 py-3 text-xs font-medium text-gray-700"
                    >
                      Total cargado hoy
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
