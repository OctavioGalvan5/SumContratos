// @ts-nocheck
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { X } from 'lucide-react';

const locales = { 'es': es };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const adjustDate = (d) => {
  const date = new Date(d);
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  return date;
};

const getTipoVencimiento = (c) => {
  const hoy = new Date();
  const fVenc = adjustDate(c.fecha_vencimiento);
  if (fVenc < hoy) return 'vencido';
  const diff = differenceInDays(fVenc, hoy);
  if (diff <= c.dias_aviso_alarma) return 'proximo';
  return 'activo';
};

const COLORES = {
  inicio:  { bg: '#0d9488', hover: '#0f766e' },
  activo:  { bg: '#22c55e', hover: '#16a34a' },
  proximo: { bg: '#f59e0b', hover: '#d97706' },
  vencido: { bg: '#ef4444', hover: '#dc2626' },
};

export default function Calendario() {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);

  useEffect(() => {
    fetchContratos();
  }, []);

  const fetchContratos = async () => {
    try {
      const res = await axios.get('/api/contratos/');
      const contratos = res.data.filter(c => !c.bloqueado);
      const newEventos = [];

      contratos.forEach(c => {
        if (c.fecha_inicio) {
          newEventos.push({
            id: c.id + '_inicio',
            title: `▶ ${c.titular}`,
            start: adjustDate(c.fecha_inicio),
            end: adjustDate(c.fecha_inicio),
            allDay: true,
            tipo: 'inicio',
            contrato: c,
          });
        }
        if (c.fecha_vencimiento) {
          const tipo = getTipoVencimiento(c);
          newEventos.push({
            id: c.id + '_fin',
            title: `● ${c.titular}`,
            start: adjustDate(c.fecha_vencimiento),
            end: adjustDate(c.fecha_vencimiento),
            allDay: true,
            tipo,
            contrato: c,
          });
        }
      });

      setEventos(newEventos);
    } catch (e) {
      console.error(e);
    }
  };

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: COLORES[event.tipo]?.bg ?? '#6b7280',
      borderRadius: '5px',
      color: 'white',
      border: 'none',
      padding: '2px 6px',
      fontSize: '0.75rem',
      fontWeight: '600',
      cursor: 'pointer',
    },
  });

  const handleSelectEvent = (event) => {
    setEventoSeleccionado(event);
  };

  const c = eventoSeleccionado?.contrato;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Calendario de Contratos</h2>
        {/* Leyenda */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORES.inicio.bg }} />
            Inicio
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORES.activo.bg }} />
            Activo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORES.proximo.bg }} />
            Por vencer
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORES.vencido.bg }} />
            Vencido
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6" style={{ height: 'calc(100vh - 220px)', minHeight: '420px' }}>
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          culture="es"
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          messages={{
            next: "›",
            previous: "‹",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            noEventsInRange: "Sin contratos este período.",
            showMore: (n) => `+${n} más`,
          }}
          style={{ height: '100%' }}
        />
      </div>

      {/* Popup detalle evento */}
      {eventoSeleccionado && c && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEventoSeleccionado(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div
              className="flex items-center justify-between px-5 py-3 rounded-t-xl"
              style={{ backgroundColor: COLORES[eventoSeleccionado.tipo]?.bg }}
            >
              <p className="text-white font-semibold text-sm">
                {eventoSeleccionado.tipo === 'inicio' ? 'Inicio de contrato' : 'Vencimiento de contrato'}
              </p>
              <button onClick={() => setEventoSeleccionado(null)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Titular</p>
                <p className="font-semibold text-gray-900">{c.titular}</p>
              </div>
              {c.categoria && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Categoría</p>
                  <p className="text-gray-700">{c.categoria.nombre}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Inicio</p>
                  <p className="text-gray-700">{format(adjustDate(c.fecha_inicio), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Vencimiento</p>
                  <p className="text-gray-700">{format(adjustDate(c.fecha_vencimiento), 'dd/MM/yyyy')}</p>
                </div>
              </div>
              {c.observaciones && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Observaciones</p>
                  <p className="text-gray-700">{c.observaciones}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
