// @ts-nocheck
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Tag, Trash2, Plus } from 'lucide-react';

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [nueva, setNueva] = useState('');

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const res = await axios.get('/api/categorias/');
      setCategorias(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nueva.trim()) return;
    try {
      await axios.post('/api/categorias/', { nombre: nueva });
      setNueva('');
      fetchCategorias();
    } catch (e) {
      console.error(e);
      alert('Error al crear categoría');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro de borrar esta categoría? Los contratos vinculados quedarán sin categoría.')) return;
    try {
      await axios.delete(`/api/categorias/${id}`);
      fetchCategorias();
    } catch (e) {
      console.error(e);
      alert('Error al borrar categoría');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Categorías de Contratos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Nueva Categoría</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
              <input 
                type="text" 
                required
                value={nueva} 
                onChange={(e) => setNueva(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ej. Ascensores"
              />
            </div>
            <button 
              type="submit" 
              className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Añadir
            </button>
          </form>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Categoría</th>
                  <th className="px-6 py-4 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categorias.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Tag className="w-4 h-4 text-primary-500 mr-3" />
                        <span className="font-medium text-gray-900">{c.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(c.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                        title="Borrar categoría"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {categorias.length === 0 && (
                  <tr>
                    <td colSpan="2" className="px-6 py-8 text-center text-gray-500">
                      No hay categorías registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
