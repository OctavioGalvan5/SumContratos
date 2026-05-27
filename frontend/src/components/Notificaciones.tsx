// @ts-nocheck
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Check, Trash2 } from 'lucide-react';

export default function Notificaciones({ notificaciones, onResolved }) {
  
  const handleResolve = async (id) => {
    try {
      await axios.put(`/api/notificaciones/${id}/resolver`);
      onResolved();
    } catch (e) {
      console.error(e);
    }
  };

  if (notificaciones.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 flex flex-col items-center">
        <Bell className="w-8 h-8 text-gray-300 mb-2" />
        No tienes notificaciones nuevas
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">Notificaciones</h3>
        <span className="bg-primary-100 text-primary-700 text-xs py-0.5 px-2 rounded-full font-medium">
          {notificaciones.length} nuevas
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {notificaciones.map((n) => (
          <div key={n.id} className="p-4 hover:bg-gray-50 transition-colors group relative">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-2 h-2 mt-1.5 bg-red-500 rounded-full"></div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-800 leading-tight">
                  {n.mensaje}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Hace {formatDistanceToNow(new Date(n.fecha_creacion), { locale: es })}
                </p>
              </div>
              <div className="ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleResolve(n.id)}
                  className="p-1.5 bg-white text-gray-400 hover:text-green-600 border border-gray-200 rounded-md shadow-sm transition-colors"
                  title="Marcar como leída / Descartar"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
