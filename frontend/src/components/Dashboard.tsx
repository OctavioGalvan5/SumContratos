// @ts-nocheck
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState({
    activos: 0,
    porVencer: 0,
    vencidos: 0
  });
  const [recientes, setRecientes] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/contratos/');
        const contratos = res.data;
        
        let activos = 0;
        let porVencer = 0;
        let vencidos = 0;
        const hoy = new Date();

        contratos.forEach(c => {
          if (c.bloqueado) return;
          const fVenc = new Date(c.fecha_vencimiento);
          const isVencido = c.estado === 'Vencido' || fVenc < hoy;
          if (isVencido) {
            vencidos++;
          } else {
            activos++;
            const diff = differenceInDays(fVenc, hoy);
            if (diff >= 0 && diff <= 30) {
              porVencer++;
            }
          }
        });

        setStats({ activos, porVencer, vencidos });
        
        // Sort by expiration date, exclude blocked
        const sorted = [...contratos]
          .filter(c => !c.bloqueado)
          .sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento));
        setRecientes(sorted.slice(0, 5));
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Panel de Control</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center hover:shadow-md transition-shadow">
          <div className="p-3 bg-teal-50 rounded-lg">
            <FileText className="w-8 h-8 text-teal-600" />
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500">Contratos Activos</p>
            <p className="text-3xl font-bold text-gray-900">{stats.activos}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center hover:shadow-md transition-shadow">
          <div className="p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500">Por vencer (30 días)</p>
            <p className="text-3xl font-bold text-gray-900">{stats.porVencer}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center hover:shadow-md transition-shadow">
          <div className="p-3 bg-red-50 rounded-lg">
            <CheckCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500">Vencidos</p>
            <p className="text-3xl font-bold text-gray-900">{stats.vencidos}</p>
          </div>
        </div>
      </div>

      {/* Próximos Vencimientos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-800">Próximos Vencimientos</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {recientes.map((c, i) => {
            const fVenc = new Date(c.fecha_vencimiento);
            const isVencido = c.estado === 'Vencido' || fVenc < new Date();
            return (
              <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.titular}</p>
                  <p className="text-xs text-gray-500 mt-1">{c.categoria?.nombre || 'Sin categoría'}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${isVencido ? 'text-red-600' : 'text-gray-900'}`}>
                    {format(fVenc, 'dd/MM/yyyy')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {isVencido ? 'Vencido' : 'Activo'}
                  </p>
                </div>
              </div>
            );
          })}
          {recientes.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              No hay contratos registrados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
