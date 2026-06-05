// @ts-nocheck
import { useState, useEffect } from 'react';
import { Calendar, Clock, Check, X, ShieldAlert, ArrowLeft, Save, Users, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function AsistenciaDia() {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [clases, setClases] = useState([]);
  const [loadingClases, setLoadingClases] = useState(true);
  
  // Active attendance session state
  const [selectedClase, setSelectedClase] = useState(null);
  const [asistenciasLista, setAsistenciasLista] = useState([]);
  const [observacionesClase, setObservacionesClase] = useState('');
  const [loadingAsistencias, setLoadingAsistencias] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchClases = async () => {
    try {
      setLoadingClases(true);
      setErrorMsg('');
      const res = await axios.get(`/api/clases/?fecha_inicio=${fecha}&fecha_fin=${fecha}`);
      setClases(res.data);
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al cargar las clases de la fecha seleccionada.');
    } finally {
      setLoadingClases(false);
    }
  };

  useEffect(() => {
    fetchClases();
  }, [fecha]);

  const startAsistenciaSession = async (clase) => {
    try {
      setLoadingAsistencias(true);
      setErrorMsg('');
      setSelectedClase(clase);
      setObservacionesClase(clase.observaciones || '');
      
      const res = await axios.get(`/api/clases/${clase.id}/asistencias_lista`);
      setAsistenciasLista(res.data);
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al cargar la lista de alumnos inscriptos.');
      setSelectedClase(null);
    } finally {
      setLoadingAsistencias(false);
    }
  };

  const handleCheckboxChange = (index, checked) => {
    setAsistenciasLista(prev => {
      const list = [...prev];
      list[index].presente = checked;
      return list;
    });
  };

  const handleStudentNoteChange = (index, note) => {
    setAsistenciasLista(prev => {
      const list = [...prev];
      list[index].observaciones = note;
      return list;
    });
  };

  const handleSaveAsistencia = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      observaciones_clase: observacionesClase,
      asistencias: asistenciasLista.map(a => ({
        alumno_id: a.alumno_id,
        presente: a.presente,
        observaciones: a.observaciones
      }))
    };

    try {
      await axios.post(`/api/clases/${selectedClase.id}/asistencia`, payload);
      setSuccessMsg('Asistencia registrada y clase guardada correctamente.');
      setSelectedClase(null);
      setAsistenciasLista([]);
      fetchClases();
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al guardar el registro de asistencia.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado dinámico */}
      {!selectedClase ? (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-teal">Asistencia del Día</h1>
            <p className="text-sm text-slate-500">Seleccioná una clase de la fecha para tomar o editar la asistencia.</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="bg-transparent border-none text-sm text-slate-700 outline-none font-medium cursor-pointer"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedClase(null)}
            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-teal">Registrar Asistencia</h1>
            <p className="text-sm text-slate-500">
              Curso: <strong>{selectedClase.curso_nombre}</strong> | {selectedClase.hora_inicio.slice(0,5)} a {selectedClase.hora_fin.slice(0,5)}hs
            </p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {errorMsg}
          </span>
          <button onClick={() => setErrorMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* --- VISTA 1: LISTADO DE CLASES DEL DÍA --- */}
      {!selectedClase && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden animate-card-fade">
          <div className="bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white font-semibold text-xs tracking-wider uppercase px-5 py-3.5">
            Clases del {fecha}
          </div>

          {loadingClases ? (
            <div className="p-12 text-center text-slate-500 font-medium">Cargando clases...</div>
          ) : clases.length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic">No hay clases programadas para esta fecha.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {clases.map((c) => (
                <div key={c.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/30 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="bg-brand-teal-dim border border-brand-teal/15 rounded-lg px-3 py-2 text-center shrink-0 w-24">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Horario</span>
                      <span className="text-xs font-bold font-mono text-brand-teal leading-tight block mt-0.5">
                        {c.hora_inicio.slice(0, 5)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        a {c.hora_fin.slice(0, 5)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-slate-800">{c.curso_nombre}</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Fecha de Cursada: {c.fecha}
                        </span>
                        {c.observaciones && (
                          <span className="text-xs text-slate-400 italic">
                            ({c.observaciones})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Badge de estado */}
                    {c.estado === 'Programada' && (
                      <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Programada
                      </span>
                    )}
                    {c.estado === 'Dictada' && (
                      <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                        Dictada
                      </span>
                    )}
                    {c.estado === 'Cancelada' && (
                      <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-150">
                        Cancelada
                      </span>
                    )}

                    {c.estado !== 'Cancelada' ? (
                      <button
                        onClick={() => startAsistenciaSession(c)}
                        className="btn bg-brand-teal text-white hover:bg-brand-teal-mid px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all cursor-pointer"
                      >
                        {c.estado === 'Dictada' ? 'Modificar Asistencia' : 'Tomar Asistencia'}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="btn border border-slate-200 text-slate-400 px-4 py-2 rounded-lg text-sm font-medium transition-all opacity-50 cursor-not-allowed"
                      >
                        Clase Suspendida
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- VISTA 2: SESIÓN ACTIVA TOMA DE ASISTENCIA --- */}
      {selectedClase && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden animate-card-fade">
          <div className="bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white font-semibold text-xs tracking-wider uppercase px-5 py-3.5 flex items-center justify-between">
            <span>Listado de Alumnos</span>
            <span>Fecha: {selectedClase.fecha}</span>
          </div>

          {loadingAsistencias ? (
            <div className="p-12 text-center text-slate-500 font-medium">Cargando lista de alumnos...</div>
          ) : asistenciasLista.length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic">
              No hay alumnos inscriptos con estado "Activa" en este curso para registrar asistencia.
            </div>
          ) : (
            <form onSubmit={handleSaveAsistencia} className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5 max-w-xl">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Observaciones Generales de la Clase</label>
                <input
                  type="text"
                  placeholder="Ej. Se dictó el módulo 1 de teatro corporal"
                  value={observacionesClase}
                  onChange={(e) => setObservacionesClase(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all"
                />
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm mt-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                      <th className="px-5 py-3 text-center w-20">Asistió</th>
                      <th className="px-5 py-3 text-left">Alumno</th>
                      <th className="px-5 py-3 text-left w-36">DNI</th>
                      <th className="px-5 py-3 text-left w-36">Afiliado</th>
                      <th className="px-5 py-3 text-left">Observaciones Alumno</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {asistenciasLista.map((a, i) => (
                      <tr key={a.alumno_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={a.presente}
                            onChange={(e) => handleCheckboxChange(i, e.target.checked)}
                            className="w-5 h-5 text-brand-teal border-slate-300 rounded focus:ring-brand-teal cursor-pointer"
                          />
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold text-slate-800">
                          {a.apellido}, {a.nombre}
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-600 font-mono">
                          {a.dni}
                        </td>
                        <td className="px-5 py-3 text-sm">
                          {a.es_afiliado ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                              Sí
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200 uppercase tracking-wider">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <input
                            type="text"
                            placeholder="Ej. Llegó tarde"
                            value={a.observaciones || ''}
                            onChange={(e) => handleStudentNoteChange(i, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs focus:border-brand-teal focus:bg-white outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => { setSelectedClase(null); setAsistenciasLista([]); }}
                  className="btn border border-slate-200 text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="btn bg-brand-teal text-white hover:bg-brand-teal-mid px-5 py-2 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Guardar Asistencia
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
