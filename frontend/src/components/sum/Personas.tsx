// @ts-nocheck
import { useState, useEffect } from 'react';
import { Search, UserPlus, Edit2, Trash2, Check, X, ShieldAlert } from 'lucide-react';
import axios from 'axios';

export default function Personas() {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'alumno', 'profesor'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'inactive'
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    es_afiliado: false,
    es_profesor: false,
    es_alumno: false,
    activo: true
  });
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPersonas = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/personas/');
      setPersonas(res.data);
      setErrorMsg('');
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al cargar la lista de personas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      dni: '',
      email: '',
      telefono: '',
      es_afiliado: false,
      es_profesor: false,
      es_alumno: false,
      activo: true
    });
    setEditingId(null);
    setShowForm(false);
    setErrorMsg('');
  };

  const handleEditClick = (persona) => {
    setFormData({
      nombre: persona.nombre,
      apellido: persona.apellido,
      dni: persona.dni,
      email: persona.email || '',
      telefono: persona.telefono || '',
      es_afiliado: persona.es_afiliado,
      es_profesor: persona.es_profesor,
      es_alumno: persona.es_alumno,
      activo: persona.activo
    });
    setEditingId(persona.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.dni.trim()) {
      setErrorMsg('Nombre, Apellido y DNI son campos obligatorios.');
      return;
    }

    try {
      if (editingId) {
        await axios.put(`/api/personas/${editingId}`, formData);
        setSuccessMsg('Persona actualizada correctamente.');
      } else {
        await axios.post('/api/personas/', formData);
        setSuccessMsg('Persona agregada correctamente.');
      }
      resetForm();
      fetchPersonas();
    } catch (e) {
      console.error(e);
      setErrorMsg(e.response?.data?.detail || 'Error al guardar los datos de la persona.');
    }
  };

  const handleDeleteClick = async (id) => {
    if (!confirm('¿Está seguro de que desea eliminar o desactivar esta persona?')) return;
    try {
      const res = await axios.delete(`/api/personas/${id}`);
      setSuccessMsg(res.data.message);
      fetchPersonas();
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al intentar eliminar la persona.');
    }
  };

  // Filtrado de la lista en memoria
  const filteredPersonas = personas.filter(p => {
    // Filtro búsqueda text
    const term = search.toLowerCase();
    const matchesSearch = 
      p.nombre.toLowerCase().includes(term) ||
      p.apellido.toLowerCase().includes(term) ||
      p.dni.includes(term);

    // Filtro de rol
    let matchesRole = true;
    if (roleFilter === 'alumno') matchesRole = p.es_alumno;
    else if (roleFilter === 'profesor') matchesRole = p.es_profesor;

    // Filtro de activo
    let matchesActive = true;
    if (activeFilter === 'active') matchesActive = p.activo;
    else if (activeFilter === 'inactive') matchesActive = !p.activo;

    return matchesSearch && matchesRole && matchesActive;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-teal">Gestión de Personas</h1>
          <p className="text-sm text-slate-500">Administrá los alumnos, profesores y afiliados en el sistema.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn bg-brand-teal text-white hover:bg-brand-teal-mid flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-97 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Registrar Persona
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
            {editingId ? 'Editar Persona' : 'Registrar Nueva Persona'}
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej. Juan"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  placeholder="Ej. Pérez"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">DNI / Identificación</label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleInputChange}
                  placeholder="Ej. 35123456"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Ej. juan.perez@example.com"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="Ej. 3874123456"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Roles y Estado</label>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="es_alumno"
                    checked={formData.es_alumno}
                    onChange={handleInputChange}
                    className="w-4.5 h-4.5 text-brand-teal border-slate-300 rounded focus:ring-brand-teal"
                  />
                  ¿Es Alumno / Asistente?
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="es_profesor"
                    checked={formData.es_profesor}
                    onChange={handleInputChange}
                    className="w-4.5 h-4.5 text-brand-teal border-slate-300 rounded focus:ring-brand-teal"
                  />
                  ¿Es Profesor?
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="es_afiliado"
                    checked={formData.es_afiliado}
                    onChange={handleInputChange}
                    className="w-4.5 h-4.5 text-brand-teal border-slate-300 rounded focus:ring-brand-teal"
                  />
                  ¿Es Afiliado de la Caja? (Asiste gratis)
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleInputChange}
                    className="w-4.5 h-4.5 text-brand-teal border-slate-300 rounded focus:ring-brand-teal"
                  />
                  Activo en el Sistema
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
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
                {editingId ? 'Guardar Cambios' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Listado con filtros */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden animate-card-fade">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por DNI, Nombre o Apellido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-slate-900 text-sm focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none cursor-pointer focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15"
            >
              <option value="all">Todos los Roles</option>
              <option value="alumno">Alumnos / Asistentes</option>
              <option value="profesor">Profesores</option>
            </select>

            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none cursor-pointer focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15"
            >
              <option value="all">Todos los Estados</option>
              <option value="active">Solo Activos</option>
              <option value="inactive">Solo Inactivos</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            Cargando personas...
          </div>
        ) : filteredPersonas.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No se encontraron personas con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white text-xs font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Apellido y Nombre</th>
                  <th className="px-5 py-3 text-left">DNI</th>
                  <th className="px-5 py-3 text-left">Contacto</th>
                  <th className="px-5 py-3 text-left">Roles</th>
                  <th className="px-5 py-3 text-left">Estado</th>
                  <th className="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPersonas.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">
                      {p.apellido}, {p.nombre}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 font-mono">
                      {p.dni}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 space-y-0.5">
                      {p.email && <div className="truncate max-w-[200px]">{p.email}</div>}
                      {p.telefono && <div>{p.telefono}</div>}
                      {!p.email && !p.telefono && <span className="text-slate-300">-</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm space-x-1.5">
                      {p.es_alumno && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-150">
                          Alumno
                        </span>
                      )}
                      {p.es_profesor && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-150">
                          Profesor
                        </span>
                      )}
                      {p.es_afiliado && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-150">
                          Afiliado
                        </span>
                      )}
                      {!p.es_alumno && !p.es_profesor && !p.es_afiliado && (
                        <span className="text-slate-350 italic text-xs">Sin Rol</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      {p.activo ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-brand-teal-dim hover:border-brand-teal/30 hover:text-brand-teal text-slate-500 rounded-lg transition-all cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(p.id)}
                          className="p-1.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-650 rounded-lg transition-all cursor-pointer"
                          title="Eliminar / Desactivar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
