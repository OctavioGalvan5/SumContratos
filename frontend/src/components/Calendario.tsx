// @ts-nocheck
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

export default function Calendario() {
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    fetchContratos();
  }, []);

  const fetchContratos = async () => {
    try {
      const res = await axios.get('/api/contratos/');
      const contratos = res.data;
      
      const newEventos = [];
      contratos.forEach(c => {
        // Evento Inicio
        if (c.fecha_inicio) {
          const start = new Date(c.fecha_inicio);
          // Ajustar por zona horaria para que no caiga el día anterior si es UTC 00:00
          start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
          newEventos.push({
            id: c.id + '_inicio',
            title: `Inicio: ${c.titular}`,
            start: start,
            end: start,
            allDay: true,
            tipo: 'inicio'
          });
        }
        // Evento Fin
        if (c.fecha_vencimiento) {
          const end = new Date(c.fecha_vencimiento);
          end.setMinutes(end.getMinutes() + end.getTimezoneOffset());
          newEventos.push({
            id: c.id + '_fin',
            title: `Vence: ${c.titular}`,
            start: end,
            end: end,
            allDay: true,
            tipo: 'fin'
          });
        }
      });
      setEventos(newEventos);
    } catch (e) {
      console.error(e);
    }
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = event.tipo === 'inicio' ? '#14b8a6' : '#ef4444'; // Teal para inicio, Rojo para fin
    let style = {
      backgroundColor: backgroundColor,
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block',
      padding: '2px 5px',
      fontSize: '0.8rem',
      fontWeight: '500'
    };
    return {
      style: style
    };
  };

  return (
    <div className="space-y-6 h-[80vh]">
      <h2 className="text-2xl font-bold text-gray-800">Calendario de Contratos</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          culture="es"
          eventPropGetter={eventStyleGetter}
          messages={{
            next: "Sig",
            previous: "Ant",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día"
          }}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}
