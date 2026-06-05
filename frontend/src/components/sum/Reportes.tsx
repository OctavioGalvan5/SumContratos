// @ts-nocheck
import { useState, useEffect } from 'react';
import { BarChart3, Users, DollarSign, ClipboardCheck, Calculator, CheckCircle, ShieldAlert, X, Printer, TrendingUp, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export default function Reportes() {
  const [activeTab, setActiveTab] = useState('liquidaciones'); // 'liquidaciones', 'deudores', 'asistencia', 'ingresos'

  // Global selection states
  const [mesAnio, setMesAnio] = useState(new Date().toISOString().slice(0, 7));
  const [cursos, setCursos] = useState([]);
  const [selectedCursoId, setSelectedCursoId] = useState('');

  // Report data states
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [deudores, setDeudores] = useState([]);
  const [asistenciaCurso, setAsistenciaCurso] = useState(null);
  const [ingresosData, setIngresosData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchCursos = async () => {
    try {
      const res = await axios.get('/api/cursos/?activo=true');
      setCursos(res.data);
      if (res.data.length > 0) {
        setSelectedCursoId(res.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCursos();
  }, []);

  // Fetch data depending on active tab
  useEffect(() => {
    if (activeTab === 'liquidaciones') {
      fetchLiquidaciones();
    } else if (activeTab === 'deudores') {
      fetchDeudores();
    } else if (activeTab === 'asistencia') {
      fetchAsistencia();
    } else if (activeTab === 'ingresos') {
      fetchIngresos();
    }
  }, [activeTab, mesAnio, selectedCursoId]);

  const fetchLiquidaciones = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/liquidaciones/?mes_anio=${mesAnio}`);
      setLiquidaciones(res.data);
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al cargar las liquidaciones.');
    } finally {
      setLoading(false);
    }
  };

  const handleCalcularLiquidaciones = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const res = await axios.post(`/api/liquidaciones/calcular?mes_anio=${mesAnio}`);
      setSuccessMsg(res.data.message);
      fetchLiquidaciones();
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al calcular las liquidaciones de este mes.');
    } finally {
      setLoading(false);
    }
  };

  const handlePagarLiquidacion = async (id) => {
    if (!confirm('¿Desea marcar esta liquidación como PAGADA al profesor?')) return;
    try {
      await axios.put(`/api/liquidaciones/${id}/pagar`);
      setSuccessMsg('Liquidación pagada correctamente.');
      fetchLiquidaciones();
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al actualizar el estado de la liquidación.');
    }
  };

  const fetchDeudores = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/reportes/deudores');
      setDeudores(res.data);
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al cargar el reporte de deudores.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAsistencia = async () => {
    if (!selectedCursoId) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/reportes/asistencia/curso/${selectedCursoId}`);
      setAsistenciaCurso(res.data);
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al cargar el reporte de asistencia.');
    } finally {
      setLoading(false);
    }
  };

  const fetchIngresos = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/reportes/ingresos');
      setIngresosData(res.data);
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al cargar el reporte de ingresos.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-brand-teal">Informes y Reportes de Gestión</h1>
          <p className="text-sm text-slate-500">Analizá la asistencia de alumnos, controlá deudas e ingresos, y liquidá a profesores.</p>
        </div>
        <button
          onClick={handlePrint}
          className="btn border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-97 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Imprimir Reporte
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm flex items-center justify-between print:hidden">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex items-center justify-between print:hidden">
          <span className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            {errorMsg}
          </span>
          <button onClick={() => setErrorMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* --- Navegación de Pestañas (Tabs) --- */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto print:hidden">
        <button
          onClick={() => setActiveTab('liquidaciones')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'liquidaciones' ? 'border-brand-teal text-brand-teal' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Liquidación Profesores
        </button>

        <button
          onClick={() => setActiveTab('deudores')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'deudores' ? 'border-brand-teal text-brand-teal' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Deudores / Morosos
        </button>

        <button
          onClick={() => setActiveTab('asistencia')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'asistencia' ? 'border-brand-teal text-brand-teal' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          Asistencia por Curso
        </button>

        <button
          onClick={() => setActiveTab('ingresos')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'ingresos' ? 'border-brand-teal text-brand-teal' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Estadísticas de Ingresos
        </button>
      </div>

      {/* --- CONTENIDO DE PESTAÑAS --- */}
      {loading && <div className="p-12 text-center text-slate-500 font-medium">Cargando reporte...</div>}

      {!loading && (
        <div className="animate-card-fade">
          {/* PESTAÑA 1: LIQUIDACIONES DE PROFESORES */}
          {activeTab === 'liquidaciones' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Período Mensual</span>
                    <input
                      type="month"
                      value={mesAnio}
                      onChange={(e) => setMesAnio(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 text-sm outline-none focus:border-brand-teal cursor-pointer"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleCalcularLiquidaciones}
                  className="btn bg-brand-teal text-white hover:bg-brand-teal-mid flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all cursor-pointer"
                >
                  <Calculator className="w-4 h-4" />
                  Calcular/Actualizar Liquidaciones
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white font-semibold text-xs tracking-wider uppercase px-5 py-3.5 flex justify-between">
                  <span>Liquidaciones - Mes {mesAnio}</span>
                </div>
                {liquidaciones.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 italic">No hay liquidaciones generadas para este período. Presione "Calcular" para procesar.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                          <th className="px-5 py-3 text-left">Profesor</th>
                          <th className="px-5 py-3 text-left">Curso</th>
                          <th className="px-5 py-3 text-right">Recaudación Total</th>
                          <th className="px-5 py-3 text-right">Pago Profesor</th>
                          <th className="px-5 py-3 text-right">Neto Caja</th>
                          <th className="px-5 py-3 text-left">Estado</th>
                          <th className="px-5 py-3 text-center w-36 print:hidden">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {liquidaciones.map((liq) => (
                          <tr key={liq.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">
                              {liq.profesor?.apellido}, {liq.profesor?.nombre}
                            </td>
                            <td className="px-5 py-3.5 text-sm text-slate-700">
                              {liq.curso_nombre || 'Curso Eliminado'}
                            </td>
                            <td className="px-5 py-3.5 text-sm text-right font-semibold text-slate-500 font-mono">
                              ${parseFloat(liq.total_recaudado).toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5 text-sm text-right font-bold text-brand-teal font-mono">
                              ${parseFloat(liq.monto_profesor).toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5 text-sm text-right font-semibold text-slate-750 font-mono">
                              ${parseFloat(liq.monto_caja).toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5 text-sm">
                              {liq.estado === 'Calculada' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  Calculada
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                  Pagada
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-center print:hidden">
                              {liq.estado === 'Calculada' ? (
                                <button
                                  onClick={() => handlePagarLiquidacion(liq.id)}
                                  className="btn btn-sm bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium cursor-pointer"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Pagar Comisión
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs italic">Comisión abonada</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PESTAÑA 2: REPORTE DE DEUDORES / MOROSOS */}
          {activeTab === 'deudores' && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white font-semibold text-xs tracking-wider uppercase px-5 py-3.5">
                Alumnos con Deudas Pendientes
              </div>
              {deudores.length === 0 ? (
                <div className="p-10 text-center text-slate-400 italic">¡Excelente! No hay alumnos particulares con deudas registradas.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                        <th className="px-5 py-3 text-left">Alumno</th>
                        <th className="px-5 py-3 text-left">Contacto</th>
                        <th className="px-5 py-3 text-left">Detalle de Meses e Importes</th>
                        <th className="px-5 py-3 text-right">Total Acumulado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {deudores.map((d) => (
                        <tr key={d.alumno_id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5 text-sm font-bold text-slate-800">
                            {d.apellido}, {d.nombre}
                            <span className="text-xs text-slate-400 block font-normal font-mono">DNI: {d.dni}</span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-500 space-y-0.5 font-medium">
                            {d.telefono && <div>Tel: {d.telefono}</div>}
                            {d.email && <div className="text-xs">{d.email}</div>}
                          </td>
                          <td className="px-5 py-3.5 text-sm">
                            <div className="space-y-1.5 max-w-md">
                              {d.cuotas_detalles.map((c, idx) => (
                                <div key={idx} className="flex justify-between bg-slate-50 p-2 rounded border border-slate-100 text-xs text-slate-650">
                                  <span>{c.curso_nombre} (Mes {c.mes_anio})</span>
                                  <span className="font-semibold text-red-650">Falta: ${c.deuda.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-right font-extrabold text-red-600 font-mono text-base">
                            ${parseFloat(d.total_deuda).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA 3: REPORTE DE ASISTENCIA POR CURSO */}
          {activeTab === 'asistencia' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex items-center gap-4 print:hidden">
                <div className="flex flex-col gap-0.5 flex-1 max-w-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seleccionar Curso</span>
                  <select
                    value={selectedCursoId}
                    onChange={(e) => setSelectedCursoId(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none cursor-pointer focus:border-brand-teal"
                  >
                    {cursos.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {asistenciaCurso && (
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white font-semibold text-xs tracking-wider uppercase px-5 py-3.5 flex justify-between">
                    <span>Métricas de Asistencia del Curso</span>
                    <span>Total Clases Dictadas: {asistenciaCurso.total_clases_dictadas}</span>
                  </div>

                  {asistenciaCurso.alumnos.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 italic">No hay clases dictadas o alumnos registrados para este curso.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                            <th className="px-5 py-3 text-left">Alumno</th>
                            <th className="px-5 py-3 text-left w-36">DNI</th>
                            <th className="px-5 py-3 text-center w-28">Presentes</th>
                            <th className="px-5 py-3 text-center w-28">Ausencias</th>
                            <th className="px-5 py-3 text-right w-44">Porcentaje de Asistencia</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {asistenciaCurso.alumnos.map((alu) => (
                            <tr key={alu.alumno_id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">
                                {alu.apellido}, {alu.nombre}
                              </td>
                              <td className="px-5 py-3.5 text-sm text-slate-500 font-mono">
                                {alu.dni}
                              </td>
                              <td className="px-5 py-3.5 text-sm text-center font-bold text-green-700 font-mono">
                                {alu.presents}
                              </td>
                              <td className="px-5 py-3.5 text-sm text-center font-bold text-red-650 font-mono">
                                {alu.absents}
                              </td>
                              <td className="px-5 py-3.5 text-sm text-right">
                                <div className="flex items-center justify-end gap-3">
                                  <span className={`font-bold text-sm ${
                                    alu.porcentaje_asistencia >= 80 ? 'text-green-700' :
                                    alu.porcentaje_asistencia >= 50 ? 'text-amber-600' : 'text-red-600'
                                  }`}>
                                    {alu.porcentaje_asistencia}%
                                  </span>
                                  <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                                    <div
                                      className={`h-full rounded-full ${
                                        alu.porcentaje_asistencia >= 80 ? 'bg-green-600' :
                                        alu.porcentaje_asistencia >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${alu.porcentaje_asistencia}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA 4: ESTADÍSTICAS DE INGRESOS */}
          {activeTab === 'ingresos' && ingresosData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Histórico 6 meses */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white font-semibold text-xs tracking-wider uppercase px-5 py-3.5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Historial de Recaudación (Últimos 6 meses)
                </div>
                {ingresosData.historico.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 italic">No hay ingresos registrados históricos.</div>
                ) : (
                  <div className="p-5 space-y-4">
                    {ingresosData.historico.map((row, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm font-semibold text-slate-700">
                          <span>{row.mes_anio}</span>
                          <span className="font-mono">${row.total.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/50">
                          <div
                            className="bg-brand-teal h-full rounded-full"
                            style={{ 
                              width: `${(row.total / Math.max(...ingresosData.historico.map(h => h.total), 1)) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Desglose mes actual */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white font-semibold text-xs tracking-wider uppercase px-5 py-3.5 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Recaudación por Curso (Mes {ingresosData.mes_actual})
                </div>
                {ingresosData.desglose_mes_actual.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 italic">Aún no se registraron cobros de cuotas en este mes.</div>
                ) : (
                  <div className="p-5 space-y-4">
                    {ingresosData.desglose_mes_actual.map((row, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm font-semibold text-slate-700">
                          <span>{row.curso_nombre}</span>
                          <span className="font-mono text-brand-teal-mid">${row.total.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/50">
                          <div
                            className="bg-brand-teal-mid h-full rounded-full"
                            style={{ 
                              width: `${(row.total / Math.max(...ingresosData.desglose_mes_actual.map(d => d.total), 1)) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
