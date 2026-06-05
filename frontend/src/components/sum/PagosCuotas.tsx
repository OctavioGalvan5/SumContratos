// @ts-nocheck
import { useState, useEffect } from 'react';
import { Search, DollarSign, Upload, FileText, Trash2, X, ShieldAlert, Plus, RefreshCw, Eye } from 'lucide-react';
import axios from 'axios';

export default function PagosCuotas() {
  const [cuotas, setCuotas] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [alumnoFilter, setAlumnoFilter] = useState('');
  const [cursoFilter, setCursoFilter] = useState('');
  const [mesFilter, setMesFilter] = useState(new Date().toISOString().slice(0, 7)); // Default current month YYYY-MM
  const [estadoFilter, setEstadoFilter] = useState('all');

  // Registrar Pago modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedCuota, setSelectedCuota] = useState(null);
  const [montoPagado, setMontoPagado] = useState(0);
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().slice(0, 10));
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [file, setFile] = useState(null);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [generating, setGenerating] = useState(false);

  const fetchCuotas = async () => {
    try {
      setLoading(true);
      let url = '/api/cuotas/';
      const params = [];
      if (alumnoFilter) params.push(`alumno_id=${alumnoFilter}`);
      if (cursoFilter) params.push(`curso_id=${cursoFilter}`);
      if (mesFilter) params.push(`mes_anio=${mesFilter}`);
      if (estadoFilter && estadoFilter !== 'all') params.push(`estado=${estadoFilter}`);

      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      const res = await axios.get(url);
      setCuotas(res.data);
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al cargar la lista de cuotas.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlumnosCursos = async () => {
    try {
      // Cargar alumnos activos
      const resAlu = await axios.get('/api/personas/?es_alumno=true&activo=true');
      setAlumnos(resAlu.data);
      // Cargar cursos
      const resCur = await axios.get('/api/cursos/?activo=true');
      setCursos(resCur.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCuotas();
  }, [alumnoFilter, cursoFilter, mesFilter, estadoFilter]);

  useEffect(() => {
    fetchAlumnosCursos();
  }, []);

  const handleGenerarCuotas = async () => {
    if (!confirm('¿Desea generar las cuotas del mes para todos los alumnos inscriptos ACTIVOS que son particulares?')) return;
    try {
      setGenerating(true);
      setErrorMsg('');
      setSuccessMsg('');
      const res = await axios.post('/api/cuotas/generar');
      setSuccessMsg(res.data.message);
      fetchCuotas();
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al generar las cuotas mensuales.');
    } finally {
      setGenerating(false);
    }
  };

  const openPagoModal = (cuota) => {
    setSelectedCuota(cuota);
    setMontoPagado(parseFloat(cuota.monto_esperado) - parseFloat(cuota.monto_pagado)); // Pre-llenar con el saldo restante
    setFechaPago(new Date().toISOString().slice(0, 10));
    setMetodoPago('Efectivo');
    setFile(null);
    setShowModal(true);
  };

  const closePagoModal = () => {
    setSelectedCuota(null);
    setMontoPagado(0);
    setFile(null);
    setShowModal(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleRegistrarPago = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (montoPagado <= 0) {
      setErrorMsg('El monto pagado debe ser mayor a cero.');
      return;
    }

    const formDataObj = new FormData();
    formDataObj.append('monto_pagado', montoPagado);
    formDataObj.append('fecha_pago', fechaPago);
    formDataObj.append('metodo_pago', metodoPago);
    if (file) {
      formDataObj.append('file', file);
    }

    try {
      await axios.put(`/api/cuotas/${selectedCuota.id}/pago`, formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMsg('Pago registrado correctamente.');
      closePagoModal();
      fetchCuotas();
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al registrar el pago de la cuota.');
    }
  };

  const handleVerComprobante = async (cuotaId) => {
    try {
      const res = await axios.get(`/api/cuotas/${cuotaId}/archivo`);
      window.open(res.data.url, '_blank');
    } catch (e) {
      console.error(e);
      alert('Error al intentar abrir el comprobante de pago.');
    }
  };

  const handleEliminarComprobante = async (cuotaId) => {
    if (!confirm('¿Está seguro de que desea eliminar el comprobante digital subido?')) return;
    try {
      await axios.delete(`/api/cuotas/${cuotaId}/comprobante`);
      setSuccessMsg('Comprobante eliminado.');
      fetchCuotas();
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al eliminar el comprobante.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-teal">Pagos y Control de Cuotas</h1>
          <p className="text-sm text-slate-500">Registrá los pagos mensuales de alumnos particulares y subí comprobantes.</p>
        </div>
        <button
          onClick={handleGenerarCuotas}
          disabled={generating}
          className="btn bg-brand-teal text-white hover:bg-brand-teal-mid flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-97 cursor-pointer disabled:opacity-50"
        >
          {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Generar Cuotas del Mes
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            {errorMsg}
          </span>
          <button onClick={() => setErrorMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Listado con filtros */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden animate-card-fade">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alumno</label>
            <select
              value={alumnoFilter}
              onChange={(e) => setAlumnoFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none cursor-pointer focus:border-brand-teal"
            >
              <option value="">Todos los Alumnos</option>
              {alumnos.map(a => (
                <option key={a.id} value={a.id}>{a.apellido}, {a.nombre} (DNI {a.dni})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 w-56">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Curso</label>
            <select
              value={cursoFilter}
              onChange={(e) => setCursoFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none cursor-pointer focus:border-brand-teal"
            >
              <option value="">Todos los Cursos</option>
              {cursos.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 w-40">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mes y Año</label>
            <input
              type="month"
              value={mesFilter}
              onChange={(e) => setMesFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 text-sm outline-none focus:border-brand-teal cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1 w-44">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado de Pago</label>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none cursor-pointer focus:border-brand-teal"
            >
              <option value="all">Todos los Estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Parcial">Pago Parcial</option>
              <option value="Pagado">Pagado</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">Cargando cuotas...</div>
        ) : cuotas.length === 0 ? (
          <div className="p-12 text-center text-slate-400 italic">No se encontraron cuotas con los filtros seleccionados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white text-xs font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Alumno</th>
                  <th className="px-5 py-3 text-left">Curso</th>
                  <th className="px-5 py-3 text-left">Mes</th>
                  <th className="px-5 py-3 text-right">Monto Esperado</th>
                  <th className="px-5 py-3 text-right">Monto Pagado</th>
                  <th className="px-5 py-3 text-left">Estado</th>
                  <th className="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cuotas.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">
                      {c.alumno?.apellido}, {c.alumno?.nombre}
                      <span className="text-xs text-slate-400 block font-normal font-mono">{c.alumno?.dni}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 font-medium">
                      {c.curso_nombre || 'Curso Eliminado'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 font-semibold font-mono">
                      {c.mes_anio}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-right font-semibold text-slate-700">
                      ${parseFloat(c.monto_esperado).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-right font-semibold text-brand-teal-mid">
                      ${parseFloat(c.monto_pagado).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      {c.estado === 'Pendiente' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-750 border border-red-150">
                          Pendiente
                        </span>
                      )}
                      {c.estado === 'Parcial' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Pago Parcial
                        </span>
                      )}
                      {c.estado === 'Pagado' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                          Pagado
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {c.estado !== 'Pagado' && (
                          <button
                            onClick={() => openPagoModal(c)}
                            className="btn btn-sm bg-brand-teal text-white hover:bg-brand-teal-mid flex items-center gap-1 py-1 px-2.5 rounded text-xs cursor-pointer font-medium"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            Cobrar
                          </button>
                        )}
                        {c.comprobante_path ? (
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => handleVerComprobante(c.id)}
                              className="p-1 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded transition-all cursor-pointer"
                              title="Ver Comprobante"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEliminarComprobante(c.id)}
                              className="p-1 bg-red-50 border border-red-200 hover:bg-red-150 text-red-700 rounded transition-all cursor-pointer"
                              title="Eliminar Comprobante"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          c.estado === 'Pagado' && (
                            <span className="text-[10px] text-slate-400 italic">Sin comprobante</span>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL REGISTRAR COBRO --- */}
      {showModal && selectedCuota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-card-fade">
            <div className="bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white font-semibold text-xs tracking-wider uppercase px-5 py-4 flex items-center justify-between">
              <span>Registrar Cobro</span>
              <button onClick={closePagoModal} className="text-white hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleRegistrarPago} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-650 space-y-1">
                <div>Alumno: <strong>{selectedCuota.alumno?.apellido}, {selectedCuota.alumno?.nombre}</strong></div>
                <div>Curso: <strong>{selectedCuota.curso_nombre}</strong></div>
                <div>Mes de Cursada: <strong>{selectedCuota.mes_anio}</strong></div>
                <div className="border-t border-slate-200 pt-1.5 mt-1.5 flex justify-between font-semibold text-slate-800">
                  <span>Monto de la Cuota:</span>
                  <span>${parseFloat(selectedCuota.monto_esperado).toLocaleString()}</span>
                </div>
                {parseFloat(selectedCuota.monto_pagado) > 0 && (
                  <div className="flex justify-between font-semibold text-brand-teal-mid">
                    <span>Monto Ya Pagado anteriormente:</span>
                    <span>${parseFloat(selectedCuota.monto_pagado).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto a Cobrar ($)</label>
                <input
                  type="number"
                  value={montoPagado}
                  onChange={(e) => setMontoPagado(parseFloat(e.target.value))}
                  min="0.01"
                  step="0.01"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white outline-none font-bold"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha del Pago</label>
                <input
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white outline-none cursor-pointer"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Método de Pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white outline-none cursor-pointer"
                  required
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia bancaria / Billetera digital</option>
                  <option value="Otro">Otro medio de pago</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Comprobante de Pago (Opcional - Imagen o PDF)</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  className="text-xs text-slate-500 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-teal-dim file:text-brand-teal hover:file:bg-brand-teal/10"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={closePagoModal}
                  className="btn border border-slate-200 text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn bg-brand-teal text-white hover:bg-brand-teal-mid px-5 py-2 rounded-lg text-sm font-medium shadow-sm transition-all cursor-pointer"
                >
                  Registrar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
