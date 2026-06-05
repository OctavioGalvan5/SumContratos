// @ts-nocheck
import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit2, BookOpen, Clock, Calendar, Check, X, ShieldAlert } from 'lucide-react';
import axios from 'axios';

const DIAS = [
  { val: 0, label: 'Lunes' },
  { val: 1, label: 'Martes' },
  { val: 2, label: 'Miércoles' },
  { val: 3, label: 'Jueves' },
  { val: 4, label: 'Viernes' },
  { val: 5, label: 'Sábado' },
  { val: 6, label: 'Domingo' }
];

export default function Cursos() {
  const [cursos, setCursos] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    costo_mensual_particular: 0.0,
    porcentaje_profesor: 50.0,
    fecha_inicio: '',
    fecha_fin: '',
    activo: true,
    profesores_ids: [],
    horarios: []
  });

  // Dynamic schedules inside the form
  const [tempHorario, setTempHorario] = useState({
    dia_semana: 0,
    hora_inicio: '18:00',
    hora_fin: '20:00'
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchCursos = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/cursos/');
      setCursos(res.data);
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al cargar la lista de cursos.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfesores = async () => {
    try {
      const res = await axios.get('/api/personas/?es_profesor=true&activo=true');
      setProfesores(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCursos();
    fetchProfesores();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProfessorsChange = (e) => {
    const options = e.target.options;
    const selectedIds = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedIds.push(options[i].value);
      }
    }
    setFormData(prev => ({
      ...prev,
      profesores_ids: selectedIds
    }));
  };

  const addHorarioItem = () => {
    // Validar horas
    if (tempHorario.hora_inicio >= tempHorario.hora_fin) {
      alert('La hora de inicio debe ser anterior a la hora de fin.');
      return;
    }
    
    // Evitar duplicados
    const duplicado = formData.horarios.some(h => 
      h.dia_semana === tempHorario.dia_semana && 
      h.hora_inicio === tempHorario.hora_inicio
    );
    if (duplicado) {
      alert('Ya existe un horario configurado para ese día y hora de inicio.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      horarios: [...prev.horarios, { ...tempHorario }]
    }));
  };

  const removeHorarioItem = (index) => {
    setFormData(prev => ({
      ...prev,
      horarios: prev.horarios.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      costo_mensual_particular: 0.0,
      porcentaje_profesor: 50.0,
      fecha_inicio: '',
      fecha_fin: '',
      activo: true,
      profesores_ids: [],
      horarios: []
    });
    setEditingId(null);
    setShowForm(false);
    setErrorMsg('');
  };

  const handleEditClick = (curso) => {
    setFormData({
      nombre: curso.nombre,
      descripcion: curso.descripcion || '',
      costo_mensual_particular: parseFloat(curso.costo_mensual_particular),
      porcentaje_profesor: parseFloat(curso.porcentaje_profesor),
      fecha_inicio: curso.fecha_inicio,
      fecha_fin: curso.fecha_fin || '',
      activo: curso.activo,
      profesores_ids: curso.profesores.map(p => p.id),
      horarios: curso.horarios.map(h => ({
        dia_semana: h.dia_semana,
        hora_inicio: h.hora_inicio.slice(0, 5),
        hora_fin: h.hora_fin.slice(0, 5)
      }))
    });
    setEditingId(curso.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.nombre.trim() || !formData.fecha_inicio) {
      setErrorMsg('El Nombre del Curso y la Fecha de Inicio son obligatorios.');
      return;
    }

    if (formData.horarios.length === 0) {
      setErrorMsg('Debe agregar al menos un día y horario de cursada.');
      return;
    }

    // Convertir campos vacíos a nulos
    const body = {
      ...formData,
      fecha_fin: formData.fecha_fin.trim() === '' ? null : formData.fecha_fin
    };

    try {
      if (editingId) {
        await axios.put(`/api/cursos/${editingId}`, body);
        setSuccessMsg('Curso actualizado correctamente.');
      } else {
        await axios.post('/api/cursos/', body);
        setSuccessMsg('Curso creado correctamente, y clases programadas generadas.');
      }
      resetForm();
      fetchCursos();
    } catch (e) {
      console.error(e);
      setErrorMsg(e.response?.data?.detail || 'Error al guardar los datos del curso.');
    }
  };

  const handleDeleteClick = async (id) => {
    if (!confirm('¿Está seguro de que desea eliminar o desactivar este curso?')) return;
    try {
      const res = await axios.delete(`/api/cursos/${id}`);
      setSuccessMsg(res.data.message);
      fetchCursos();
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al intentar eliminar el curso.');
    }
  };

  const filteredCursos = cursos.filter(c => 
    c.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-teal">Gestión de Cursos</h1>
          <p className="text-sm text-slate-500">Creá y administrá los cursos del SUM, asigná profesores y configurá horarios.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn bg-brand-teal text-white hover:bg-brand-teal-mid flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-97 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            Crear Curso
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

      {/* Formulario (Crear/Editar) */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden animate-card-fade">
          <div className="bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white font-semibold text-xs tracking-wider uppercase px-5 py-3.5">
            {editingId ? 'Editar Curso' : 'Crear Nuevo Curso'}
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre del Curso</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej. Taller de Teatro"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción / Detalles</label>
                <input
                  type="text"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Ej. Nivel inicial, orientado a oratoria"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Costo Mensual (Particulares)</label>
                <input
                  type="number"
                  name="costo_mensual_particular"
                  value={formData.costo_mensual_particular}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Porcentaje recaudado para el Profesor (%)</label>
                <input
                  type="number"
                  name="porcentaje_profesor"
                  value={formData.porcentaje_profesor}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.5"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha de Inicio</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleInputChange}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha de Fin (Opcional)</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleInputChange}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              {/* Asignación de Profesores */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Profesores Asignados (Ctrl + Click para multi-seleccionar)
                </label>
                {profesores.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded border border-amber-200">
                    No hay profesores registrados. Primero crea personas en la sección "Personas" con la opción de rol "Profesor" activada.
                  </p>
                ) : (
                  <select
                    multiple
                    value={formData.profesores_ids}
                    onChange={handleProfessorsChange}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white outline-none min-h-[100px]"
                  >
                    {profesores.map(p => (
                      <option key={p.id} value={p.id}>{p.apellido}, {p.nombre} (DNI {p.dni})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Días y Horarios */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Configuración de Horarios Semanales</label>
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <select
                    value={tempHorario.dia_semana}
                    onChange={(e) => setTempHorario(prev => ({ ...prev, dia_semana: parseInt(e.target.value) }))}
                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none flex-1 cursor-pointer"
                  >
                    {DIAS.map(d => (
                      <option key={d.val} value={d.val}>{d.label}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={tempHorario.hora_inicio}
                    onChange={(e) => setTempHorario(prev => ({ ...prev, hora_inicio: e.target.value }))}
                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none w-20"
                  />
                  <span className="text-slate-400 font-semibold text-xs">a</span>
                  <input
                    type="time"
                    value={tempHorario.hora_fin}
                    onChange={(e) => setTempHorario(prev => ({ ...prev, hora_fin: e.target.value }))}
                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none w-20"
                  />
                  <button
                    type="button"
                    onClick={addHorarioItem}
                    className="btn bg-brand-teal text-white hover:bg-brand-teal-mid px-2.5 py-1.5 rounded text-xs font-medium cursor-pointer"
                  >
                    Añadir
                  </button>
                </div>

                {/* Mostrar horarios agregados */}
                <div className="mt-2 space-y-1">
                  {formData.horarios.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No hay horarios definidos para este curso aún.</span>
                  ) : (
                    formData.horarios.map((h, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-slate-50 px-3 py-1.5 rounded border border-slate-100">
                        <span className="font-semibold text-slate-700 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {DIAS.find(d => d.val === h.dia_semana)?.label}: {h.hora_inicio} a {h.hora_fin}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeHorarioItem(i)}
                          className="text-red-500 hover:text-red-700 font-semibold"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleInputChange}
                  className="w-4.5 h-4.5 text-brand-teal border-slate-300 rounded focus:ring-brand-teal"
                />
                Curso Activo
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn border border-slate-200 text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn bg-brand-teal text-white hover:bg-brand-teal-mid px-5 py-2 rounded-lg text-sm font-medium shadow-sm cursor-pointer"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Curso'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Listado de Cursos */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden animate-card-fade">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar curso por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-slate-900 text-sm focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            Cargando cursos...
          </div>
        ) : filteredCursos.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No se encontraron cursos creados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {filteredCursos.map((c) => (
              <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-350 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{c.nombre}</h3>
                      {c.descripcion && <p className="text-xs text-slate-500 mt-1">{c.descripcion}</p>}
                    </div>
                    {c.activo ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider">
                        Activo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-500 border border-slate-300 uppercase tracking-wider">
                        Inactivo
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 bg-white p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cuota Particular</span>
                      <p className="text-sm font-semibold text-slate-700">${parseFloat(c.costo_mensual_particular).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Comisión Profe</span>
                      <p className="text-sm font-semibold text-slate-700">{parseFloat(c.porcentaje_profesor)}%</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Docentes</span>
                    <div className="flex flex-wrap gap-1">
                      {c.profesores.length === 0 ? (
                        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">Sin profesor asignado</span>
                      ) : (
                        c.profesores.map(p => (
                          <span key={p.id} className="text-xs bg-slate-200 text-slate-700 px-2.5 py-1 rounded font-medium">
                            {p.apellido}, {p.nombre}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Horarios de Cursada</span>
                    <div className="space-y-1">
                      {c.horarios.map((h, i) => (
                        <div key={i} className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {DIAS.find(d => d.val === h.dia_semana)?.label}: {h.hora_inicio.slice(0, 5)} - {h.hora_fin.slice(0, 5)}hs
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-4">
                  <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Inicio: {c.fecha_inicio} {c.fecha_fin ? `| Fin: ${c.fecha_fin}` : ''}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(c)}
                      className="p-2 bg-white border border-slate-250 hover:bg-brand-teal-dim hover:text-brand-teal hover:border-brand-teal/20 text-slate-500 rounded-lg transition-all cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(c.id)}
                      className="p-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-650 rounded-lg transition-all cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
