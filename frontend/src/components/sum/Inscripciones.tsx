// @ts-nocheck
import { useState, useEffect } from 'react';
import { Search, UserCheck, XCircle, Plus, Info, X, ShieldAlert } from 'lucide-react';
import axios from 'axios';

export default function Inscripciones() {
  const [inscripciones, setInscripciones] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [cursoFilter, setCursoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('Activa'); // Default show active
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    alumno_id: '',
    curso_id: '',
    fecha_inscripcion: new Date().toISOString().slice(0, 10),
    descuento_porcentaje: 0.0
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchInscripciones = async () => {
    try {
      setLoading(true);
      // Cargar inscripciones con filtros aplicados si hay
      let url = '/api/inscripciones/';
      const params = [];
      if (cursoFilter) params.push(`curso_id=${cursoFilter}`);
      if (estadoFilter && estadoFilter !== 'all') params.push(`estado=${estadoFilter}`);
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      const res = await axios.get(url);
      setInscripciones(res.data);
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al cargar las inscripciones.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlumnosCursos = async () => {
    try {
      // Cargar todas las personas activas (cualquiera se puede inscribir)
      const resAlu = await axios.get('/api/personas/?activo=true');
      setAlumnos(resAlu.data);
      
      // Cargar cursos activos
      const resCur = await axios.get('/api/cursos/?activo=true');
      setCursos(resCur.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInscripciones();
  }, [cursoFilter, estadoFilter]);

  useEffect(() => {
    fetchAlumnosCursos();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      alumno_id: '',
      curso_id: '',
      fecha_inscripcion: new Date().toISOString().slice(0, 10),
      descuento_porcentaje: 0.0
    });
    setShowForm(false);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.alumno_id || !formData.curso_id || !formData.fecha_inscripcion) {
      setErrorMsg('Seleccione un Alumno, un Curso y la Fecha de Inscripción.');
      return;
    }

    try {
      await axios.post('/api/inscripciones/', formData);
      setSuccessMsg('Inscripción registrada correctamente.');
      resetForm();
      fetchInscripciones();
    } catch (e) {
      console.error(e);
      setErrorMsg(e.response?.data?.detail || 'Error al registrar la inscripción.');
    }
  };

  const handleBajaClick = async (id) => {
    if (!confirm('¿Está seguro de que desea dar de baja al alumno de este curso?')) return;
    try {
      await axios.put(`/api/inscripciones/${id}`, {
        estado: 'Baja',
        fecha_baja: new Date().toISOString().slice(0, 10)
      });
      setSuccessMsg('Inscripción dada de baja correctamente.');
      fetchInscripciones();
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al tramitar la baja del alumno.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-teal">Inscripción de Alumnos</h1>
          <p className="text-sm text-slate-500">Inscribí alumnos a los cursos y administrá sus estados de alta y baja.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn bg-brand-teal text-white hover:bg-brand-teal-mid flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-97 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Inscribir Alumno
          </button>
        )}
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

      {/* Formulario (Registrar Inripción) */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden animate-card-fade">
          <div className="bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white font-semibold text-xs tracking-wider uppercase px-5 py-3.5">
            Registrar Nueva Inscripción
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Seleccionar Persona / Alumno</label>
                <select
                  name="alumno_id"
                  value={formData.alumno_id}
                  onChange={handleInputChange}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white outline-none cursor-pointer"
                  required
                >
                  <option value="">-- Seleccionar Persona --</option>
                  {alumnos.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.apellido}, {a.nombre} (DNI {a.dni}) {a.es_afiliado ? '[Afiliado]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Seleccionar Curso</label>
                <select
                  name="curso_id"
                  value={formData.curso_id}
                  onChange={handleInputChange}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white outline-none cursor-pointer"
                  required
                >
                  <option value="">-- Seleccionar Curso --</option>
                  {cursos.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (Cuota: ${parseFloat(c.costo_mensual_particular).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha de Inscripción</label>
                <input
                  type="date"
                  name="fecha_inscripcion"
                  value={formData.fecha_inscripcion}
                  onChange={handleInputChange}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white outline-none transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Descuento Personalizado (%)</label>
                <input
                  type="number"
                  name="descuento_porcentaje"
                  value={formData.descuento_porcentaje}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="1"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
              <button
                type="button"
                onClick={resetForm}
                className="btn border border-slate-200 text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn bg-brand-teal text-white hover:bg-brand-teal-mid px-5 py-2 rounded-lg text-sm font-medium shadow-sm transition-all cursor-pointer"
              >
                Inscribir Alumno
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Listado de inscripciones */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden animate-card-fade">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-sm font-bold text-slate-700">Inscripciones Existentes</span>
          
          <div className="flex flex-wrap gap-3">
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

            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none cursor-pointer focus:border-brand-teal"
            >
              <option value="all">Todos los Estados</option>
              <option value="Activa">Activa</option>
              <option value="Baja">Baja</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            Cargando inscripciones...
          </div>
        ) : inscripciones.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No hay registros de inscripciones para mostrar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white text-xs font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Alumno</th>
                  <th className="px-5 py-3 text-left">DNI</th>
                  <th className="px-5 py-3 text-left">Curso</th>
                  <th className="px-5 py-3 text-left">Fechas</th>
                  <th className="px-5 py-3 text-center">Descuento</th>
                  <th className="px-5 py-3 text-left">Estado</th>
                  <th className="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inscripciones.map((ins) => (
                  <tr key={ins.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">
                      {ins.alumno?.apellido}, {ins.alumno?.nombre}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 font-mono">
                      {ins.alumno?.dni}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-700">
                      {ins.curso_nombre || 'Curso Eliminado'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 space-y-0.5">
                      <div><strong className="text-[10px] text-slate-400 uppercase mr-1">Alta:</strong> {ins.fecha_inscripcion}</div>
                      {ins.fecha_baja && <div><strong className="text-[10px] text-slate-450 uppercase mr-1">Baja:</strong> {ins.fecha_baja}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-center font-semibold text-slate-700">
                      {parseFloat(ins.descuento_percentage || ins.descuento_porcentaje)}%
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      {ins.estado === 'Activa' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-150">
                          Baja
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {ins.estado === 'Activa' ? (
                        <button
                          onClick={() => handleBajaClick(ins.id)}
                          className="btn btn-sm bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Dar de Baja
                        </button>
                      ) : (
                        <span className="text-slate-350 italic text-xs">Sin acciones</span>
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
  );
}
