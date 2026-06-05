// @ts-nocheck
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Edit2, Users, Clock, Calendar, DollarSign,
  Percent, CheckCircle, AlertCircle, Search, BookOpen
} from 'lucide-react';

const DIAS = [
  { val: 0, label: 'Lunes' },
  { val: 1, label: 'Martes' },
  { val: 2, label: 'Miércoles' },
  { val: 3, label: 'Jueves' },
  { val: 4, label: 'Viernes' },
  { val: 5, label: 'Sábado' },
  { val: 6, label: 'Domingo' }
];

const MES_ACTUAL = new Date().toISOString().slice(0, 7);

const ESTADO_CUOTA_STYLES = {
  Pagado:   'bg-green-50 text-green-700 border-green-200',
  Parcial:  'bg-amber-50 text-amber-700 border-amber-200',
  Pendiente:'bg-red-50 text-red-700 border-red-200',
};

export default function CursoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [curso, setCurso] = useState(null);
  const [inscripciones, setInscripciones] = useState([]);
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [cursoRes, inscRes, cuotasRes] = await Promise.all([
          axios.get(`/api/cursos/${id}`),
          axios.get(`/api/inscripciones/?curso_id=${id}`),
          axios.get(`/api/cuotas/?curso_id=${id}&mes_anio=${MES_ACTUAL}`)
        ]);
        setCurso(cursoRes.data);
        setInscripciones(inscRes.data);
        setCuotas(cuotasRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-medium">
        Cargando detalle del curso...
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
        <BookOpen className="w-10 h-10 text-slate-300" />
        <p>Curso no encontrado.</p>
        <button onClick={() => navigate('/sum/cursos')} className="text-sm text-brand-teal underline">Volver a cursos</button>
      </div>
    );
  }

  const cuotaByAlumno = Object.fromEntries(cuotas.map(c => [c.alumno_id, c]));
  const activos = inscripciones.filter(i => i.estado === 'Activa');
  const pendientes = cuotas.filter(c => c.estado === 'Pendiente').length;
  const totalCobrado = cuotas
    .filter(c => c.estado === 'Pagado' || c.estado === 'Parcial')
    .reduce((sum, c) => sum + parseFloat(c.monto_pagado || 0), 0);

  // Activos primero, luego baja — filtrados por búsqueda
  const ordenados = [
    ...inscripciones.filter(i => i.estado === 'Activa'),
    ...inscripciones.filter(i => i.estado !== 'Activa'),
  ].filter(i => {
    const nombre = `${i.alumno?.apellido ?? ''} ${i.alumno?.nombre ?? ''}`.toLowerCase();
    return nombre.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/sum/cursos')}
            className="mt-1 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
            title="Volver a cursos"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-brand-teal">{curso.nombre}</h1>
              {curso.activo ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider">Activo</span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-500 border border-slate-300 uppercase tracking-wider">Inactivo</span>
              )}
            </div>
            {curso.descripcion && (
              <p className="text-sm text-slate-500 mt-1">{curso.descripcion}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate('/sum/cursos', { state: { editId: curso.id } })}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-brand-teal-dim hover:text-brand-teal hover:border-brand-teal/20 text-sm font-medium transition-all"
        >
          <Edit2 className="w-4 h-4" />
          Editar Curso
        </button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-brand-teal" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuota Particular</span>
          </div>
          <p className="text-xl font-bold text-slate-800">
            ${parseFloat(curso.costo_mensual_particular).toLocaleString('es-AR')}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">por mes</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Percent className="w-3.5 h-3.5 text-brand-teal" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comisión Profesor</span>
          </div>
          <p className="text-xl font-bold text-slate-800">{parseFloat(curso.porcentaje_profesor)}%</p>
          <p className="text-[10px] text-slate-400 mt-0.5">de lo recaudado</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar className="w-3.5 h-3.5 text-brand-teal" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Período</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">{curso.fecha_inicio}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {curso.fecha_fin ? `Fin: ${curso.fecha_fin}` : 'Sin fecha de fin'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-brand-teal" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Horarios</span>
          </div>
          <div className="space-y-0.5">
            {curso.horarios.length === 0 ? (
              <p className="text-xs text-slate-400">Sin horarios</p>
            ) : curso.horarios.map((h, i) => (
              <p key={i} className="text-xs font-medium text-slate-700">
                {DIAS.find(d => d.val === h.dia_semana)?.label}: {h.hora_inicio.slice(0, 5)}–{h.hora_fin.slice(0, 5)}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Profesores */}
      {curso.profesores.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Docentes Asignados</span>
          <div className="flex flex-wrap gap-2">
            {curso.profesores.map(p => (
              <span key={p.id} className="text-sm bg-brand-teal-dim text-brand-teal px-3 py-1 rounded-full font-medium border border-brand-teal/10">
                {p.apellido}, {p.nombre}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats del mes corriente */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
          <div className="p-2.5 bg-brand-teal-dim rounded-lg shrink-0">
            <Users className="w-5 h-5 text-brand-teal" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{activos.length}</p>
            <p className="text-xs text-slate-500">Inscriptos activos</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
          <div className="p-2.5 bg-amber-50 rounded-lg shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{pendientes}</p>
            <p className="text-xs text-slate-500">Cuotas pendientes — {MES_ACTUAL}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
          <div className="p-2.5 bg-green-50 rounded-lg shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">
              ${totalCobrado.toLocaleString('es-AR')}
            </p>
            <p className="text-xs text-slate-500">Cobrado este mes</p>
          </div>
        </div>
      </div>

      {/* Tabla de inscriptos */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50 flex-wrap">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-teal" />
            Personas Inscriptas
            <span className="ml-1 px-1.5 py-0.5 bg-brand-teal-dim text-brand-teal text-[10px] font-bold rounded-full">
              {inscripciones.length}
            </span>
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Buscar persona..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:border-brand-teal outline-none transition-all w-48"
            />
          </div>
        </div>

        {ordenados.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            No hay personas inscriptas en este curso.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Persona</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descuento</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuota {MES_ACTUAL}</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inscripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ordenados.map(ins => {
                  const cuota = cuotaByAlumno[ins.alumno_id];
                  const esAfiliado = ins.alumno?.es_afiliado;
                  const inactiva = ins.estado !== 'Activa';
                  return (
                    <tr key={ins.id} className={`hover:bg-slate-50 transition-colors ${inactiva ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">
                          {ins.alumno?.apellido}, {ins.alumno?.nombre}
                        </p>
                        <p className="text-[11px] text-slate-400">DNI {ins.alumno?.dni}</p>
                      </td>
                      <td className="px-4 py-3">
                        {esAfiliado ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-teal-dim text-brand-teal border border-brand-teal/10 uppercase tracking-wide">Afiliado</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">Particular</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {parseFloat(ins.descuento_porcentaje) > 0 ? (
                          <span className="text-green-700 font-semibold text-xs">{parseFloat(ins.descuento_porcentaje)}% desc.</span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {esAfiliado ? (
                          <span className="text-xs text-brand-teal font-medium">Bonificado</span>
                        ) : inactiva ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : cuota ? (
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${ESTADO_CUOTA_STYLES[cuota.estado] ?? ''}`}>
                              {cuota.estado}
                            </span>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              ${parseFloat(cuota.monto_esperado).toLocaleString('es-AR')}
                              {cuota.estado === 'Parcial' && ` · pagó $${parseFloat(cuota.monto_pagado).toLocaleString('es-AR')}`}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sin cuota generada</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          ins.estado === 'Activa'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {ins.estado}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">desde {ins.fecha_inscripcion}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
