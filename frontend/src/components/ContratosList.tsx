// @ts-nocheck
import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Download, Search } from 'lucide-react';

export default function ContratosList() {
  const [contratos, setContratos] = useState([]);
  const [search, setSearch] = useState('');

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

  const filtered = contratos.filter(c => 
    c.titular.toLowerCase().includes(search.toLowerCase()) ||
    (c.categoria && c.categoria.nombre.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Lista de Contratos</h2>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Titular / Contraparte</th>
              <th className="px-6 py-4 font-medium">Categoría</th>
              <th className="px-6 py-4 font-medium">F. Inicio</th>
              <th className="px-6 py-4 font-medium">F. Vencimiento</th>
              <th className="px-6 py-4 font-medium">Estado</th>
              <th className="px-6 py-4 font-medium text-center">Archivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{c.titular}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{c.categoria?.nombre || '-'}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{format(new Date(c.fecha_inicio), 'dd/MM/yyyy')}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{format(new Date(c.fecha_vencimiento), 'dd/MM/yyyy')}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                    ${c.estado === 'Activo' ? 'bg-green-100 text-green-700' : ''}
                    ${c.estado === 'Vencido' ? 'bg-red-100 text-red-700' : ''}
                  `}>
                    {c.estado}
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
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
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
