// @ts-nocheck
import { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, User, Eye } from 'lucide-react';
import axios from 'axios';

const DIAS = [
  { val: 0, label: 'Lunes' },
  { val: 1, label: 'Martes' },
  { val: 2, label: 'Miércoles' },
  { val: 3, label: 'Jueves' },
  { val: 4, label: 'Viernes' },
  { val: 5, label: 'Sábado' }
];

// Generar colores harmoniosos basados en el ID del curso para diferenciar en la grilla
const COLORES = [
  { bg: 'bg-teal-50 border-teal-200 text-teal-800', badge: 'bg-teal-100 text-teal-800' },
  { bg: 'bg-indigo-50 border-indigo-200 text-indigo-800', badge: 'bg-indigo-100 text-indigo-800' },
  { bg: 'bg-sky-50 border-sky-200 text-sky-800', badge: 'bg-sky-100 text-sky-800' },
  { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', badge: 'bg-emerald-100 text-emerald-800' },
  { bg: 'bg-purple-50 border-purple-200 text-purple-800', badge: 'bg-purple-100 text-purple-800' },
  { bg: 'bg-amber-50 border-amber-200 text-amber-800', badge: 'bg-amber-100 text-amber-800' },
  { bg: 'bg-rose-50 border-rose-200 text-rose-800', badge: 'bg-rose-100 text-rose-800' },
];

export default function HorarioSemanal() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const fetchCursos = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/cursos/?activo=true');
      setCursos(res.data);
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al cargar los horarios de los cursos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCursos();
  }, []);

  // Mapeamos los horarios individuales de todos los cursos
  const getHorariosPlanos = () => {
    const list = [];
    cursos.forEach((c, idx) => {
      const color = COLORES[idx % COLORES.length];
      c.horarios.forEach(h => {
        list.push({
          cursoId: c.id,
          cursoNombre: c.nombre,
          profesores: c.profesores,
          dia_semana: h.dia_semana,
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
          color: color
        });
      });
    });
    // Ordenamos por hora de inicio
    return list.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  };

  const horariosPlanos = getHorariosPlanos();

  // Agrupar horarios planos por día de la semana
  const horariosPorDia = DIAS.map(d => {
    return {
      diaVal: d.val,
      diaLabel: d.label,
      items: horariosPlanos.filter(h => h.dia_semana === d.val)
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-teal">Horario Semanal del SUM</h1>
        <p className="text-sm text-slate-500">Vista consolidada de la ocupación del salón de lunes a sábado.</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center text-slate-500 font-medium">
          Cargando horarios...
        </div>
      ) : cursos.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-12 text-center text-slate-400">
          No hay cursos activos cargados en el sistema actualmente.
        </div>
      ) : (
        <>
          {/* Vista Desktop: Grilla Semanal */}
          <div className="hidden lg:grid grid-cols-6 gap-4 animate-card-fade">
            {horariosPorDia.map((dia) => (
              <div key={dia.diaVal} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="bg-brand-teal text-white font-semibold text-center py-2.5 text-xs uppercase tracking-wider">
                  {dia.diaLabel}
                </div>
                <div className="p-3 flex-1 space-y-3 bg-slate-50/50 overflow-y-auto">
                  {dia.items.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic text-center py-10">
                      Sin actividades
                    </div>
                  ) : (
                    dia.items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`border rounded-lg p-3 space-y-2 shadow-sm transition-all hover:shadow-md ${item.color.bg}`}
                      >
                        <div className="text-xs font-bold font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          {item.hora_inicio.slice(0, 5)} - {item.hora_fin.slice(0, 5)}
                        </div>
                        
                        <div className="font-bold text-xs leading-tight">
                          {item.cursoNombre}
                        </div>
                        
                        <div className="space-y-0.5">
                          {item.profesores.map(p => (
                            <div key={p.id} className="text-[10px] flex items-center gap-1 font-medium">
                              <User className="w-3 h-3 shrink-0 opacity-70" />
                              <span className="truncate">{p.apellido}, {p.nombre.charAt(0)}.</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Vista Mobile & Tablet: Timeline de Días */}
          <div className="lg:hidden space-y-4 animate-card-fade">
            {horariosPorDia.map((dia) => (
              <div key={dia.diaVal} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-brand-teal to-brand-teal-mid text-white font-semibold px-4 py-2.5 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>{dia.diaLabel}</span>
                  <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px]">
                    {dia.items.length} {dia.items.length === 1 ? 'actividad' : 'actividades'}
                  </span>
                </div>
                <div className="divide-y divide-slate-100 p-2">
                  {dia.items.length === 0 ? (
                    <div className="p-4 text-sm text-slate-400 italic text-center">
                      No hay actividades programadas para este día.
                    </div>
                  ) : (
                    dia.items.map((item, idx) => (
                      <div key={idx} className="p-3.5 flex items-start gap-4 hover:bg-slate-50/50 transition-all rounded-lg">
                        <div className="bg-brand-teal-dim border border-brand-teal/15 rounded-lg px-3 py-2 text-center shrink-0 w-24">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Horario</span>
                          <span className="text-xs font-bold font-mono text-brand-teal leading-tight block mt-0.5">
                            {item.hora_inicio.slice(0, 5)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            a {item.hora_fin.slice(0, 5)}
                          </span>
                        </div>
                        <div className="space-y-1 flex-1">
                          <h4 className="text-sm font-bold text-slate-800">{item.cursoNombre}</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {item.profesores.map(p => `${p.nombre} ${p.apellido}`).join(', ') || 'Sin docente'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
