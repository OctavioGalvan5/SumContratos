// @ts-nocheck
import { useState, useEffect } from 'react';
import { Calendar, Trash2, Plus, Info, X, ShieldAlert } from 'lucide-react';
import axios from 'axios';

export default function Feriados() {
  const [feriados, setFeriados] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchFeriados = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/feriados/');
      setFeriados(res.data);
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al cargar la lista de feriados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeriados();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fecha || !descripcion.trim()) {
      setErrorMsg('Tanto la fecha como la descripción son campos obligatorios.');
      return;
    }

    try {
      await axios.post('/api/feriados/', { fecha, descripcion });
      setSuccessMsg('Feriado registrado correctamente. Las clases de este día fueron marcadas como Canceladas.');
      setFecha('');
      setDescripcion('');
      fetchFeriados();
    } catch (e) {
      console.error(e);
      setErrorMsg(e.response?.data?.detail || 'Error al registrar el feriado.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de que desea eliminar este feriado? Las clases canceladas por este feriado volverán a programarse.')) return;
    try {
      const res = await axios.delete(`/api/feriados/${id}`);
      setSuccessMsg(res.data.message);
      fetchFeriados();
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al eliminar el feriado.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-teal">Gestión de Feriados</h1>
        <p className="text-sm text-slate-500">Cargá las fechas de feriados del sistema para suspender clases automáticamente.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden h-fit animate-card-fade">
          <div className="bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white font-semibold text-xs tracking-wider uppercase px-5 py-3.5">
            Registrar Feriado
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha del Feriado</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción / Motivo</label>
              <input
                type="text"
                placeholder="Ej. Día de la Independencia"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all"
                required
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-150 rounded-lg text-xs text-blue-800 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                <strong>Automatización activa</strong>: Al registrar un feriado, el sistema marcará como **"Cancelada"** cualquier clase programada en este día y especificará el motivo del feriado.
              </p>
            </div>

            <button
              type="submit"
              className="w-full btn bg-brand-teal text-white hover:bg-brand-teal-mid flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Cargar Feriado
            </button>
          </form>
        </div>

        {/* Listado */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden animate-card-fade">
          <div className="bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white font-semibold text-xs tracking-wider uppercase px-5 py-3.5">
            Feriados Registrados
          </div>
          {loading ? (
            <div className="p-10 text-center text-slate-500 font-medium">Cargando...</div>
          ) : feriados.length === 0 ? (
            <div className="p-10 text-center text-slate-400 italic">No hay feriados nacionales o provinciales cargados en el sistema.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                    <th className="px-5 py-3 text-left w-40">Fecha</th>
                    <th className="px-5 py-3 text-left">Motivo / Descripción</th>
                    <th className="px-5 py-3 text-center w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feriados.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-800 font-mono">
                        {f.fecha}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-700">
                        {f.descripcion}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="p-1.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-650 rounded-lg transition-all cursor-pointer"
                          title="Eliminar Feriado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
