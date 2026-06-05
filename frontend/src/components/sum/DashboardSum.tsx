// @ts-nocheck
import { useState, useEffect } from 'react';
import { Users, BookOpen, DollarSign, Clock, ClipboardList, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function DashboardSum() {
  const [stats, setStats] = useState(null);
  const [clasesHoy, setClasesHoy] = useState([]);
  const [recientes, setRecientes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Stats
      const resStats = await axios.get('/api/reportes/dashboard');
      setStats(resStats.data);

      // Clases de hoy
      const resClases = await axios.get('/api/clases/hoy');
      setClasesHoy(resClases.data);

      // Recientes (cargar todas las cuotas pagadas y tomar las primeras 5)
      const resCuotas = await axios.get('/api/cuotas/?estado=Pagado');
      setRecientes(resCuotas.data.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        Cargando Panel de Control del SUM...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-teal">Panel de Control SUM</h1>
        <p className="text-sm text-slate-500">Bienvenido al sistema de administración del Salón de Usos Múltiples.</p>
      </div>

      {/* Tarjetas de Estadísticas (Stats Grid) */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-card-fade">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-all">
            <div className="p-3 bg-blue-50 text-blue-650 rounded-xl border border-blue-100 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alumnos Activos</span>
              <span className="text-2xl font-extrabold text-slate-800">{stats.alumnos_activos}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-all">
            <div className="p-3 bg-purple-50 text-purple-650 rounded-xl border border-purple-100 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Profesores</span>
              <span className="text-2xl font-extrabold text-slate-800">{stats.profesores_activos}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-all">
            <div className="p-3 bg-teal-50 text-teal-650 rounded-xl border border-teal-100 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cursos Activos</span>
              <span className="text-2xl font-extrabold text-slate-800">{stats.cursos_activos}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-all">
            <div className="p-3 bg-emerald-50 text-emerald-650 rounded-xl border border-emerald-100 shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recaudado ({stats.mes_actual})</span>
              <span className="text-2xl font-extrabold text-emerald-700">${stats.recaudado_mes.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de Deudores */}
      {stats && stats.deuda_mes > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-850 rounded-xl text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-card-fade">
          <div className="flex items-center gap-2.5 font-medium">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Hay cuotas pendientes por un total de <strong>${stats.deuda_mes.toLocaleString()}</strong> en el período {stats.mes_actual}.</span>
          </div>
          <Link
            to="/sum/reportes"
            className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 shrink-0 group"
          >
            Ver Reporte de Deudores
            <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}

      {/* Dos Columnas: Clases de Hoy y Últimos Pagos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-card-fade">
        {/* Clases de hoy */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white font-semibold text-xs tracking-wider uppercase px-5 py-3.5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-4.5 h-4.5" />
                Clases Programadas para Hoy
              </span>
              <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px]">
                {clasesHoy.length} hoy
              </span>
            </div>
            <div className="p-5 divide-y divide-slate-100">
              {clasesHoy.length === 0 ? (
                <div className="py-8 text-center text-slate-400 italic text-sm">No hay clases dictándose hoy.</div>
              ) : (
                clasesHoy.map((c) => (
                  <div key={c.id} className="py-3.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-slate-800">{c.curso_nombre}</h4>
                      <p className="text-xs text-slate-500 font-medium">Horario: {c.hora_inicio.slice(0,5)} a {c.hora_fin.slice(0,5)}hs</p>
                    </div>
                    <div>
                      {c.estado === 'Programada' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Programada
                        </span>
                      )}
                      {c.estado === 'Dictada' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                          Dictada
                        </span>
                      )}
                      {c.estado === 'Cancelada' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-150">
                          Cancelada
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <Link
              to="/sum/asistencia"
              className="text-xs font-bold text-brand-teal hover:text-brand-teal-mid flex items-center gap-1 group"
            >
              Ir a Tomar Asistencia
              <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Últimos pagos */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white font-semibold text-xs tracking-wider uppercase px-5 py-3.5 flex items-center gap-2">
              <DollarSign className="w-4.5 h-4.5" />
              Últimos Cobros Registrados (Pagados)
            </div>
            <div className="p-5 divide-y divide-slate-100">
              {recientes.length === 0 ? (
                <div className="py-8 text-center text-slate-400 italic text-sm">No se registraron cobros de cuotas todavía.</div>
              ) : (
                recientes.map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-slate-800">{r.alumno?.apellido}, {r.alumno?.nombre}</h4>
                      <p className="text-xs text-slate-500 font-medium">Curso: {r.curso_nombre} | Mes: {r.mes_anio}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-700 font-mono">${parseFloat(r.monto_pagado).toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">{r.metodo_pago}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <Link
              to="/sum/pagos"
              className="text-xs font-bold text-brand-teal hover:text-brand-teal-mid flex items-center gap-1 group"
            >
              Ir a Registrar Cobros
              <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
