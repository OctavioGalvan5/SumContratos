// @ts-nocheck
import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Download, Search, Lock, Unlock, EyeOff } from 'lucide-react';

export default function ContratosList() {
  const [contratos, setContratos] = useState([]);
  const [search, setSearch] = useState('');
  const [mostrarBloqueados, setMostrarBloqueados] = useState(false);

  useEffect(() => {
    fetchContratos();
  }, []);

  const fetchContratos = async () => {
    try {
      const res = await axios.get('/api/contratos/');
      setContratos(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = async (id) => {
    try {
      const res = await axios.get(`/api/contratos/${id}/archivo`);
      window.open(res.data.url, '_blank');
    } catch (e) {
      alert("No se pudo obtener el archivo o no existe.");
    }
  };

  const handleToggleBloqueo = async (id) => {
    try {
      await axios.put(`/api/contratos/${id}/toggle-bloqueo`);
      fetchContratos();
    } catch (e) {
      alert("No se pudo cambiar el estado del contrato.");
    }
  };

  const bloqueadosCount = contratos.filter(c => c.bloqueado).length;

  const filtered = contratos.filter(c => {
    if (c.bloqueado && !mostrarBloqueados) return false;
    return (
      c.titular.toLowerCase().includes(search.toLowerCase()) ||
      (c.categoria && c.categoria.nombre.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const getEstado = (c) => {
    if (c.bloqueado) return 'Deshabilitado';
    const fVenc = new Date(c.fecha_vencimiento);
    if (c.estado === 'Vencido' || fVenc < new Date()) return 'Vencido';
    return 'Activo';
  };

  const estadoBadge = (estado) => {
    if (estado === 'Activo') return 'bg-green-100 text-green-700';
    if (estado === 'Vencido') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-500';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Lista de Contratos</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {bloqueadosCount > 0 && (
            <button
              onClick={() => setMostrarBloqueados(!mostrarBloqueados)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors
                ${mostrarBloqueados
                  ? 'bg-gray-100 border-gray-300 text-gray-700'
                  : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}
            >
              <EyeOff className="w-4 h-4" />
              <span className="hidden sm:inline">{mostrarBloqueados ? 'Ocultar deshabilitados' : `Mostrar deshabilitados (${bloqueadosCount})`}</span>
              <span className="sm:hidden">{mostrarBloqueados ? 'Ocultar' : `Deshabl. (${bloqueadosCount})`}</span>
            </button>
          )}
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {filtered.map((c) => {
          const estado = getEstado(c);
          return (
            <div key={c.id} className={`bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3 ${c.bloqueado ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">{c.titular}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.categoria?.nombre || 'Sin categoría'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${estadoBadge(estado)}`}>
                  {estado}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Inicio: <span className="text-gray-700 font-medium">{format(new Date(c.fecha_inicio), 'dd/MM/yyyy')}</span></span>
                <span>Vence: <span className={`font-medium ${estado === 'Vencido' ? 'text-red-600' : 'text-gray-700'}`}>{format(new Date(c.fecha_vencimiento), 'dd/MM/yyyy')}</span></span>
              </div>
              <div className="flex justify-end gap-3 pt-1 border-t border-gray-100">
                {c.archivo_path ? (
                  <button
                    onClick={() => handleDownload(c.id)}
                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Archivo
                  </button>
                ) : (
                  <span className="text-xs text-gray-300">Sin archivo</span>
                )}
                <button
                  onClick={() => handleToggleBloqueo(c.id)}
                  className={`flex items-center gap-1 text-sm transition-colors ${c.bloqueado ? 'text-gray-400 hover:text-green-600' : 'text-gray-400 hover:text-red-600'}`}
                >
                  {c.bloqueado ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {c.bloqueado ? 'Habilitar' : 'Deshabilitar'}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 px-6 py-8 text-center text-gray-500">
            No se encontraron contratos.
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Titular / Contraparte</th>
              <th className="px-6 py-4 font-medium">Categoría</th>
              <th className="px-6 py-4 font-medium">F. Inicio</th>
              <th className="px-6 py-4 font-medium">F. Vencimiento</th>
              <th className="px-6 py-4 font-medium">Estado</th>
              <th className="px-6 py-4 font-medium text-center">Archivo</th>
              <th className="px-6 py-4 font-medium text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => {
              const estado = getEstado(c);
              return (
                <tr key={c.id} className={`hover:bg-gray-50/50 transition-colors ${c.bloqueado ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4 font-medium text-gray-900">{c.titular}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{c.categoria?.nombre || '-'}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{format(new Date(c.fecha_inicio), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{format(new Date(c.fecha_vencimiento), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${estadoBadge(estado)}`}>
                      {estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {c.archivo_path ? (
                      <button
                        onClick={() => handleDownload(c.id)}
                        className="text-primary-600 hover:text-primary-800 transition-colors inline-flex items-center"
                        title="Descargar/Ver Archivo"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    ) : (
                      <span className="text-gray-300 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleBloqueo(c.id)}
                      className={`transition-colors inline-flex items-center ${c.bloqueado ? 'text-gray-400 hover:text-green-600' : 'text-gray-400 hover:text-red-600'}`}
                      title={c.bloqueado ? 'Habilitar contrato' : 'Deshabilitar contrato'}
                    >
                      {c.bloqueado ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No se encontraron contratos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
