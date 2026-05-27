// @ts-nocheck
import { useState, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, Save } from 'lucide-react';

export default function ContratoForm() {
  const [formData, setFormData] = useState({
    titular: '',
    categoria_id: '',
    fecha_inicio: '',
    fecha_vencimiento: '',
    observaciones: '',
    dias_aviso_alarma: 30
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    const fetchCat = async () => {
      try {
        const res = await axios.get('/api/categorias/');
        setCategorias(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCat();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (file) {
        data.append('file', file);
      }

      await axios.post('/api/contratos/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccessMsg('Contrato guardado exitosamente.');
      setFormData({
        titular: '', categoria_id: '', fecha_inicio: '', fecha_vencimiento: '', observaciones: '', dias_aviso_alarma: 30
      });
      setFile(null);
      // Reset file input manually if needed
      document.getElementById('file-upload').value = "";
    } catch (error) {
      console.error(error);
      alert('Error al guardar el contrato.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Registrar Nuevo Contrato</h2>
      
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg relative">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-8 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Titular / Contraparte *</label>
            <input 
              type="text" 
              name="titular" 
              required
              value={formData.titular} 
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ej. Juan Pérez o Ascensores SA"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Categoría</label>
            <select 
              name="categoria_id" 
              value={formData.categoria_id} 
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">-- Sin categoría --</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Fecha de Inicio *</label>
            <input 
              type="date" 
              name="fecha_inicio" 
              required
              value={formData.fecha_inicio} 
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Fecha de Vencimiento *</label>
            <input 
              type="date" 
              name="fecha_vencimiento" 
              required
              value={formData.fecha_vencimiento} 
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Observaciones</label>
          <textarea 
            name="observaciones" 
            rows="3"
            value={formData.observaciones} 
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Detalles adicionales..."
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Alarma de Vencimiento (Días antes) *
            </label>
            <div className="flex items-center">
              <input 
                type="number" 
                name="dias_aviso_alarma" 
                min="1"
                required
                value={formData.dias_aviso_alarma} 
                onChange={handleChange}
                className="w-24 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="ml-3 text-sm text-gray-500">días previos al vencimiento</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Archivo del Contrato (PDF, Word)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click para subir</span> o arrastrar
                  </p>
                  <p className="text-xs text-gray-500">
                    {file ? file.name : 'MAX. 10MB'}
                  </p>
                </div>
                <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end sm:justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Guardar Contrato
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
