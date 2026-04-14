import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

const POR_PAGINA = 50;

const formatFecha = (isoString) => {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const Auditoria = () => {
  const [registros, setRegistros] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const hoy = new Date().toISOString().slice(0, 10);
  const haceTreintaDias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [fechaDesde, setFechaDesde] = useState(haceTreintaDias);
  const [fechaHasta, setFechaHasta] = useState(hoy);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        pagina,
        por_pagina: POR_PAGINA,
      });
      if (fechaDesde) params.append("fecha_desde", fechaDesde);
      if (fechaHasta) params.append("fecha_hasta", fechaHasta);

      const res = await api.get(`/auditoria/?${params}`);
      setRegistros(res.data.registros || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError("No se pudo cargar la auditoría.");
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, [pagina, fechaDesde, fechaHasta]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Al cambiar filtros de fecha volvemos a página 1
  const handleFechaDesde = (v) => {
    setFechaDesde(v);
    setPagina(1);
  };
  const handleFechaHasta = (v) => {
    setFechaHasta(v);
    setPagina(1);
  };

  const badgeAccion = (accion) => {
    if (accion === "LOGIN")
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 font-medium">
          LOGIN
        </span>
      );
    if (accion.startsWith("DELETE"))
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 font-medium">
          {accion}
        </span>
      );
    if (accion.startsWith("POST"))
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 font-medium">
          {accion}
        </span>
      );
    if (accion.startsWith("PUT"))
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 font-medium">
          {accion}
        </span>
      );
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
        {accion}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-sm font-medium text-gray-900 mr-auto">
            Auditoría de accesos
          </div>

          {/* Filtros de fecha */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => handleFechaDesde(e.target.value)}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => handleFechaHasta(e.target.value)}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-400 bg-white"
            />
          </div>

          <button
            onClick={() => { setPagina(1); cargarDatos(); }}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Buscar
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Métrica total */}
        <div className="grid grid-cols-1 gap-4 mb-6 max-w-xs">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-400 mb-1">Total registros</div>
            <div className="text-3xl font-medium text-gray-900">{total}</div>
            <div className="text-xs text-gray-400 mt-1">en el período</div>
          </div>
        </div>

        {/* Tabla */}
        {error ? (
          <div className="text-center py-16 text-red-500 text-sm bg-white border border-gray-200 rounded-2xl">
            {error}
          </div>
        ) : cargando ? (
          <div className="flex items-center justify-center h-40 bg-white border border-gray-200 rounded-2xl">
            <div className="text-sm text-gray-400">Cargando...</div>
          </div>
        ) : registros.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm bg-white border border-gray-200 rounded-2xl">
            No hay registros en el período seleccionado
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 font-medium px-5 py-3 whitespace-nowrap">
                      Fecha
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">
                      Usuario
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">
                      Email
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">
                      Acción
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-5 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                        {formatFecha(r.fecha)}
                      </td>
                      <td className="px-5 py-2.5 text-xs font-medium text-gray-800">
                        {r.usuario_nombre || "—"}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-gray-600">
                        {r.usuario_email || "—"}
                      </td>
                      <td className="px-5 py-2.5">
                        {badgeAccion(r.accion)}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-gray-500 font-mono">
                        {r.ip || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
              <div className="text-xs text-gray-400">
                Página {pagina} de {totalPaginas} · {total} registros
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auditoria;
