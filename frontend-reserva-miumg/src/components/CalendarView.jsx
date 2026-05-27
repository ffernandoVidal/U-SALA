import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const legendItems = [
  { color: '#fef9c3', border: '#eab308', label: 'Pendiente' },
  { color: '#dcfce7', border: '#22c55e', label: 'Aprobada' },
  { color: '#fee2e2', border: '#ef4444', label: 'Rechazada' },
];

export default function CalendarView({ eventos, onDateClick, onEventClick }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    }}>
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
        fontSize: '13px',
        borderBottom: '1px solid #f1f5f9',
        paddingBottom: '12px',
      }}>
        <span style={{ fontWeight: '600', color: '#475569' }}>Leyenda:</span>
        {legendItems.map(item => (
          <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '12px', height: '12px', borderRadius: '3px',
              backgroundColor: item.color, border: `1px solid ${item.border}`,
            }} />
            {item.label}
          </span>
        ))}
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="es"
        events={eventos}
        headerToolbar={{ left: 'title', center: '', right: 'prev,next today' }}
        height="560px"
        dateClick={onDateClick}
        eventClick={onEventClick}
      />
    </div>
  );
}
